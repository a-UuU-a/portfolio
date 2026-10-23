"use client";

import { useEffect, useRef, useState, type PointerEvent } from "react";
import { usePathname } from "next/navigation";
import BlogWalkerSprite from "@/components/BlogWalkerSprite";
import BlogCyclistSprite from "@/components/BlogCyclistSprite";
import {
  advanceWalker, clampWalkPosition, createWalkBounds, createWalker, dropWalker,
  fallWalker, isHomeDrop, wakeWalker,
  createWalkField, walkerViewForHeading, WALKER_SIZE, WALK_FRAMES, WALK_STRIDE,
  type ContentRegion, type HomeBounds, type WalkerMode, type WalkerState, type WalkField, type WalkBounds, type WalkerView, type WalkerVariant,
} from "@/lib/blog-walker";
import { readContentRegions } from "@/lib/blog-walker-content";

const HOME_STORAGE_KEY = "blog-walker:home";
type Gesture = {
  pointerId: number;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  clientX: number;
  clientY: number;
  moved: boolean;
};

export default function BlogWalker({ variant }: { variant: WalkerVariant }) {
  const pathname = usePathname();
  const layerRef = useRef<HTMLDivElement>(null);
  const boundsRef = useRef<WalkBounds | null>(null);
  const characterRef = useRef<HTMLButtonElement>(null);
  const facingRef = useRef<HTMLDivElement>(null);
  const homeRef = useRef<HTMLButtonElement>(null);
  const stateRef = useRef<WalkerState | null>(null);
  const gestureRef = useRef<Gesture | null>(null);
  const refreshRef = useRef<() => void>(() => {});
  const [mode, setMode] = useState<WalkerMode>("resting");
  const [ready, setReady] = useState(false);
  const [dropReady, setDropReady] = useState(false);

  const homeBounds = (): HomeBounds | null => {
    const rect = homeRef.current?.getBoundingClientRect();
    return rect ? {
      left: rect.left + window.scrollX, right: rect.right + window.scrollX,
      top: rect.top + window.scrollY, bottom: rect.bottom + window.scrollY,
    } : null;
  };
  const saveHome = (atHome: boolean) => {
    try {
      if (atHome) localStorage.setItem(HOME_STORAGE_KEY, "1");
      else localStorage.removeItem(HOME_STORAGE_KEY);
    } catch {
      // The house still works when browser storage is unavailable.
    }
  };

  const positionHeldCharacter = () => {
    const state = stateRef.current;
    const gesture = gestureRef.current;
    const pageBounds = boundsRef.current;
    if (!state || !gesture || !pageBounds || !gesture.moved) return;
    const visible = createWalkBounds(window.innerWidth, window.innerHeight, { x: window.scrollX, y: window.scrollY });
    const left = Math.max(pageBounds.left, visible.left);
    const top = Math.max(pageBounds.top, visible.top);
    state.position = clampWalkPosition({
      x: gesture.clientX + window.scrollX - gesture.offsetX,
      y: gesture.clientY + window.scrollY - gesture.offsetY,
    }, { left, top, right: Math.max(left, Math.min(pageBounds.right, visible.right)), bottom: Math.max(top, Math.min(pageBounds.bottom, visible.bottom)) });
    const home = homeBounds();
    setDropReady(home !== null && isHomeDrop(state.position, home));
  };

  useEffect(() => {
    const character = characterRef.current;
    const facing = facingRef.current;
    const layer = layerRef.current;
    if (!character || !facing || !layer) return;
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const pageGeometry = () => {
      const rect = layer.getBoundingClientRect();
      const origin = { x: rect.left + window.scrollX, y: rect.top + window.scrollY };
      return { origin, bounds: createWalkBounds(rect.width, rect.height, origin) };
    };
    let { origin, bounds } = pageGeometry();
    boundsRef.current = bounds;
    let atHome = false;
    try { atHome = localStorage.getItem(HOME_STORAGE_KEY) === "1"; } catch {}
    const state = createWalker(bounds, atHome, {
      x: bounds.left + 16,
      y: window.scrollY + window.innerHeight - WALKER_SIZE - 12,
    });
    stateRef.current = state;
    let frame = 0;
    let previousTime = 0;
    let paintedMode: WalkerMode | null = null;
    let paintedStep = "";
    let paintedView: WalkerView | undefined;
    let contentDirty = true;
    let geometryDirty = false;
    let fieldDirty = true;
    let disposed = false;
    let regions: ContentRegion[] = [];
    let field: WalkField | undefined;
    const roots = Array.from(document.querySelectorAll("main, footer"));
    const updateGeometry = () => {
      if (!geometryDirty) return;
      ({ origin, bounds } = pageGeometry());
      boundsRef.current = bounds;
      state.position = clampWalkPosition(state.position, bounds);
      state.target = clampWalkPosition(state.target, bounds);
      geometryDirty = false;
    };
    const updateField = () => {
      if (contentDirty) { regions = readContentRegions(roots); contentDirty = false; }
      // Keep a document-space section around the character rather than a grid for a long article.
      if (!field || state.position.y < field.bounds.top + 64 && field.bounds.top > bounds.top
        || state.position.y > field.bounds.bottom - 64 && field.bounds.bottom < bounds.bottom) fieldDirty = true;
      if (!fieldDirty) return;
      const span = Math.max(window.innerHeight, 600) * 0.75;
      field = createWalkField({
        ...bounds,
        top: Math.max(bounds.top, state.position.y - span),
        bottom: Math.min(bounds.bottom, state.position.y + span),
      }, regions);
      fieldDirty = false;
    };
    const inView = () => state.position.x + WALKER_SIZE > window.scrollX
      && state.position.x < window.scrollX + window.innerWidth
      && state.position.y + WALKER_SIZE > window.scrollY + 76
      && state.position.y < window.scrollY + window.innerHeight;
    const draw = () => {
      character.style.transform = "translate3d(" + (state.position.x - origin.x) + "px, " + (state.position.y - origin.y) + "px, 0)";
      facing.style.transform = "scaleX(" + state.facing + ")";
      const step = state.mode === "walking" ? String(Math.floor(state.distance / WALK_STRIDE * WALK_FRAMES) % WALK_FRAMES) : "rest";
      if (paintedStep !== step) {
        paintedStep = step;
        character.dataset.step = step;
      }
      const view = walkerViewForHeading(state.heading, paintedView);
      if (paintedView !== view) {
        paintedView = view;
        character.dataset.view = view;
      }
      if (paintedMode !== state.mode) {
        paintedMode = state.mode;
        setMode(state.mode);
      }
    };
    const canAnimate = () => !document.hidden && inView() && state.mode !== "home" && state.mode !== "dragging"
      && (!preference.matches || state.mode === "fallen");
    const stopWalking = () => {
      if (state.mode === "walking") {
        state.mode = "resting";
        state.remaining = 0.7;
      }
    };
    const animate = (now: number) => {
      frame = 0;
      updateGeometry();
      if (!canAnimate()) {
        stopWalking();
        draw();
        return;
      }
      const seconds = previousTime ? (now - previousTime) / 1000 : 0;
      previousTime = now;
      updateField();
      advanceWalker(state, bounds, seconds, Math.random, field);
      if (!canAnimate()) stopWalking();
      draw();
      if (canAnimate()) frame = requestAnimationFrame(animate);
    };
    const refresh = () => {
      cancelAnimationFrame(frame);
      frame = 0;
      previousTime = 0;
      updateGeometry();
      if (!canAnimate()) stopWalking();
      draw();
      if (canAnimate()) frame = requestAnimationFrame(animate);
    };
    const contentChanged = () => {
      contentDirty = true;
      geometryDirty = true;
      fieldDirty = true;
      refresh();
    };
    const scrolled = () => {
      if (gestureRef.current && state.mode === "dragging") {
        gestureRef.current.moved = true;
        positionHeldCharacter();
      }
      // Scrolling never changes an unheld character's document position or content field.
      refresh();
    };

    refreshRef.current = refresh;
    refresh();
    setReady(true);
    const resizeObserver = new ResizeObserver(contentChanged);
    const mutationObserver = new MutationObserver(contentChanged);
    resizeObserver.observe(layer.parentElement!);
    for (const root of roots) {
      resizeObserver.observe(root);
      for (const image of Array.from(root.querySelectorAll("img, video, iframe"))) resizeObserver.observe(image);
      mutationObserver.observe(root, { childList: true, characterData: true, subtree: true });
      root.addEventListener("load", contentChanged, true);
    }
    document.fonts.ready.then(() => { if (!disposed) contentChanged(); });
    window.addEventListener("resize", contentChanged);
    window.addEventListener("scroll", scrolled, { passive: true });
    document.addEventListener("visibilitychange", refresh);
    preference.addEventListener("change", refresh);
    return () => {
      cancelAnimationFrame(frame);
      disposed = true;
      resizeObserver.disconnect();
      mutationObserver.disconnect();
      for (const root of roots) root.removeEventListener("load", contentChanged, true);
      stateRef.current = null;
      boundsRef.current = null;
      gestureRef.current = null;
      refreshRef.current = () => {};
      window.removeEventListener("resize", contentChanged);
      window.removeEventListener("scroll", scrolled);
      document.removeEventListener("visibilitychange", refresh);
      preference.removeEventListener("change", refresh);
    };
  }, [pathname]);

  const fall = () => {
    if (!stateRef.current) return;
    fallWalker(stateRef.current);
    refreshRef.current();
  };
  const pickUp = (event: PointerEvent<HTMLButtonElement>) => {
    const state = stateRef.current;
    if (!state || event.button !== 0 || !event.isPrimary) return;
    event.preventDefault();
    const rect = event.currentTarget.getBoundingClientRect();
    gestureRef.current = {
      pointerId: event.pointerId, startX: event.clientX, startY: event.clientY,
      offsetX: event.clientX - rect.left, offsetY: event.clientY - rect.top,
      clientX: event.clientX, clientY: event.clientY, moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    state.mode = "dragging";
    refreshRef.current();
  };
  const drag = (event: PointerEvent<HTMLButtonElement>) => {
    const gesture = gestureRef.current;
    const state = stateRef.current;
    if (!gesture || !state || gesture.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - gesture.startX, event.clientY - gesture.startY) >= 6) gesture.moved = true;
    if (!gesture.moved) return;
    gesture.clientX = event.clientX;
    gesture.clientY = event.clientY;
    positionHeldCharacter();
    refreshRef.current();
  };
  const release = (event: PointerEvent<HTMLButtonElement>, cancelled = false) => {
    const gesture = gestureRef.current;
    const state = stateRef.current;
    if (!gesture || !state || gesture.pointerId !== event.pointerId) return;
    gestureRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDropReady(false);
    if (!cancelled && !gesture.moved) {
      fallWalker(state);
    } else {
      const atHome = dropWalker(state, cancelled ? null : homeBounds());
      if (atHome) {
        saveHome(true);
        homeRef.current?.focus({ preventScroll: true });
      }
    }
    refreshRef.current();
  };
  const toggleHome = () => {
    const state = stateRef.current;
    const home = homeBounds();
    if (!state || !home || !boundsRef.current) return;
    if (state.mode === "home") {
      wakeWalker(state, boundsRef.current, home);
      saveHome(false);
    } else {
      state.mode = "home";
      saveHome(true);
    }
    refreshRef.current();
  };

  return (
    <>
      <div ref={layerRef} className="blog-walker-layer" style={{ opacity: ready ? 1 : 0 }}>
        <button
          ref={characterRef}
          type="button"
          className="blog-walker"
          data-variant={variant}
          data-mode={mode}
          data-step="rest"
          data-view="side"
          tabIndex={ready && mode !== "home" ? 0 : -1}
          aria-label={(variant === "cycling" ? "自転車に乗ったミニキャラ。" : "歩くミニキャラ。") + "クリックで転ぶ。ドラッグでつまんで家に帰せます。"}
          title="クリックでこける・ドラッグでつまむ"
          onPointerDown={pickUp}
          onPointerMove={drag}
          onPointerUp={(event) => release(event)}
          onPointerCancel={(event) => release(event, true)}
          onLostPointerCapture={(event) => release(event, true)}
          onClick={(event) => { if (event.detail === 0) fall(); }}
        >
          <div className="blog-walker__body" aria-hidden="true">
            <div ref={facingRef} className="blog-walker__facing">
              {variant === "cycling" ? <BlogCyclistSprite /> : <BlogWalkerSprite />}
            </div>
          </div>
        </button>
      </div>
      <button
        ref={homeRef}
        type="button"
        className="blog-walker-home"
        style={{ opacity: ready ? 1 : 0 }}
        data-occupied={mode === "home"}
        data-drop-ready={dropReady}
        tabIndex={ready ? 0 : -1}
        onClick={toggleHome}
        aria-label={mode === "home" ? "ミニキャラを家から呼び出す" : "ミニキャラを家に帰す"}
        aria-pressed={mode === "home"}
        title={mode === "home" ? "タップして呼び出す" : "ここにドラッグしてひとやすみ"}
      >
        <svg width="32" height="32" viewBox="0 0 16 16" fill="currentColor" shapeRendering="crispEdges" aria-hidden="true">
          <path d="M7 1h2v1h2v1h2v1h2v2h-2V5h-2V4H9V3H7v1H5v1H3v1H1V4h2V3h2V2h2Z" />
          <path d="M2 6h2v7h8V6h2v9H2Z" />
          <path d="M6 9h4v4H8v-2H6Z" />
          <rect x="5" y="6" width="2" height="2" />
          {mode === "home" && <rect x="8" y="10" width="2" height="3" />}
        </svg>
        {mode === "home" && <span className="blog-walker-home__sleep" aria-hidden="true">z</span>}
      </button>
    </>
  );
}
