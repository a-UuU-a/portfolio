import { WALK_FRAMES, type WalkerView } from "@/lib/blog-walker";
import { pixelPath, type SpritePoint as Point } from "@/lib/blog-sprite";

const HEAD = "M6 1h4v1h1v1h1v4h-1v1h-1v1H6V8H5V7H4V3h1V2h1Z";
// Taper the diagonal head's corners while keeping its slight tilt and round middle.
const HEADS: Record<WalkerView, string> = {
  side: HEAD,
  front: HEAD,
  "diagonal-down": "M6 1h3v1h2v1h1v4h-1v1h-1v1H7V8H5V7H4V3h1V2h1Z",
  "diagonal-up": "M7 1h3v1h1v1h1v4h-1v1h-2v1H6V8H5V7H4V3h1V2h2Z",
};
const TORSOS: Record<WalkerView, string> = {
  side: "M7 9h3v2H7Z",
  front: "M7 9h3v2H7Z",
  "diagonal-down": "M7 9h3v1h1v2H7v-1H6v-1h1Z",
  "diagonal-up": "M6 9h4v1h1v1H9v1H6Z",
};

function foot(step: number): Point {
  const phase = step % WALK_FRAMES;
  if (phase < 6) return { x: 11 - phase, y: 14 };
  const swing = (phase - 6) / 6;
  return { x: 5 + 3 * (1 - Math.cos(swing * Math.PI)), y: 14 - 2 * Math.sin(swing * Math.PI) };
}

function leg(hip: Point, ankle: Point, bendSide = 1): Point[] {
  const dx = ankle.x - hip.x;
  const dy = ankle.y - hip.y;
  const distance = Math.hypot(dx, dy);
  const bend = Math.sqrt(Math.max(0, 2.6 ** 2 - (distance / 2) ** 2));
  const knee = { x: (hip.x + ankle.x) / 2 + bendSide * dy / distance * bend, y: (hip.y + ankle.y) / 2 - bendSide * dx / distance * bend };
  return [hip, knee, ankle, { x: ankle.x + bendSide, y: ankle.y }];
}

function diagonalPose(step: number, view: WalkerView, bob: number) {
  const resting = step < 0;
  const depth = view === "diagonal-up" ? -1 : 1;
  const limbs: Point[][] = [];
  for (const index of [0, 1]) {
    const lateral = index === 0 ? -1.3 : 1.3;
    const near = lateral * depth < 0;
    const stride = resting ? { x: 8, y: 14 } : foot(step + index * 6);
    const along = stride.x - 8;
    const lift = (14 - stride.y) * (near ? 1 : 0.65);
    const hip = { x: 8 + lateral * 0.6, y: 10.5 - depth * lateral * 0.6 + bob };
    const ankle = {
      x: 8 + (along + lateral) * 0.6,
      y: 12.5 + depth * (along - lateral) * 0.6 - lift,
    };
    const knee = {
      x: (hip.x + ankle.x) / 2 + 0.65,
      y: (hip.y + ankle.y) / 2 + depth * 0.35 - lift * 0.25,
    };
    const toe = { x: ankle.x + 0.8, y: Math.min(15, ankle.y + depth * 0.8) };
    limbs.push([hip, knee, ankle, toe]);

    const shoulder = { x: 8 + lateral * 0.7, y: 9.5 - depth * lateral * 0.7 + bob };
    const swing = -along * (near ? 0.55 : 0.35);
    const hand = {
      x: shoulder.x + swing * 0.7,
      y: shoulder.y + (near ? 2.2 : 1.2) + depth * swing * 0.7,
    };
    limbs.push([shoulder, { x: shoulder.x + swing * 0.3, y: shoulder.y + 0.8 }, hand]);
  }
  return { bob, limbs: pixelPath(limbs) };
}

function pose(step: number, view: WalkerView) {
  const resting = step < 0;
  const front = view === "front";
  const bob = resting || step % 6 < 2 || step % 6 === 5 ? 0 : -1;
  if (view.startsWith("diagonal")) return diagonalPose(step, view, bob);
  const hip = { x: 8, y: 10 + bob };
  const stride = [resting ? { x: 6, y: 14 } : foot(step), resting ? { x: 10, y: 14 } : foot(step + 6)];
  const ankles = stride.map((ankle, index) => front ? { x: index === 0 ? 6 : 10, y: ankle.y } : ankle);
  const arms = stride.map((ankle, index) => {
    const shoulder = { x: index === 0 ? 7 : 9, y: 9 + bob };
    const hand = {
      x: front || resting ? (index === 0 ? 5 : 11) : 8 - (ankle.x - 8) * 0.8,
      y: 11 + bob + (front && ankle.y < 14 ? 1 : 0),
    };
    return [shoulder, { x: (shoulder.x + hand.x) / 2, y: 10 + bob }, hand];
  });
  return { bob, limbs: pixelPath([leg(hip, ankles[0], front ? -1 : 1), leg(hip, ankles[1]), ...arms]) };
}

const views: WalkerView[] = ["side", "front", "diagonal-down", "diagonal-up"];
const animations = views.map(view => ({ view, poses: Array.from({ length: WALK_FRAMES + 1 }, (_, index) => pose(index - 1, view)) }));

export default function BlogWalkerSprite() {
  return (
    <svg className="blog-walker__sprite" viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      {animations.map(({ poses, view }) => (
        <g key={view} className={"blog-walker__view blog-walker__view--" + view}>
          {poses.map(({ bob, limbs }, index) => (
            <g key={index} className="blog-walker__pose" data-step={index === 0 ? "rest" : index - 1}>
              <path d={limbs} />
              <path d={HEADS[view] + " " + TORSOS[view]} transform={"translate(0 " + bob + ")"} />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
