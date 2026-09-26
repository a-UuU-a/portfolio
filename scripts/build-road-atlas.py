"""Download small OSM extracts and build the artwork's road graph (Python stdlib).

Run: python3 scripts/build-road-atlas.py
Raw responses are cached in the system temporary directory, outside the repository.
The published derived database is licensed under ODbL 1.0; see public/data/README.md.
"""

import concurrent.futures
import datetime
import json
import math
from pathlib import Path
import subprocess
import tempfile
import xml.etree.ElementTree as ET


AREAS = [
    ("Tokyo", "Japan", 35.683, 139.768),
    ("Paris", "France", 48.8566, 2.3522),
    ("New York", "United States", 40.723, -73.998),
    ("Venice", "Italy", 45.437, 12.332),
    ("Melbourne", "Australia", -37.8136, 144.9631),
    ("Marrakesh", "Morocco", 31.6295, -7.985),
]
WIDTH, HEIGHT = 1300, 1000
ROAD_TYPES = {
    "primary", "primary_link", "secondary", "secondary_link", "tertiary",
    "tertiary_link", "residential", "unclassified", "living_street",
    "pedestrian", "footway", "path", "steps", "service",
}
CACHE = Path(tempfile.gettempdir()) / "portfolio-road-atlas"
OUTPUT = Path(__file__).resolve().parents[1] / "public" / "data" / "road-atlas.json"


def clip(a, b):
    """Clip to the sample boundary, keeping roads that cross the viewport."""
    low, high = 0.0, 1.0
    for axis, extent in enumerate((WIDTH / 2, HEIGHT / 2)):
        delta = b[axis] - a[axis]
        if abs(delta) < 1e-9:
            if abs(a[axis]) > extent:
                return None
        else:
            enter, leave = sorted(((-extent - a[axis]) / delta, (extent - a[axis]) / delta))
            low, high = max(low, enter), min(high, leave)
            if low >= high:
                return None
    return low, high


def build_area(spec):
    name, country, lat, lon = spec
    longitude_scale = 111320 * math.cos(math.radians(lat))
    dx, dy = WIDTH / 2 / longitude_scale, HEIGHT / 2 / 111320
    bbox = f"{lon-dx:.7f},{lat-dy:.7f},{lon+dx:.7f},{lat+dy:.7f}"
    url = f"https://api.openstreetmap.org/api/0.6/map?bbox={bbox}"
    cached = CACHE / f"{name.lower().replace(' ', '-')}.osm"
    if not cached.exists():
        temporary = cached.with_suffix(".download")
        subprocess.run([
            "curl", "-f", "-sS", "--compressed", "--retry", "2", "--max-time", "150",
            url, "-o", str(temporary),
        ], check=True)
        ET.parse(temporary)  # Never cache an incomplete response.
        temporary.replace(cached)
    root = ET.parse(cached).getroot()
    coordinates = {
        node.attrib["id"]: (
            (float(node.attrib["lon"]) - lon) * longitude_scale,
            (lat - float(node.attrib["lat"])) * 111320,
        )
        for node in root.findall("node")
    }
    nodes, edges, indices, seen = [], [], {}, set()

    def index(key, point):
        if key not in indices:
            indices[key] = len(nodes)
            nodes.append([round(point[0], 2), round(point[1], 2)])
        return indices[key]

    for way in root.findall("way"):
        tags = {tag.attrib["k"]: tag.attrib["v"] for tag in way.findall("tag")}
        if tags.get("highway") not in ROAD_TYPES or tags.get("access") == "private":
            continue
        refs = [node.attrib["ref"] for node in way.findall("nd")]
        for first, second in zip(refs, refs[1:]):
            if first not in coordinates or second not in coordinates:
                continue
            a, b = coordinates[first], coordinates[second]
            clipped = clip(a, b)
            if clipped is None:
                continue
            low, high = clipped
            start = tuple(a[i] + low * (b[i] - a[i]) for i in range(2))
            end = tuple(a[i] + high * (b[i] - a[i]) for i in range(2))
            if math.dist(start, end) < 0.1:
                continue
            source = index(first if low == 0 else f"{first}:{second}:start", start)
            target = index(second if high == 1 else f"{first}:{second}:end", end)
            edge = tuple(sorted((source, target)))
            if edge not in seen:
                seen.add(edge)
                edges.append([source, target])
    if len(edges) < 20:
        raise ValueError(f"Insufficient road data for {name}")
    print(f"{name}: {len(nodes)} nodes, {len(edges)} edges", flush=True)
    return {
        "name": name, "country": country, "center": [lat, lon],
        "size": [WIDTH, HEIGHT], "nodes": nodes, "edges": edges,
    }


if __name__ == "__main__":
    CACHE.mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
        areas = list(pool.map(build_area, AREAS))
    result = {
        "source": "https://www.openstreetmap.org",
        "license": "https://opendatacommons.org/licenses/odbl/1-0/",
        "generated": datetime.datetime.now(datetime.timezone.utc).date().isoformat(),
        "areas": areas,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(result, separators=(",", ":")) + "\n")
    print(f"Wrote {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")
