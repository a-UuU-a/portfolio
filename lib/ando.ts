export type AndoPhoto = {
  id: string;
  src: string;
  alt: string;
  credit?: { author: string; source: string; license: string; licenseUrl: string };
};

export type AndoBuilding = {
  id: string;
  name: string;
  nameEn?: string;
  location: string;
  country: string;
  /** Latitude, longitude in degrees. */
  coordinates: [number, number];
  note?: string;
  photos: AndoPhoto[];
};

export type AndoCollection = { buildings: AndoBuilding[] };
export type GlobeView = { latitude: number; longitude: number; zoom: number };
export type Vector3 = [number, number, number];

const radians = Math.PI / 180;

export const globeZoomLimits = { min: 0.75, max: 64 };

export function clampGlobeZoom(zoom: number) {
  return Math.max(globeZoomLimits.min, Math.min(globeZoomLimits.max, zoom));
}

export function globeVector(latitude: number, longitude: number): Vector3 {
  const lat = latitude * radians;
  const lon = longitude * radians;
  return [Math.cos(lat) * Math.sin(lon), Math.sin(lat), Math.cos(lat) * Math.cos(lon)];
}

export function globeProjector(view: GlobeView) {
  const sinLon = Math.sin(view.longitude * radians);
  const cosLon = Math.cos(view.longitude * radians);
  const sinLat = Math.sin(view.latitude * radians);
  const cosLat = Math.cos(view.latitude * radians);
  return ([x, y, z]: Vector3): Vector3 => {
    const horizontal = x * cosLon - z * sinLon;
    const depth = x * sinLon + z * cosLon;
    return [horizontal, y * cosLat - depth * sinLat, y * sinLat + depth * cosLat];
  };
}

export function wrapLongitude(longitude: number) {
  return ((longitude + 180) % 360 + 360) % 360 - 180;
}

export function longitudeDifference(from: number, to: number) {
  return wrapLongitude(to - from);
}

/** Bring orbiting photos home as the user zooms in. */
export function photoAnchorProgress(zoom: number) {
  const progress = Math.max(0, Math.min(1, (zoom - 1) / 2));
  return progress * progress * (3 - 2 * progress);
}

/** Give each building a stable orbit on the initially visible side of the globe. */
export function buildingOrbitVector(index: number, count: number, view: Pick<GlobeView, "latitude" | "longitude">): Vector3 {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(1, count);
  const x = Math.cos(angle) * 0.88;
  const y = -Math.sin(angle) * 0.78;
  const z = Math.sqrt(1 - x * x - y * y);
  const east = globeVector(0, view.longitude + 90);
  const north = globeVector(view.latitude + 90, view.longitude);
  const front = globeVector(view.latitude, view.longitude);
  return east.map((value, axis) => value * x + north[axis] * y + front[axis] * z) as Vector3;
}

export function photoGlobeVector(orbit: Vector3, anchor: Vector3, progress: number): Vector3 {
  return orbit.map((value, index) => value * 1.1 * (1 - progress) + anchor[index] * progress) as Vector3;
}

/** Pixel offsets stay bounded after arrival, even when the globe is magnified further. */
export function photoClusterOffset(index: number, count: number, progress: number, compact: boolean): [number, number] {
  const angle = -Math.PI / 2 + index * Math.PI * 2 / Math.max(1, count);
  const radiusX = compact ? 40 + progress * 78 : 76 + progress * 125;
  const radiusY = compact ? 36 + progress * 72 : 68 + progress * 110;
  return [Math.cos(angle) * radiusX, Math.sin(angle) * radiusY];
}

/** Reserve the map around each place button, even as its photos come home. */
export function photoMapClearance(progress: number, compact: boolean) {
  return (compact ? 72 : 132) + progress * (compact ? 24 : 28);
}

export type PhotoLayoutTarget = {
  id: string;
  groupId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  /** Stable coordinates within the building's ring, before floating motion. */
  orderX: number;
  orderY: number;
};
export type PhotoLayoutOffset = { x: number; y: number };
type LayoutBounds = { width: number; height: number };

