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
const { globeVector, globeProjector, longitudeDifference, photoAnchorProgress, photoGlobeVector, photoClusterOffset, relaxPhotoLayout, clampGlobeZoom, globeZoomLimits, spreadMarkers, collectionPhotos, assetPath } = compiledModule.exports;

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
