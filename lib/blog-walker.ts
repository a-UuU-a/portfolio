export type WalkPoint = { x: number; y: number };
export type WalkBounds = { left: number; right: number; top: number; bottom: number };
export type HomeBounds = WalkBounds;
export type WalkerMode = "resting" | "walking" | "fallen" | "dragging" | "home";
export type WalkerView = "side" | "front" | "diagonal-down" | "diagonal-up";
export type WalkerState = {
  position: WalkPoint;
  target: WalkPoint;
  mode: WalkerMode;
  facing: 1 | -1;
  remaining: number;
  distance: number;
  heading: number;
  desiredHeading: number;
  turnRemaining: number;
  speed: number;
  exploring: boolean;
};

export const WALKER_SIZE = 48;
export const WALK_SPEED = 24;
export const WALK_STRIDE = 36;
export const WALK_FRAMES = 12;
const TAU = Math.PI * 2;
// Most walks avoid content strongly; a few have a much weaker preference.
const EXPLORATION_CHANCE = 0.06;

export type ContentRegion = WalkBounds & { strength: number };
export type WalkField = {
  bounds: WalkBounds;
  spacing: number;
  columns: number;
  rows: number;
  values: Float32Array;
};

export function createWalkField(bounds: WalkBounds, regions: ContentRegion[]): WalkField {
  const spacing = 8;
  const columns = Math.ceil((bounds.right - bounds.left) / spacing) + 1;
  const rows = Math.ceil((bounds.bottom - bounds.top) / spacing) + 1;
  const values = new Float32Array(columns * rows);
  // Allow walking beside content; padding accounts only for the visible character.
  const padX = 15;
  const padY = 21;
  const falloff = 4;
  for (const region of regions) {
    const left = region.left - WALKER_SIZE / 2 - padX;
    const right = region.right - WALKER_SIZE / 2 + padX;
    const top = region.top - WALKER_SIZE / 2 - padY;
    const bottom = region.bottom - WALKER_SIZE / 2 + padY;
    const firstX = Math.max(0, Math.floor((left - 3 * falloff - bounds.left) / spacing));
    const lastX = Math.min(columns - 1, Math.ceil((right + 3 * falloff - bounds.left) / spacing));
    const firstY = Math.max(0, Math.floor((top - 3 * falloff - bounds.top) / spacing));
    const lastY = Math.min(rows - 1, Math.ceil((bottom + 3 * falloff - bounds.top) / spacing));
    for (let row = firstY; row <= lastY; row++) {
      const y = bounds.top + row * spacing;
      const dy = Math.max(top - y, 0, y - bottom);
      for (let column = firstX; column <= lastX; column++) {
        const x = bounds.left + column * spacing;
        const dx = Math.max(left - x, 0, x - right);
        const value = region.strength * Math.exp(-(dx * dx + dy * dy) / (2 * falloff * falloff));
        const index = row * columns + column;
        // Overlapping text nodes should not make inline links or emphasis harder to cross.
        values[index] = Math.max(values[index], value);
      }
    }
  }
  return { bounds, spacing, columns, rows, values };
}

export function sampleWalkField(field: WalkField | undefined, position: WalkPoint): number {
  if (!field) return 0;
  const x = Math.max(0, Math.min(field.columns - 1, (position.x - field.bounds.left) / field.spacing));
  const y = Math.max(0, Math.min(field.rows - 1, (position.y - field.bounds.top) / field.spacing));
  const column = Math.min(field.columns - 1, Math.floor(x));
  const row = Math.min(field.rows - 1, Math.floor(y));
  const nextColumn = Math.min(column + 1, field.columns - 1);
  const nextRow = Math.min(row + 1, field.rows - 1);
  const dx = x - column;
  const dy = y - row;
  const upper = field.values[row * field.columns + column] * (1 - dx)
    + field.values[row * field.columns + nextColumn] * dx;
  const lower = field.values[nextRow * field.columns + column] * (1 - dx)
    + field.values[nextRow * field.columns + nextColumn] * dx;
  return upper * (1 - dy) + lower * dy;
}