/** Leave room between cards when the viewport cannot fit their preferred sizes. */
export function photoDensityScale(photos: { x: number; y: number; width: number; height: number; weight: number }[], bounds: LayoutBounds, reservedArea = 0) {
  let area = 0;
  let perimeter = 0;
  let gaps = 0;
  for (const photo of photos) {
    // Fade the contribution at the viewport edge rather than counting cards in steps.
    const edgeX = Math.max(0, Math.min(1, (bounds.width / 2 + photo.width - Math.abs(photo.x - bounds.width / 2)) / photo.width));
    const edgeY = Math.max(0, Math.min(1, (bounds.height / 2 + photo.height - Math.abs(photo.y - bounds.height / 2)) / photo.height));
    const weight = photo.weight * edgeX * edgeY;
    area += photo.width * photo.height * weight;
    perimeter += 18 * (photo.width + photo.height) * weight;
    gaps += 18 * 18 * weight;
  }
  const available = Math.max(bounds.width * bounds.height * 0.35, bounds.width * bounds.height - reservedArea);
  if (!area) return 1;
  // Gaps remain in pixels when cards shrink, so solve A*s² + B*s + C = budget.
  const budget = Math.max(0, available * 0.54 - gaps);
  return Math.min(1, 2 * budget / (perimeter + Math.sqrt(perimeter * perimeter + 4 * area * budget)));
}

/**
 * Screen-space constraint relaxation. Reuse the last displacement, let a weak
 * spring return each card to its orbit, then resolve intersecting rectangles.
 * No sorting or slot assignment: nearby zoom levels continue the same layout.
 */
