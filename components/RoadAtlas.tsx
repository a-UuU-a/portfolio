"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import type p5 from "p5";
import {
  advanceRoadAgent,
  agentPosition,
  buildRoadGraph,
  createRoadAgent,
  type RoadArea,
} from "@/lib/road-agents";

type Atlas = { areas: RoadArea[] };

export default function RoadAtlas() {
  const container = useRef<HTMLDivElement>(null);
  const syncPlayback = useRef<() => void>(() => {});
  const reducedMotionRef = useRef(false);
  const [area, setArea] = useState<RoadArea | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      reducedMotionRef.current = preference.matches;
      syncPlayback.current();
    };
    update();
    preference.addEventListener("change", update);
    return () => preference.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setError(false);
    fetch(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/data/road-atlas.json`, {
      signal: controller.signal,
    })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load road atlas");
        return response.json() as Promise<Atlas>;
      })
      .then((data) => {
        if (controller.signal.aborted) return;
        if (!data.areas?.length || data.areas.some((entry) => !entry.edges.length)) {
          throw new Error("Empty road atlas");
        }
        let previousArea: string | null = null;
        try {
          previousArea = sessionStorage.getItem("road-atlas:last-area");
        } catch {
          // The artwork still loads when browser storage is unavailable.
        }
        const alternatives = data.areas.filter((entry) => entry.name !== previousArea);
        const candidates = alternatives.length ? alternatives : data.areas;
        const nextArea = candidates[Math.floor(Math.random() * candidates.length)];
        try {
          sessionStorage.setItem("road-atlas:last-area", nextArea.name);
        } catch {
          // Storage is optional; it only prevents consecutive repeat locations.
        }
        setArea(nextArea);
      })
      .catch(() => {
        if (!controller.signal.aborted) setError(true);
      });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!area || !container.current) return;
    const host = container.current;
    const graph = buildRoadGraph(area);
    let cancelled = false;
    let visible = true;
    let resize: ResizeObserver | undefined;
    let intersection: IntersectionObserver | undefined;
    let roadLayer: p5.Graphics | undefined;
    let ownedInstance: p5 | undefined;
    setReady(false);

    const playback = () => {
      const sketch = ownedInstance;
      if (cancelled || !sketch) return;
      if (reducedMotionRef.current || !visible || document.hidden) {
        sketch.noLoop();
      } else {
        sketch.loop();
      }
    };
    syncPlayback.current = playback;
    document.addEventListener("visibilitychange", playback);

    import("p5").then(({ default: P5 }) => {
      if (cancelled) return;
      ownedInstance = new P5((p: p5) => {
        const agents = Array.from({ length: 250 }, () => createRoadAgent(graph));
        let scale = 1;
        let offsetX = 0;
        let offsetY = 0;
        const screen = (point: [number, number]) => [
          point[0] * scale + offsetX,
          point[1] * scale + offsetY,
        ];

        const drawRoads = () => {
          scale = Math.max(p.width / area.size[0], p.height / area.size[1]) * 1.06;
          offsetX = p.width / 2;
          offsetY = p.height / 2;
          roadLayer?.remove();
          roadLayer = p.createGraphics(p.width, p.height);
          roadLayer.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          roadLayer.background(9);
          roadLayer.stroke(48);
          roadLayer.strokeWeight(0.7);
          for (const [from, to] of area.edges) {
            const a = screen(area.nodes[from]);
            const b = screen(area.nodes[to]);
            roadLayer.line(a[0], a[1], b[0], b[1]);
          }
        };

        p.setup = () => {
          if (cancelled) return;
          p.pixelDensity(Math.min(window.devicePixelRatio || 1, 2));
          const canvas = p.createCanvas(Math.max(host.clientWidth, 1), Math.max(host.clientHeight, 1));
          canvas.attribute("role", "img");
          canvas.attribute("aria-label", "White particles wandering along a network of real streets.");
          p.frameRate(30);
          drawRoads();
          // Seed short trails so the still image also works with reduced motion.
          for (let step = 0; step < 20; step++) {
            agents.forEach((agent) => advanceRoadAgent(graph, agent, 1 / 30));
          }
          resize = new ResizeObserver(() => {
            const width = host.clientWidth;
            const height = host.clientHeight;
            if (cancelled || !width || !height || (width === p.width && height === p.height)) return;
            // Rebuild the buffer before requesting a redraw (p5 redraw is async).
            p.resizeCanvas(width, height, true);
            drawRoads();
            p.redraw();
          });
          resize.observe(host);
          intersection = new IntersectionObserver(([entry]) => {
            visible = entry.isIntersecting;
            playback();
          });
          intersection.observe(host);
          if (reducedMotionRef.current || document.hidden) p.noLoop();
          setReady(true);
        };

        p.draw = () => {
          if (cancelled || !roadLayer?.width || !roadLayer?.height) return;
          p.image(roadLayer, 0, 0);
          for (const agent of agents) {
            if (!reducedMotionRef.current && visible && !document.hidden) {
              advanceRoadAgent(graph, agent, p.deltaTime / 1000);
            }
            p.noFill();
            p.strokeWeight(1);
            p.stroke(255, 75);
            p.beginShape();
            for (const point of agent.trail) {
              const [x, y] = screen(point);
              p.vertex(x, y);
            }
            p.endShape();
            const [x, y] = screen(agentPosition(graph, agent));
            if (x < -10 || x > p.width + 10 || y < -10 || y > p.height + 10) continue;
            p.noStroke();
            p.fill(255, 14);
            p.circle(x, y, 10);
            p.fill(255, 40);
            p.circle(x, y, 4.5);
            p.fill(245);
            p.circle(x, y, 1.8);
          }
        };
      }, host);
    }).catch(() => {
      if (!cancelled) setError(true);
    });

    return () => {
      cancelled = true;
      resize?.disconnect();
      intersection?.disconnect();
      document.removeEventListener("visibilitychange", playback);
      syncPlayback.current = () => {};
      ownedInstance?.noLoop();
      roadLayer?.remove();
      roadLayer = undefined;
      ownedInstance?.remove();
    };
  }, [area, attempt]);

  return (
    <figure className="road-atlas relative left-1/2 mb-16 -translate-x-1/2" aria-label="Street wanderers, a generative road artwork">
      <div className="relative overflow-hidden bg-neutral-950 text-white">
        <div ref={container} className="road-atlas-canvas w-full" />
        {(!ready || error) && (
          <div className="absolute inset-0 flex items-center justify-center px-6 text-center text-xs font-light tracking-wider text-neutral-400" role="status">
            {error ? (
              <button className="p-4 underline underline-offset-4 hover:text-white" onClick={() => setAttempt((value) => value + 1)}>Unable to load this view. Try again.</button>
            ) : "Finding our way…"}
          </div>
        )}
      </div>
      <figcaption className="mt-3 flex justify-end text-[10px] font-light tracking-wide text-gray-400">
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 transition-colors hover:text-gray-700">Roads © OpenStreetMap contributors <ArrowUpRight size={10} /></a>
      </figcaption>
    </figure>
  );
}
