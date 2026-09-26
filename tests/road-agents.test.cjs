const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, '../lib/road-agents.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
}).outputText;
const compiledModule = { exports: {} };
new Function('module', 'exports', compiled)(compiledModule, compiledModule.exports);
const { buildRoadGraph, createRoadAgent, advanceRoadAgent, agentPosition } = compiledModule.exports;

const junction = buildRoadGraph({
  name: 'Junction', country: 'Test', center: [0, 0], size: [10, 10],
  nodes: [[0, 0], [1, 0], [2, 0], [1, 1]], edges: [[0, 1], [1, 2], [1, 3]],
});
const approaching = () => ({ from: 0, to: 1, progress: 0.9, speed: 5, trail: [] });

test('chooses connected exits without immediately reversing at a junction', () => {
  const straight = approaching();
  advanceRoadAgent(junction, straight, 0.1, () => 0);
  assert.equal(straight.from, 1);
  assert.equal(straight.to, 2);
  assert.ok(Math.abs(straight.progress - 0.4) < 1e-8);
  const turning = approaching();
  advanceRoadAgent(junction, turning, 0.1, () => 0.999);
  assert.equal(turning.to, 3);
  // A trail must retain the junction, instead of drawing diagonally across it.
  assert.deepEqual(turning.trail[0], [1, 0]);
});

test('turns around at dead ends and caps elapsed time after backgrounding', () => {
  const agent = { from: 1, to: 2, progress: 0.9, speed: 5, trail: [] };
  advanceRoadAgent(junction, agent, 60, () => 0);
  assert.equal(agent.from, 2);
  assert.equal(agent.to, 1);
  assert.ok(Math.abs(agent.progress - 0.4) < 1e-8);
});

test('distance traveled is independent of frame rate', () => {
  const road = buildRoadGraph({
    name: 'Road', country: 'Test', center: [0, 0], size: [1000, 1000],
    nodes: [[0, 0], [1000, 0]], edges: [[0, 1]],
  });
  const a = { from: 0, to: 1, progress: 0, speed: 50, trail: [] };
  const b = { ...a, trail: [] };
  for (let i = 0; i < 30; i++) advanceRoadAgent(road, a, 1 / 30);
  for (let i = 0; i < 60; i++) advanceRoadAgent(road, b, 1 / 60);
  assert.ok(Math.abs(agentPosition(road, a)[0] - 50) < 1e-8);
  assert.ok(Math.abs(a.progress - b.progress) < 1e-8);
});

test('every bundled area has usable roads and agents remain on them', () => {
  const atlas = JSON.parse(fs.readFileSync(path.join(__dirname, '../public/data/road-atlas.json')));
  assert.equal(atlas.areas.length, 6);
  let seed = 42;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  for (const area of atlas.areas) {
    assert.ok(area.edges.length > 20, area.name);
    for (const [from, to] of area.edges) {
      assert.ok(area.nodes[from] && area.nodes[to]);
      assert.notEqual(from, to);
      assert.ok(Math.hypot(area.nodes[from][0] - area.nodes[to][0], area.nodes[from][1] - area.nodes[to][1]) > 0);
    }
    const graph = buildRoadGraph(area);
    for (let count = 0; count < 20; count++) {
      const agent = createRoadAgent(graph, random);
      for (let step = 0; step < 1000; step++) {
        advanceRoadAgent(graph, agent, 1 / 30, random);
        assert.ok(graph.neighbors[agent.from].includes(agent.to));
        assert.ok(agent.progress >= 0 && agent.progress <= 1);
        assert.ok(agentPosition(graph, agent).every(Number.isFinite));
        assert.ok(agent.trail.length <= 20);
      }
    }
  }
});
