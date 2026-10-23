const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");
const compiled = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../lib/ando.ts"), "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const compiledModule = { exports: {} };
new Function("module", "exports", "process", compiled)(compiledModule, compiledModule.exports, process);
const { globeVector, globeProjector, longitudeDifference, photoAnchorProgress, photoGlobeVector, photoClusterOffset, photoDensityScale, photoMapClearance, relaxPhotoLayout, buildingOrbitVector, clampGlobeZoom, globeZoomLimits, spreadMarkers, collectionPhotos, assetPath } = compiledModule.exports;

function overlapArea(cards) {
  let area = 0;
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      area += Math.max(0, (a.width + b.width) / 2 - Math.abs(a.x - b.x))
        * Math.max(0, (a.height + b.height) / 2 - Math.abs(a.y - b.y));
    }
  }
  return area;
}

function crowdedPhotos(bounds, progress = 1) {
  const compact = bounds.width < 600;
  return [3, 3, 3, 5, 4, 5].flatMap((count, group) => Array.from({ length: count }, (_, index) => {
    const [orderX, orderY] = photoClusterOffset(index, count, progress, compact);
    const angle = group * Math.PI / 3;
    const radius = (1 - progress) * bounds.width * 0.3 + 15;
    const scale = compact ? 0.4 + progress * 0.24 : 0.56 + progress * 0.34;
    return {
      id: `${group}/${index}`, groupId: `${group}`, orderX, orderY,
      x: bounds.width * 0.52 + orderX + Math.cos(angle) * radius,
      y: bounds.height * 0.48 + orderY + Math.sin(angle) * radius,
      width: 154 * scale, height: 141 * scale, weight: 1,
    };
  }));
}

function assertPhotoOrder(cards) {
  for (let i = 0; i < cards.length; i++) {
    for (let j = i + 1; j < cards.length; j++) {
      const a = cards[i], b = cards[j];
      if (a.groupId !== b.groupId) continue;
      for (const [axis, orderAxis] of [["x", "orderX"], ["y", "orderY"]]) {
        const order = a[orderAxis] - b[orderAxis];
        if (Math.abs(order) >= 1) assert.ok((a[axis] - b[axis]) * order >= 0, `${a.id}, ${b.id} reversed on ${axis}`);
      }
    }
  }
}

test("geographic center projects to the front, antipode to the back, and poles remain finite", () => {
  for (const [latitude, longitude] of [[34.56148, 135.00878], [48.8628, 2.3428], [32.7493, -97.3631], [90, 180], [-90, -180]]) {
    const project = globeProjector({ latitude, longitude, zoom: 1 });
    const [x, y, z] = project(globeVector(latitude, longitude));
    assert.ok(Math.abs(x) < 1e-10 && Math.abs(y) < 1e-10 && Math.abs(z - 1) < 1e-10);
    const antipode = project(globeVector(-latitude, longitude + 180));
    assert.ok(Math.abs(antipode[2] + 1) < 1e-10);
  }
});

test("rotation across the date line follows the short path", () => {
  assert.equal(longitudeDifference(179, -179), 2);
  assert.equal(longitudeDifference(-179, 179), -2);
  assert.equal(longitudeDifference(110, -97), 153);
});

test("zoom brings each building's photo group to its own coordinates, including across the date line and at the poles", () => {
  const orbit = globeVector(-42, -175);
  for (const [latitude, longitude] of [[35.6675248, 139.7305214], [31.35533, 121.26055], [20, 179], [20, -179], [90, 0], [-90, 180]]) {
    const anchor = globeVector(latitude, longitude);
    const project = globeProjector({ latitude, longitude, zoom: 1 });
    let previousDistance = Infinity;
    for (const zoom of [0.75, 1, 1.01, 1.25, 1.5, 2, 2.5, 3, 4, 8, 16, 32, 64]) {
      const vector = photoGlobeVector(orbit, anchor, photoAnchorProgress(zoom));
      assert.ok(vector.every(Number.isFinite));
      const distance = Math.hypot(...vector.map((value, index) => value - anchor[index]));
      assert.ok(distance <= previousDistance + 1e-10);
      previousDistance = distance;
      if (zoom >= 3) {
        const [x, y, z] = project(vector);
        assert.ok(Math.abs(x) < 1e-10 && Math.abs(y) < 1e-10 && Math.abs(z - 1) < 1e-10);
      }
    }
  }
});

