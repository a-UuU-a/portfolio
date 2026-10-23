export type SpritePoint = { x: number; y: number };

// Rasterize line segments into solid square pixels on the SVG's source grid.
export function pixelPath(lines: SpritePoint[][]) {
  const pixels = new Set<string>();
  for (const points of lines) {
    for (let segment = 1; segment < points.length; segment++) {
      const from = points[segment - 1];
      const to = points[segment];
      const steps = Math.max(1, Math.ceil(Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y)) * 2));
      for (let step = 0; step <= steps; step++) {
        const x = Math.round(from.x + (to.x - from.x) * step / steps);
        const y = Math.round(from.y + (to.y - from.y) * step / steps);
        pixels.add(x + " " + y);
      }
    }
  }
  return Array.from(pixels, pixel => "M" + pixel + "h1v1h-1Z").join("");
}