export function walkerViewForHeading(heading: number, previous?: WalkerView): WalkerView {
  const angle = Math.atan2(Math.abs(Math.sin(heading)), Math.abs(Math.cos(heading)));
  const sideEdge = Math.PI / 8;
  const frontEdge = Math.PI * 3 / 8;
  const hysteresis = 0.08;
  if (previous === "side" && angle < sideEdge + hysteresis) return "side";
  if (previous === "front" && angle > frontEdge - hysteresis) return "front";
  const diagonal: WalkerView = Math.sin(heading) < 0 ? "diagonal-up" : "diagonal-down";
  if (previous?.startsWith("diagonal") && angle > sideEdge - hysteresis && angle < frontEdge + hysteresis) return diagonal;
  if (angle < sideEdge) return "side";
  if (angle > frontEdge) return "front";
  return diagonal;
}

function angleDifference(to: number, from: number) {
  return ((to - from + Math.PI) % TAU + TAU) % TAU - Math.PI;
}

function chooseHeading(state: WalkerState, bounds: WalkBounds, field: WalkField | undefined, random: () => number) {
  const turns = [-Math.PI, -2.4, -1.8, -1.2, -0.6, -0.3, 0, 0.3, 0.6, 1.2, 1.8, 2.4];
  const avoidance = state.exploring ? 0.18 : 2;
  const candidates = turns.map(turn => {
    const heading = state.heading + turn;
    const near = { x: state.position.x + Math.cos(heading) * 8, y: state.position.y + Math.sin(heading) * 8 };
    const far = { x: state.position.x + Math.cos(heading) * 18, y: state.position.y + Math.sin(heading) * 18 };
    const nearCost = sampleWalkField(field, near);
    const farCost = sampleWalkField(field, far);
    const edge = Math.hypot(far.x - clampWalkPosition(far, bounds).x, far.y - clampWalkPosition(far, bounds).y);
    const cost = 0.4 * nearCost + 0.6 * farCost;
    // Every content direction retains a nonzero probability. Only the page is a boundary.
    const weight = Math.exp(2.4 * Math.cos(turn) - avoidance * cost - edge * 0.15);
    return { heading, weight };
  });
  let pick = random() * candidates.reduce((sum, candidate) => sum + candidate.weight, 0);
  const selected = candidates.find(candidate => { pick -= candidate.weight; return pick <= 0; }) || candidates[candidates.length - 1];
  state.desiredHeading = selected.heading;
  state.target = clampWalkPosition({
    x: state.position.x + Math.cos(selected.heading) * 18,
    y: state.position.y + Math.sin(selected.heading) * 18,
  }, bounds);
  state.turnRemaining = 0.4 + random() * 0.35;
}

export function createWalkBounds(width: number, height: number, origin: WalkPoint = { x: 0, y: 0 }): WalkBounds {
  const left = Math.min(8, Math.max(0, width - WALKER_SIZE));
  const bottom = Math.max(0, height - WALKER_SIZE - 12);
  return {
    left: left + origin.x,
    right: Math.max(left, width - WALKER_SIZE - 8) + origin.x,
    top: Math.min(76, bottom) + origin.y,
    bottom: bottom + origin.y,
  };
}

export function clampWalkPosition(point: WalkPoint, bounds: WalkBounds): WalkPoint {
  return {
    x: Math.max(bounds.left, Math.min(bounds.right, point.x)),
    y: Math.max(bounds.top, Math.min(bounds.bottom, point.y)),
  };
}

export function createWalker(bounds: WalkBounds, atHome = false, initialPosition?: WalkPoint): WalkerState {
  const position = clampWalkPosition(initialPosition || { x: Math.min(bounds.left + 16, bounds.right), y: bounds.bottom }, bounds);
  return { position, target: { ...position }, mode: atHome ? "home" : "resting", facing: 1, remaining: 0.7, distance: 0,
    heading: 0, desiredHeading: 0, turnRemaining: 0, speed: 0, exploring: false };
}

