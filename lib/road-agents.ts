export type RoadArea = {
  name: string;
  country: string;
  center: [number, number];
  size: [number, number];
  nodes: [number, number][];
  edges: [number, number][];
};

export type RoadGraph = {
  area: RoadArea;
  neighbors: number[][];
};

export type RoadAgent = {
  from: number;
  to: number;
  progress: number;
  speed: number;
  trail: [number, number][];
};

export function buildRoadGraph(area: RoadArea): RoadGraph {
  const neighbors = area.nodes.map(() => [] as number[]);
  for (const [from, to] of area.edges) {
    if (from === to) continue;
    neighbors[from].push(to);
    neighbors[to].push(from);
  }
  return { area, neighbors };
}

export function agentPosition(graph: RoadGraph, agent: RoadAgent): [number, number] {
  const start = graph.area.nodes[agent.from];
  const end = graph.area.nodes[agent.to];
  return [
    start[0] + (end[0] - start[0]) * agent.progress,
    start[1] + (end[1] - start[1]) * agent.progress,
  ];
}

export function createRoadAgent(graph: RoadGraph, random = Math.random): RoadAgent {
  const edge = graph.area.edges[Math.floor(random() * graph.area.edges.length)];
  const reverse = random() < 0.5;
  return {
    from: edge[reverse ? 1 : 0],
    to: edge[reverse ? 0 : 1],
    progress: random(),
    speed: 35 + random() * 55,
    trail: [],
  };
}

// Agents choose at real OSM junctions, favoring forward motion over sharp turns.
// This is a wandering artwork: streets can be explored in either direction.
export function advanceRoadAgent(
  graph: RoadGraph,
  agent: RoadAgent,
  seconds: number,
  random = Math.random,
) {
  let distance = agent.speed * Math.min(Math.max(seconds, 0), 0.1);
  while (distance > 0) {
    const start = graph.area.nodes[agent.from];
    const end = graph.area.nodes[agent.to];
    const length = Math.hypot(end[0] - start[0], end[1] - start[1]);
    const remaining = length * (1 - agent.progress);
    if (distance < remaining) {
      agent.progress += distance / length;
      break;
    }

    distance -= Math.max(remaining, 0.01);
    agent.trail.push([end[0], end[1]]);
    const options = graph.neighbors[agent.to].filter((node) => node !== agent.from);
    let next = agent.from; // Turn around at a dead end.
    if (options.length) {
      const weights = options.map((node) => {
        const point = graph.area.nodes[node];
        const dx = point[0] - end[0];
        const dy = point[1] - end[1];
        const alignment = ((end[0] - start[0]) * dx + (end[1] - start[1]) * dy)
          / Math.max(length * Math.hypot(dx, dy), 0.01);
        return 1.2 + alignment;
      });
      let choice = random() * weights.reduce((sum, weight) => sum + weight, 0);
      next = options[options.length - 1];
      for (let index = 0; index < options.length; index++) {
        choice -= weights[index];
        if (choice <= 0) {
          next = options[index];
          break;
        }
      }
    }
    agent.from = agent.to;
    agent.to = next;
    agent.progress = 0;
  }
  agent.trail.push(agentPosition(graph, agent));
  if (agent.trail.length > 20) agent.trail.splice(0, agent.trail.length - 20);
}