test("each building starts with a stable orbit on the visible side of the globe", () => {
  const view = { latitude: 24, longitude: 110, zoom: 1 };
  const project = globeProjector(view);
  const positions = Array.from({ length: 6 }, (_, index) => buildingOrbitVector(index, 6, view));
  for (const position of positions) {
    assert.ok(position.every(Number.isFinite));
    assert.ok(Math.abs(Math.hypot(...position) - 1) < 1e-10);
    assert.ok(project(position)[2] > 0.4);
  }
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      assert.ok(Math.hypot(...positions[i].map((value, axis) => value - positions[j][axis])) > 0.5);
    }
  }
});

test("preferred ring offsets keep their order and stop expanding once photos arrive at their place", () => {
  for (const compact of [false, true]) {
    for (const count of [1, 2, 3, 4, 5, 12]) {
      const initial = Array.from({ length: count }, (_, index) => photoClusterOffset(index, count, 0, compact));
      const near = Array.from({ length: count }, (_, index) => photoClusterOffset(index, count, 1, compact));
      for (const zoom of [0.75, 1, 1.5, 2, 2.5, 3, 4, 8, 16, 32, 64]) {
        const current = initial.map((_, index) => photoClusterOffset(index, count, photoAnchorProgress(zoom), compact));
        for (let i = 0; i < count; i++) {
          assert.ok(current[i].every(Number.isFinite));
          assert.ok(Math.hypot(...current[i]) <= (compact ? 119 : 202));
          if (zoom >= 3) assert.deepEqual(current[i], near[i]);
          for (let j = i + 1; j < count; j++) {
            for (const axis of [0, 1]) {
              assert.ok((initial[i][axis] - initial[j][axis]) * (current[i][axis] - current[j][axis]) >= -1e-10);
            }
            assert.ok(Math.hypot(current[i][0] - current[j][0], current[i][1] - current[j][1]) > 1);
          }
        }
      }
    }
  }
});

test("screen-space collisions account for the full card rectangle and avoid place buttons", () => {
  const bounds = { width: 700, height: 500 };
  const targets = [
    { id: "a", groupId: "a", x: 300, y: 200, width: 180, height: 70, orderX: 0, orderY: 0 },
    { id: "b", groupId: "b", x: 340, y: 210, width: 90, height: 150, orderX: 0, orderY: 0 },
  ];
  const obstacle = { x: 300, y: 200, width: 34, height: 34 };
  const placed = relaxPhotoLayout(targets, new Map(), bounds, 1 / 30, [obstacle]);
  assert.equal(overlapArea(placed), 0);
  for (const card of placed) assert.equal(overlapArea([card, obstacle]), 0);
  assert.deepEqual(targets.map(p => [p.x, p.y]), [[300, 200], [340, 210]]);
});

test("all 23 crowded photos remain present and reduce overlap without reversing their building's order", () => {
  for (const bounds of [{ width: 748, height: 760 }, { width: 354, height: 355 }]) {
    const raw = crowdedPhotos(bounds);
    const density = photoDensityScale(raw, bounds);
    const targets = raw.map(p => ({ ...p, width: p.width * density, height: p.height * density }));
    let offsets = new Map();
    for (let frame = 0; frame < 30; frame++) {
      const placed = relaxPhotoLayout(targets, offsets, bounds, 1 / 30);
      assert.deepEqual(placed.map(p => p.id), targets.map(p => p.id));
      assertPhotoOrder(placed);
      assert.ok(overlapArea(placed) < overlapArea(targets) * 0.15, `crowded layout at ${bounds.width}px`);
      offsets = new Map(placed.map((p, i) => [p.id, { x: p.x - targets[i].x, y: p.y - targets[i].y }]));
    }
  }
});