export function advanceWalker(state: WalkerState, bounds: WalkBounds, seconds: number, random = Math.random, field?: WalkField) {
  if (state.mode === "home" || state.mode === "dragging") return;
  const elapsed = Math.max(0, Math.min(seconds, 0.1));
  state.remaining -= elapsed;

  if (state.mode === "fallen") {
    if (state.remaining <= 0) {
      state.mode = "resting";
      state.remaining = 0.8;
    }
    return;
  }

  if (state.mode === "resting") {
    if (state.remaining > 0) return;
    state.exploring = random() < EXPLORATION_CHANCE;
    chooseHeading(state, bounds, field, random);
    state.mode = "walking";
    state.distance = 0;
    state.speed = 0;
    state.remaining = 6 + random() * 6;
    return;
  }

  state.turnRemaining -= elapsed;
  if (state.turnRemaining <= 0) chooseHeading(state, bounds, field, random);
  const turn = angleDifference(state.desiredHeading, state.heading);
  const maxTurn = Math.PI * 0.85 * elapsed;
  state.heading += Math.max(-maxTurn, Math.min(maxTurn, turn * (1 - Math.exp(-4 * elapsed))));
  const oldSpeed = state.speed;
  state.speed = Math.min(WALK_SPEED, state.speed + elapsed * 140,
    WALK_SPEED * Math.max(0, Math.min(1, state.remaining / 0.35)));
  const distance = (oldSpeed + state.speed) / 2 * elapsed;
  const next = {
    x: state.position.x + Math.cos(state.heading) * distance,
    y: state.position.y + Math.sin(state.heading) * distance,
  };
  if (next.x < bounds.left || next.x > bounds.right) state.heading = Math.PI - state.heading;
  if (next.y < bounds.top || next.y > bounds.bottom) state.heading = -state.heading;
  if (next.x < bounds.left || next.x > bounds.right || next.y < bounds.top || next.y > bounds.bottom) {
    state.desiredHeading = state.heading;
    state.turnRemaining = 0;
  }
  const position = clampWalkPosition(next, bounds);
  state.distance += Math.hypot(position.x - state.position.x, position.y - state.position.y);
  state.position = position;
  // Avoid repeatedly flipping the sprite while its direction is almost vertical.
  if (Math.cos(state.heading) > 0.3) state.facing = 1;
  else if (Math.cos(state.heading) < -0.3) state.facing = -1;
  if (state.remaining <= 0) {
    state.mode = "resting";
    state.remaining = 0.8 + random() * 1.4;
    state.speed = 0;
  }
}

export function fallWalker(state: WalkerState) {
  if (state.mode === "home") return;
  state.mode = "fallen";
  state.remaining = 1.6;
}

export function isHomeDrop(position: WalkPoint, home: HomeBounds): boolean {
  const center = { x: position.x + WALKER_SIZE / 2, y: position.y + WALKER_SIZE / 2 };
  return center.x >= home.left - 8 && center.x <= home.right + 8
    && center.y >= home.top - 8 && center.y <= home.bottom + 8;
}

export function dropWalker(state: WalkerState, home: HomeBounds | null) {
  const atHome = home !== null && isHomeDrop(state.position, home);
  state.mode = atHome ? "home" : "resting";
  state.remaining = 0.7;
  return atHome;
}

export function wakeWalker(state: WalkerState, bounds: WalkBounds, home: HomeBounds) {
  state.position = clampWalkPosition({ x: home.left - WALKER_SIZE - 8, y: home.bottom - WALKER_SIZE }, bounds);
  state.target = { ...state.position };
  state.facing = -1;
  state.heading = Math.PI;
  state.desiredHeading = Math.PI;
  state.mode = "resting";
  state.remaining = 0.6;
}
