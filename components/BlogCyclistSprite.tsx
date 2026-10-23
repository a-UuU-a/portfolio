import { WALK_FRAMES, type WalkerView } from "@/lib/blog-walker";
import { pixelPath, type SpritePoint } from "@/lib/blog-sprite";

type BikePoint = { along: number; across: number; height: number };
const TAU = Math.PI * 2;
const PEDAL_RADIUS = 3.3;
const HEAD = "M2 0h4v1h2v1h1v4H8v1H6v1H2V7H1V6H0V2h1V1h1Z";

function project(point: BikePoint, view: WalkerView): SpritePoint {
  const { along, across, height } = point;
  if (view === "side") return { x: 12 + along, y: 22 - height };
  if (view === "front") return { x: 12 + across, y: 21 - height + along * 0.18 };
  const depth = view === "diagonal-up" ? -1 : 1;
  return { x: 12 + along * 0.68 + across * 0.75, y: 20.5 - height + depth * (along * 0.28 - across * 0.35) };
}

function pose(step: number, view: WalkerView) {
  const phase = Math.max(0, step) / WALK_FRAMES * TAU;
  const point = (along: number, height: number, across = 0): BikePoint => ({ along, across, height });
  const draw = (lines: BikePoint[][]) => pixelPath(lines.map(line => line.map(p => project(p, view))));
  const rear = point(-7, 4);
  const front = point(7, 4);
  const crank = point(-0.5, 4.5);
  const seat = point(-2.5, 9.5);
  const stem = point(4.2, 10);
  const wheels = [rear, front].flatMap(center => {
    const rim = Array.from({ length: 49 }, (_, index) => {
      const angle = index / 48 * TAU;
      return point(center.along + Math.cos(angle) * 4, center.height + Math.sin(angle) * 4,
        view === "front" ? Math.cos(angle) * 0.8 : 0);
    });
    const spokes = Array.from({ length: 4 }, (_, index) => {
      const angle = -phase + index * Math.PI / 2;
      return [center, point(center.along + Math.cos(angle) * 3, center.height + Math.sin(angle) * 3)];
    });
    return [rim, ...spokes];
  });
  const bike = draw([
    ...wheels,
    [rear, seat, crank, rear], [seat, stem, crank], [stem, front],
    [point(-4.5, 10), point(-1, 10)],
    [stem, point(5.5, 12), point(6.5, 12, -2), point(6.5, 12, 2)],
  ]);
  const legs = [-1, 1].map((side, index) => {
    const angle = phase + index * Math.PI;
    const hip = point(-2, 11, side);
    const ankle = point(crank.along + Math.cos(angle) * PEDAL_RADIUS, crank.height + Math.sin(angle) * PEDAL_RADIUS, side * 1.5);
    const knee = point((hip.along + ankle.along) / 2 + 2.8,
      (hip.height + ankle.height) / 2 + 0.8 + Math.sin(angle) * 0.6, side * 2);
    return draw([[hip, knee, ankle, point(ankle.along + 1, ankle.height, ankle.across)]]);
  });
  const body = draw([
    [point(-2, 11), point(1, 14)], [point(-1, 11), point(2, 14)],
    ...[-1, 1].map(side => [point(1, 13.5, side), point(4, 11.8, side * 2), point(6.5, 12, side * 2)]),
  ]);
  const head = project(point(2, 17.5), view);
  return { bike, legs, body, head: { x: Math.round(head.x) - 4, y: Math.max(0, Math.round(head.y) - 4) } };
}

const views: WalkerView[] = ["side", "front", "diagonal-down", "diagonal-up"];
const animations = views.map(view => ({ view, poses: Array.from({ length: WALK_FRAMES + 1 }, (_, index) => pose(index - 1, view)) }));

export default function BlogCyclistSprite() {
  return (
    <svg className="blog-walker__sprite" viewBox="0 0 24 24" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
      {animations.map(({ view, poses }) => (
        <g key={view} className={"blog-walker__view blog-walker__view--" + view}>
          {poses.map(({ bike, legs, body, head }, index) => (
            <g key={index} className="blog-walker__pose" data-step={index === 0 ? "rest" : index - 1}>
              <path d={bike} />
              <path d={legs[0]} />
              <path d={body} />
              <path d={legs[1]} />
              <path d={HEAD} transform={"translate(" + head.x + " " + head.y + ")"} />
            </g>
          ))}
        </g>
      ))}
    </svg>
  );
}