test("small zoom steps continue the previous layout and preserve order through the crowded transition", () => {
  for (const bounds of [{ width: 748, height: 760 }, { width: 354, height: 355 }]) {
    let offsets = new Map(), previous = null;
    for (let step = 0; step <= 120; step++) {
      const raw = crowdedPhotos(bounds, step / 120);
      const density = photoDensityScale(raw, bounds);
      const targets = raw.map(p => ({ ...p, width: p.width * density, height: p.height * density }));
      const placed = relaxPhotoLayout(targets, offsets, bounds, 1 / 30);
      assertPhotoOrder(placed);
      if (previous) {
        for (let i = 0; i < placed.length; i++) {
          assert.ok(Math.hypot(placed[i].x - previous[i].x, placed[i].y - previous[i].y) < bounds.width * 0.1, `photo jumped: ${placed[i].id}`);
        }
      }
      offsets = new Map(placed.map((p, i) => [p.id, { x: p.x - targets[i].x, y: p.y - targets[i].y }]));
      previous = placed;
    }
  }
});

test("displaced photos return toward their own anchors and offscreen anchors can leave the viewport", () => {
  const target = { id: "a", groupId: "a", x: 300, y: 200, width: 100, height: 100, orderX: 0, orderY: 0 };
  const prior = new Map([["a", { x: 70, y: -30 }]]);
  const bounds = { width: 700, height: 500 };
  const [placed] = relaxPhotoLayout([target], prior, bounds, 1 / 30);
  assert.ok(placed.x > target.x && placed.x < target.x + 70);
  assert.ok(placed.y < target.y && placed.y > target.y - 30);
  assert.deepEqual(prior.get("a"), { x: 70, y: -30 });
  const [outside] = relaxPhotoLayout([{ ...target, x: 1400 }], new Map(), bounds, 1 / 30);
  assert.equal(outside.x, 1400);
});

test("density scaling leaves isolated photos large and changes continuously at the viewport edge", () => {
  const bounds = { width: 354, height: 355 };
  const dense = crowdedPhotos(bounds);
  const scale = photoDensityScale(dense, bounds);
  assert.ok(scale > 0 && scale < 0.7);
  assert.equal(photoDensityScale(dense.slice(0, 1), bounds), 1);
  assert.equal(photoDensityScale(dense.map(p => ({ ...p, x: -1000 })), bounds), 1);
  const before = photoDensityScale(dense.map(p => ({ ...p, x: p.x + 120 })), bounds);
  const after = photoDensityScale(dense.map(p => ({ ...p, x: p.x + 121 })), bounds);
  assert.ok(Math.abs(before - after) < 0.01);
  assert.ok(photoDensityScale(dense, bounds, 25000) < scale);
});

test("zoomed photo rings leave the map around their place button visible", () => {
  for (const bounds of [{ width: 748, height: 760 }, { width: 354, height: 355 }]) {
    const compact = bounds.width < 600;
    const clearance = photoMapClearance(1, compact);
    assert.ok(clearance >= (compact ? 96 : 160));
    assert.ok(photoMapClearance(0, compact) <= clearance);
    for (const count of [3, 5]) {
      const raw = crowdedPhotos(bounds).filter(p => p.groupId === (count === 3 ? "0" : "3"));
      const density = photoDensityScale(raw, bounds, clearance * clearance);
      const targets = raw.map(p => ({ ...p, width: p.width * density, height: p.height * density }));
      const map = { x: bounds.width * 0.52, y: bounds.height * 0.48, width: clearance, height: clearance };
      const placed = relaxPhotoLayout(targets, new Map(), bounds, 1 / 30, [map]);
      for (const card of placed) assert.equal(overlapArea([card, map]), 0);
      assertPhotoOrder(placed);
    }
  }
});

