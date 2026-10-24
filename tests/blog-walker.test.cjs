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
  WALKER_SIZE, WALK_SPEED, createWalkField, sampleWalkField, createWalkBounds, clampWalkPosition, createWalker,
  advanceWalker, fallWalker, isHomeDrop, dropWalker, wakeWalker, walkerViewForHeading, chooseWalkerVariant,
} = compiledModule.exports;

function randomSeed(seed) {
  return () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
}

test('each article load draws a fresh, approximately even walking or cycling choice', () => {
  const samples = [0, 0.49, 0.5, 0.99, 0.1, 0.9];
  let draws = 0;
  const next = () => samples[draws++];
  assert.deepEqual(samples.map(() => chooseWalkerVariant(next)), ['walking', 'walking', 'cycling', 'cycling', 'walking', 'cycling']);
  assert.equal(draws, samples.length, 'each load samples again rather than reusing an article assignment');
  const random = randomSeed(42);
  const variants = Array.from({ length: 1000 }, () => chooseWalkerVariant(random));
  assert.ok(variants.every(variant => variant === 'walking' || variant === 'cycling'));
  const cyclingRatio = variants.filter(variant => variant === 'cycling').length / variants.length;
  assert.ok(cyclingRatio > 0.4 && cyclingRatio < 0.6, 'repeated loads receive an approximately even mix');
});

test('unobstructed wandering can reach the center on desktop and mobile', () => {
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    const bounds = createWalkBounds(width, height);
    const state = createWalker(bounds);
    const random = randomSeed(42);
    let visitedCenter = false;
    for (let frame = 0; frame < 30000; frame++) {
      advanceWalker(state, bounds, 0.05, random);
      if (state.position.x > width * 0.25 && state.position.x < width * 0.75
        && state.position.y > height * 0.25 && state.position.y < height * 0.75) visitedCenter = true;
    }
    assert.equal(visitedCenter, true);
  }
});

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

test('translating the page and its content preserves the avoidance field and walking path', () => {
  const offset = { x: 40, y: 1200 };
  const bounds = createWalkBounds(600, 900);
  const shiftedBounds = createWalkBounds(600, 900, offset);
  const region = { left: 200, right: 400, top: 200, bottom: 700, strength: 4 };
  const field = createWalkField(bounds, [region]);
  const shiftedField = createWalkField(shiftedBounds, [{
    left: region.left + offset.x, right: region.right + offset.x,
    top: region.top + offset.y, bottom: region.bottom + offset.y, strength: region.strength,
  }]);
  assert.deepEqual(shiftedField.values, field.values);
  const state = createWalker(bounds);
  const shiftedState = createWalker(shiftedBounds);
  const random = randomSeed(42);
  const shiftedRandom = randomSeed(42);
  for (let frame = 0; frame < 3000; frame++) {
    advanceWalker(state, bounds, 0.05, random, field);
    advanceWalker(shiftedState, shiftedBounds, 0.05, shiftedRandom, shiftedField);
    assert.ok(Math.abs(shiftedState.position.x - state.position.x - offset.x) < 1e-8);
    assert.ok(Math.abs(shiftedState.position.y - state.position.y - offset.y) < 1e-8);
  }
});

test('walking accelerates gradually, turns gradually, and limits jumps after a frame gap', () => {
  const bounds = createWalkBounds(1440, 900);
  const state = createWalker(bounds);
  state.mode = 'walking';
  state.remaining = 100;
  state.turnRemaining = 100;
  const start = { ...state.position };
  advanceWalker(state, bounds, 1 / 60);
  assert.ok(state.speed > 0 && state.speed < WALK_SPEED);
  assert.ok(state.position.x - start.x < WALK_SPEED / 60);
  for (let frame = 0; frame < 30; frame++) advanceWalker(state, bounds, 1 / 60);
  assert.equal(state.speed, WALK_SPEED);
  state.position.y = 400;
  state.desiredHeading = Math.PI / 2;
  advanceWalker(state, bounds, 1 / 60);
  assert.ok(state.heading > 0 && state.heading < 0.05);
  const beforeGap = { ...state.position };
  advanceWalker(state, bounds, 60);
  assert.ok(Math.hypot(state.position.x - beforeGap.x, state.position.y - beforeGap.y) <= WALK_SPEED * 0.1 + 1e-8);
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

test('the gait follows actual travel at different frame rates and pauses when picked up or fallen', () => {
  const bounds = createWalkBounds(1440, 900);
  for (const fps of [30, 60, 120]) {
    const state = createWalker(bounds);
    state.target = { x: 1000, y: state.position.y };
    state.mode = 'walking';
    state.remaining = 100;
    state.speed = WALK_SPEED;
    state.turnRemaining = 100;
    const startX = state.position.x;
    for (let frame = 0; frame < fps; frame++) advanceWalker(state, bounds, 1 / fps);
    assert.ok(Math.abs(state.distance - WALK_SPEED) < 1e-8);
    assert.ok(Math.abs(state.distance - (state.position.x - startX)) < 1e-8);
    const distance = state.distance;
    state.mode = 'dragging';
    advanceWalker(state, bounds, 0.1);
    assert.equal(state.distance, distance);
    fallWalker(state);
    advanceWalker(state, bounds, 0.1);
    assert.equal(state.distance, distance);
  }
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


test('content produces a soft field with usable gaps and smooth edges', () => {
  const bounds = createWalkBounds(1000, 800);
  const rectangle = { left: 400, right: 600, top: 300, bottom: 500, strength: 4 };
  const field = createWalkField(bounds, [rectangle]);
  const overlapping = createWalkField(bounds, [rectangle, rectangle]);
  const inside = sampleWalkField(field, { x: 480, y: 380 });
  const near = sampleWalkField(field, { x: 350, y: 380 });
  const far = sampleWalkField(field, { x: 280, y: 380 });
  assert.ok(inside > near && near > far && far >= 0);
  assert.equal(inside, sampleWalkField(overlapping, { x: 480, y: 380 }));
  assert.equal(sampleWalkField(createWalkField(bounds, []), { x: 480, y: 380 }), 0);
  for (let x = 320; x < 400; x++) {
    assert.ok(Math.abs(sampleWalkField(field, { x, y: 380 }) - sampleWalkField(field, { x: x + 1, y: 380 })) < 0.55);
  }
});

test('stochastic wandering enters content less often but still sometimes on desktop and mobile', () => {
  for (const [width, height, rectangle] of [
    [600, 600, { left: 160, right: 440, top: 180, bottom: 500, strength: 4 }],
    [390, 844, { left: 24, right: 366, top: 240, bottom: 700, strength: 4 }],
  ]) {
    const bounds = createWalkBounds(width, height);
    const field = createWalkField(bounds, [rectangle]);
    const occupancy = [];
    for (const avoid of [false, true]) {
      const state = createWalker(bounds);
      const random = randomSeed(42);
      let inside = 0;
      for (let frame = 0; frame < 50000; frame++) {
        advanceWalker(state, bounds, 0.05, random, avoid ? field : undefined);
        if (sampleWalkField(field, state.position) > 2) inside++;
      }
      occupancy.push(inside / 50000);
    }
    assert.ok(occupancy[1] > 0.001, 'the content remains reachable');
    assert.ok(occupancy[1] < occupancy[0] * 0.6, 'the field substantially reduces time over content');
  }
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
