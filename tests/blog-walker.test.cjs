const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/blog-walker.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const compiledModule = { exports: {} };
new Function('module', 'exports', compiled)(compiledModule, compiledModule.exports);
const {
  WALKER_SIZE, createWalkField, createWalkBounds, clampWalkPosition, createWalker,
  advanceWalker, fallWalker, isHomeDrop, dropWalker, wakeWalker, walkerViewForHeading,
} = compiledModule.exports;

function randomSeed(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

test('walking and resizing keep the entire character within the page bounds', () => {
  let seed = 42;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (const [width, height] of [[1440, 900], [390, 844], [844, 390], [40, 40]]) {
    const bounds = createWalkBounds(width, height);
    const state = createWalker(bounds);
    for (let frame = 0; frame < 3000; frame++) {
      advanceWalker(state, bounds, 1 / 30, random);
      assert.ok(state.position.x >= 0 && state.position.y >= 0);
      assert.ok(state.position.x <= Math.max(0, width - WALKER_SIZE));
      assert.ok(state.position.y <= Math.max(0, height - WALKER_SIZE));
    }
    const resized = clampWalkPosition({ x: 1400, y: -50 }, bounds);
    assert.ok(resized.x <= bounds.right && resized.y >= bounds.top);
  }
});

test('eight headings select cardinal and dedicated diagonal views without flickering at boundaries', () => {
  const views = ['side', 'diagonal-down', 'front', 'diagonal-down', 'side', 'diagonal-up', 'front', 'diagonal-up'];
  views.forEach((view, index) => assert.equal(walkerViewForHeading(index * Math.PI / 4), view));
  const sideEdge = Math.PI / 8;
  const frontEdge = Math.PI * 3 / 8;
  assert.equal(walkerViewForHeading(sideEdge + 0.04, 'side'), 'side');
  assert.equal(walkerViewForHeading(sideEdge - 0.04, 'diagonal-down'), 'diagonal-down');
  assert.equal(walkerViewForHeading(sideEdge + 0.1, 'side'), 'diagonal-down');
  assert.equal(walkerViewForHeading(frontEdge - 0.04, 'front'), 'front');
  assert.equal(walkerViewForHeading(frontEdge + 0.04, 'diagonal-down'), 'diagonal-down');
  assert.equal(walkerViewForHeading(frontEdge + 0.1, 'diagonal-down'), 'front');
});

test('a long page uses document coordinates while house drops and exits follow the current scroll position', () => {
  const bounds = createWalkBounds(390, 3000, { x: 20, y: 100 });
  const state = createWalker(bounds, false, { x: 44, y: 780 });
  assert.deepEqual(state.position, { x: 44, y: 780 });
  assert.equal(bounds.bottom, 3040);
  const scrollY = 1200;
  const home = { left: 326, right: 374, top: 780 + scrollY, bottom: 828 + scrollY };
  state.mode = 'dragging';
  state.position = { x: 326, y: 780 };
  assert.equal(dropWalker(state, home), false, 'the previous viewport position cannot reach the scrolled house');
  state.position = { x: 326, y: 780 + scrollY };
  assert.equal(dropWalker(state, home), true);
  wakeWalker(state, bounds, home);
  assert.deepEqual(state.position, { x: 270, y: 780 + scrollY });
  assert.equal(state.position.y - scrollY, 780, 'waking places the character beside the fixed house in the visible viewport');
});

test('a click makes the character fall, hold its position, and then recover', () => {
  const bounds = createWalkBounds(1440, 900);
  const state = createWalker(bounds);
  const before = { ...state.position };
  fallWalker(state);
  assert.equal(state.mode, 'fallen');
  for (let frame = 0; frame < 12; frame++) {
    advanceWalker(state, bounds, 0.1);
    assert.equal(state.mode, 'fallen');
    assert.deepEqual(state.position, before);
  }
  for (let frame = 0; frame < 8; frame++) advanceWalker(state, bounds, 0.1);
  assert.equal(state.mode, 'resting');
});

test('dragging suspends walking and dropping outside the house resumes it', () => {
  const bounds = createWalkBounds(390, 844);
  const state = createWalker(bounds);
  state.mode = 'dragging';
  state.position = { x: 120, y: 200 };
  advanceWalker(state, bounds, 10);
  assert.deepEqual(state.position, { x: 120, y: 200 });
  assert.equal(dropWalker(state, { left: 326, right: 374, top: 780, bottom: 828 }), false);
  assert.equal(state.mode, 'resting');
  for (let frame = 0; frame < 10; frame++) advanceWalker(state, bounds, 0.1, () => 0.5);
  assert.equal(state.mode, 'walking');
});

test('dropping on the house hides the character until the house is tapped', () => {
  const bounds = createWalkBounds(390, 844);
  const home = { left: 326, right: 374, top: 780, bottom: 828 };
  const state = createWalker(bounds);
  state.mode = 'dragging';
  state.position = { x: 326, y: 780 };
  assert.equal(isHomeDrop(state.position, home), true);
  assert.equal(dropWalker(state, home), true);
  const asleep = { ...state.position };
  for (let frame = 0; frame < 1000; frame++) advanceWalker(state, bounds, 10);
  fallWalker(state);
  assert.equal(state.mode, 'home');
  assert.deepEqual(state.position, asleep);
  wakeWalker(state, bounds, home);
  assert.equal(state.mode, 'resting');
  assert.ok(state.position.x + WALKER_SIZE < home.left);
  for (let frame = 0; frame < 8; frame++) advanceWalker(state, bounds, 0.1, () => 0.5);
  assert.equal(state.mode, 'walking');
});

test('content covering the viewport cannot trap the character or block manual dragging', () => {
  const bounds = createWalkBounds(390, 844);
  const field = createWalkField(bounds, [{ left: 0, right: 390, top: 0, bottom: 844, strength: 4 }]);
  const state = createWalker(bounds);
  const start = { ...state.position };
  const random = randomSeed(42);
  for (let frame = 0; frame < 1000; frame++) advanceWalker(state, bounds, 0.05, random, field);
  assert.ok(Math.hypot(state.position.x - start.x, state.position.y - start.y) > 50);
  state.mode = 'dragging';
  state.position = { x: 150, y: 300 };
  advanceWalker(state, bounds, 0.1, random, field);
  assert.deepEqual(state.position, { x: 150, y: 300 });
});