test("photos escape around a place cluster instead of getting trapped against the viewport edge", () => {
  const bounds = { width: 354, height: 456 };
  const targets = Array.from({ length: 5 }, (_, index) => {
    const [orderX, orderY] = photoClusterOffset(index, 5, 1, true);
    return { id: `${index}`, groupId: "book", x: 190 + orderX, y: 261 + orderY, orderX, orderY, width: 101, height: 96 };
  });
  const maps = [[197, 214], [155, 238], [157, 186], [190, 261], [105, 235], [223, 184]]
    .map(([x, y]) => ({ x, y, width: 96, height: 96 }));
  const placed = relaxPhotoLayout(targets, new Map(), bounds, 1 / 30, maps);
  for (const card of placed) {
    assert.equal(overlapArea([card, maps[3]]), 0);
    assert.ok(card.x >= card.width / 2 && card.x <= bounds.width - card.width / 2);
    assert.ok(card.y >= card.height / 2 && card.y <= bounds.height - card.height / 2);
  }
  assert.equal(overlapArea(placed), 0);
  assertPhotoOrder(placed);
  const trapped = new Map(targets.map(card => [card.id, { x: 0, y: 220 }]));
  const recovered = relaxPhotoLayout(targets, trapped, bounds, 1 / 30, maps);
  for (const card of recovered) assert.equal(overlapArea([card, maps[3]]), 0);
  assert.equal(overlapArea(recovered), 0);
  assertPhotoOrder(recovered);
});

test("a small screen keeps the focused place clear while preserving other place buttons as hit targets", () => {
  const bounds = { width: 324, height: 400 };
  const maps = [[182, 186], [140, 210], [142, 158], [175, 233], [90, 207], [208, 156]]
    .map(([x, y], i) => ({ x, y, width: i === 3 ? 96 : 34, height: i === 3 ? 96 : 34 }));
  const targets = Array.from({ length: 5 }, (_, index) => {
    const [orderX, orderY] = photoClusterOffset(index, 5, 1, true);
    return { id: `${index}`, groupId: "book", x: 175 + orderX, y: 233 + orderY, orderX, orderY, width: 90, height: 86 };
  });
  const placed = relaxPhotoLayout(targets, new Map(), bounds, 1 / 30, maps);
  for (const card of placed) for (const map of maps) assert.equal(overlapArea([card, map]), 0);
  assert.equal(overlapArea(placed), 0);
  assertPhotoOrder(placed);
});

test("button, wheel and pinch zoom can travel well past the former 2x limit while staying bounded", () => {
  assert.equal(clampGlobeZoom(8), 8);
  assert.equal(clampGlobeZoom(32), 32);
  assert.ok(globeZoomLimits.max >= 32);
  assert.equal(clampGlobeZoom(1000), globeZoomLimits.max);
  assert.equal(clampGlobeZoom(0.01), globeZoomLimits.min);
  let zoom = 1;
  for (let step = 0; step < 30; step++) zoom = clampGlobeZoom(zoom * 1.25);
  assert.equal(zoom, globeZoomLimits.max);
  for (let step = 0; step < 50; step++) zoom = clampGlobeZoom(zoom / 1.25);
  assert.equal(zoom, globeZoomLimits.min);
});

test("overlapping locations get separate hit targets and retain geographic anchors", () => {
  const markers = spreadMarkers(Array.from({ length: 6 }, (_, index) => ({ id: `building-${index}`, x: 200, y: 200 })));
  for (let i = 0; i < markers.length; i++) {
    assert.equal(markers[i].anchorX, 200);
    assert.equal(markers[i].anchorY, 200);
    for (let j = i + 1; j < markers.length; j++) assert.ok(Math.hypot(markers[i].x - markers[j].x, markers[i].y - markers[j].y) >= 36);
  }
});

test("filtering retains only the selected building and handles empty collections", () => {
  const buildings = [{ id: "a", photos: [{ id: "a/1" }, { id: "a/2" }] }, { id: "b", photos: [{ id: "b/1" }] }];
  assert.deepEqual(collectionPhotos(buildings, "a").map((photo) => photo.id), ["a/1", "a/2"]);
  assert.equal(collectionPhotos(buildings, null).length, 3);
  assert.equal(collectionPhotos(buildings, "missing").length, 0);
  assert.equal(collectionPhotos([], null).length, 0);
});

test("asset URLs support the GitHub Pages base path", () => {
  const previous = process.env.NEXT_PUBLIC_BASE_PATH;
  try {
    process.env.NEXT_PUBLIC_BASE_PATH = "/portfolio";
    assert.equal(assetPath("/photos/ando/a/01.jpg"), "/portfolio/photos/ando/a/01.jpg");
  } finally {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_BASE_PATH;
    else process.env.NEXT_PUBLIC_BASE_PATH = previous;
  }
});