export function relaxPhotoLayout<T extends PhotoLayoutTarget>(
  targets: T[],
  previous: ReadonlyMap<string, PhotoLayoutOffset>,
  bounds: LayoutBounds,
  elapsed: number,
  obstacles: { x: number; y: number; width: number; height: number }[] = [],
): (T & { x: number; y: number })[] {
  const spring = Math.exp(-Math.min(0.06, Math.max(0, elapsed)) * 2.4);
  const placed = targets.map((target) => {
    const offset = previous.get(target.id);
    return { ...target, x: target.x + (offset?.x ?? 0) * spring, y: target.y + (offset?.y ?? 0) * spring };
  });
  const gap = 18;
  const limits = targets.map((target) => ({
    minX: Math.min(target.width / 2 + gap, target.x),
    maxX: Math.max(bounds.width - target.width / 2 - gap, target.x),
    minY: Math.min(target.height / 2 + gap, target.y),
    maxY: Math.max(bounds.height - target.height / 2 - gap, target.y),
  }));
  const preserveOrder = () => {
    for (let i = 0; i < placed.length; i++) {
      const a = placed[i];
      for (let j = i + 1; j < placed.length; j++) {
        const b = placed[j];
        if (a.groupId !== b.groupId) continue;
        for (const axis of ["x", "y"] as const) {
          const order = axis === "x" ? b.orderX - a.orderX : b.orderY - a.orderY;
          if (Math.abs(order) < 1) continue;
          const direction = Math.sign(order);
          const missing = Math.min(20, Math.abs(order)) - (b[axis] - a[axis]) * direction;
          if (missing > 0) {
            a[axis] -= missing * direction * 0.5;
            b[axis] += missing * direction * 0.5;
          }
        }
      }
    }
  };
  for (let iteration = 0; iteration < 48; iteration++) {
    for (let i = 0; i < placed.length; i++) {
      const a = placed[i];
      for (let j = i + 1; j < placed.length; j++) {
        const b = placed[j];
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const overlapX = (a.width + b.width) / 2 + gap - Math.abs(dx);
        const overlapY = (a.height + b.height) / 2 + gap - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          const orderX = b.orderX - a.orderX;
          const orderY = b.orderY - a.orderY;
          const directionX = (a.groupId === b.groupId && Math.abs(orderX) >= 1 ? Math.sign(orderX) : Math.sign(dx || targets[j].x - targets[i].x)) || 1;
          const directionY = (a.groupId === b.groupId && Math.abs(orderY) >= 1 ? Math.sign(orderY) : Math.sign(dy || targets[j].y - targets[i].y)) || 1;
          const pushX = (a.width + b.width) / 2 + gap - dx * directionX;
          const pushY = (a.height + b.height) / 2 + gap - dy * directionY;
          // Share the push according to the room each card has, instead of
          // repeatedly pushing two cards into the same blocked stage edge.
          const roomAX = Math.max(0, directionX > 0 ? a.x - limits[i].minX : limits[i].maxX - a.x);
          const roomBX = Math.max(0, directionX > 0 ? limits[j].maxX - b.x : b.x - limits[j].minX);
          const roomAY = Math.max(0, directionY > 0 ? a.y - limits[i].minY : limits[i].maxY - a.y);
          const roomBY = Math.max(0, directionY > 0 ? limits[j].maxY - b.y : b.y - limits[j].minY);
          const fitsX = roomAX + roomBX >= pushX;
          const fitsY = roomAY + roomBY >= pushY;
          const useX = fitsX || fitsY ? fitsX && (!fitsY || pushX < pushY) : (roomAX + roomBX) / pushX > (roomAY + roomBY) / pushY;
          const axis = useX ? "x" : "y";
          const needed = useX ? pushX : pushY;
          const direction = useX ? directionX : directionY;
          const roomA = useX ? roomAX : roomAY;
          const roomB = useX ? roomBX : roomBY;
          const moveB = Math.min(roomB, needed - Math.min(roomA, needed / 2));
          const moveA = Math.min(roomA, needed - moveB);
          a[axis] -= moveA * direction * 0.8;
          b[axis] += moveB * direction * 0.8;
        }
      }
      for (const obstacle of obstacles) {
        const dx = a.x - obstacle.x;
        const dy = a.y - obstacle.y;
        const overlapX = (a.width + obstacle.width) / 2 + gap - Math.abs(dx);
        const overlapY = (a.height + obstacle.height) / 2 + gap - Math.abs(dy);
        if (overlapX > 0 && overlapY > 0) {
          const pushX = (Math.sign(dx) || 1) * overlapX;
          const pushY = (Math.sign(dy) || 1) * overlapY;
          const limit = limits[i];
          const fitsX = a.x + pushX >= limit.minX && a.x + pushX <= limit.maxX;
          const fitsY = a.y + pushY >= limit.minY && a.y + pushY <= limit.maxY;
          // Do not repeatedly push against a blocked viewport edge. Escape
          // along the other axis when it has room, instead of getting stuck.
          const useX = (fitsX && (!fitsY || overlapX < overlapY)) || (!fitsX && !fitsY && overlapX < overlapY);
          if (useX) a.x += pushX * 0.8;
          else a.y += pushY * 0.8;
        }
      }
      // Keep visible cards inside the stage. Offscreen geographic targets can
      // still leave the viewport naturally when panning or zooming further in.
      const limit = limits[i];
      a.x = Math.max(limit.minX, Math.min(limit.maxX, a.x));
      a.y = Math.max(limit.minY, Math.min(limit.maxY, a.y));
    }
    preserveOrder();
  }
  // A collision late in the final sweep must not reverse another photo pair.
  for (let iteration = 0; iteration < 8; iteration++) preserveOrder();
  if (previous.size && obstacles.length) {
    const overlap = (a: { x: number; y: number; width: number; height: number }, b: typeof a) =>
      Math.max(0, (a.width + b.width) / 2 - Math.abs(a.x - b.x))
      * Math.max(0, (a.height + b.height) / 2 - Math.abs(a.y - b.y));
    const penalty = (layout: typeof placed) => layout.reduce((sum, card, i) =>
      sum + obstacles.reduce((area, map) => area + overlap(card, map) * 8, 0)
        + layout.slice(i + 1).reduce((area, other) => area + overlap(card, other), 0), 0);
    const currentPenalty = penalty(placed);
    if (currentPenalty > 1) {
      // A previous layout can trap a whole group on one side of the map.
      // Retry from its canonical ring and keep the less obstructed solution;
      // the renderer interpolates between layouts instead of jumping to it.
      const alternative = relaxPhotoLayout(targets, new Map(), bounds, elapsed, obstacles);
      if (penalty(alternative) < currentPenalty) return alternative;
    }
  }
  return placed;
}

export function collectionPhotos(buildings: AndoBuilding[], selectedId: string | null) {
  return buildings
    .filter((building) => selectedId === null || building.id === selectedId)
    .flatMap((building) => building.photos.map((photo) => ({ ...photo, building })));
}

export function assetPath(path: string) {
  return `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${path}`;
}

/** Fan out nearby points while retaining their exact geographic anchors. */
export function spreadMarkers<T extends { id: string; x: number; y: number }>(markers: T[]) {
  const placed: (T & { anchorX: number; anchorY: number })[] = [];
  for (const marker of markers) {
    let x = marker.x;
    let y = marker.y;
    for (let attempt = 0; attempt < 80; attempt++) {
      if (placed.every((other) => Math.hypot(other.x - x, other.y - y) >= 36)) break;
      const angle = attempt * 2.399963;
      const distance = 20 + 7 * Math.sqrt(attempt);
      x = marker.x + Math.cos(angle) * distance;
      y = marker.y + Math.sin(angle) * distance;
    }
    placed.push({ ...marker, x, y, anchorX: marker.x, anchorY: marker.y });
  }
  return placed;
}
