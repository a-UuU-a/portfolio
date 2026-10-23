"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Minus, Pause, Play, Plus, RotateCcw } from "lucide-react";
import { assetPath, buildingOrbitVector, clampGlobeZoom, globeProjector, globeVector, longitudeDifference, photoAnchorProgress, photoClusterOffset, photoDensityScale, photoGlobeVector, photoMapClearance, relaxPhotoLayout, spreadMarkers, wrapLongitude, type AndoBuilding, type GlobeView, type Vector3, type PhotoLayoutOffset, type PhotoLayoutTarget } from "@/lib/ando";
import styles from "./ando.module.css";

type World = { coastlines: [number, number][][]; points: [number, number][] };
type Props = {
  buildings: AndoBuilding[];
  selectedId: string | null;
  rotating: boolean;
  reducedMotion: boolean;
  inspecting: boolean;
  onSelect: (id: string) => void;
  onInspect: (photoId: string, trigger: HTMLButtonElement) => void;
  onInteract: () => void;
  onToggleRotation: () => void;
};

const initialView: GlobeView = { latitude: 24, longitude: 110, zoom: 1 };

export default function AndoGlobe({ buildings, selectedId, rotating, reducedMotion, inspecting, onSelect, onInspect, onInteract, onToggleRotation }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const markers = useRef(new Map<string, HTMLButtonElement>());
  const cards = useRef(new Map<string, HTMLButtonElement>());
  const view = useRef<GlobeView>({ ...initialView });
  const target = useRef<GlobeView | null>(null);
  const drag = useRef<{ pointerId: number; x: number; y: number } | null>(null);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinchDistance = useRef<number | null>(null);
  const suppressClick = useRef(false);
  const requestDraw = useRef<() => void>(() => {});
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [dragging, setDragging] = useState(false);

  const photos = useMemo(() => {
    return buildings.flatMap((building, buildingIndex) => {
      if (selectedId && building.id !== selectedId) return [];
      const vector = buildingOrbitVector(buildingIndex, buildings.length, initialView);
      const anchor = globeVector(...building.coordinates);
      return building.photos.map((photo, index) => ({
        ...photo,
        building,
        vector,
        anchor,
        index,
        count: building.photos.length,
        phase: Array.from(photo.id).reduce((seed, character) => (seed * 31 + character.charCodeAt(0)) % 997, 0) / 997 * Math.PI * 2,
      }));
    });
  }, [buildings, selectedId]);

  const live = useRef({ rotating, selectedId, photos, inspecting });
  useEffect(() => { live.current = { rotating, selectedId, photos, inspecting }; requestDraw.current(); }, [rotating, selectedId, photos, inspecting]);

  useEffect(() => {
    const selected = buildings.find((building) => building.id === selectedId);
    target.current = selected
      ? { latitude: selected.coordinates[0], longitude: selected.coordinates[1], zoom: target.current?.zoom ?? view.current.zoom }
      : null;
    requestDraw.current();
  }, [selectedId, buildings]);

  useEffect(() => {
    const container = host.current;
    if (!container) return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      onInteract();
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? container.clientHeight : 1;
      const factor = Math.exp(Math.max(-0.4, Math.min(0.4, -event.deltaY * unit * 0.002)));
      const destination = target.current ?? view.current;
      target.current = { ...destination, zoom: clampGlobeZoom(destination.zoom * factor) };
      requestDraw.current();
    };
    container.addEventListener("wheel", wheel, { passive: false });
    return () => container.removeEventListener("wheel", wheel);
  }, [onInteract]);

  useEffect(() => {
    const container = host.current;
    const surface = canvas.current;
    if (!container || !surface) return;
    const context = surface.getContext("2d");
    if (!context) { setError(true); return; }
    const controller = new AbortController();
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    let world: { coastlines: Vector3[][]; points: Vector3[] } | null = null;
    let width = 1;
    let height = 1;
    let frame = 0;
    let previousTime = 0;
    let animationTime = 0;
    const markerOffsets = new Map<string, { x: number; y: number }>();
    const photoOffsets = new Map<string, PhotoLayoutOffset>();
    const displayedOffsets = new Map<string, PhotoLayoutOffset>();
    let previousLayout: PhotoLayoutTarget[] = [];
    let layoutWidth = 0;
    let layoutHeight = 0;
    let visible = true;
    let disposed = false;
    setError(false);
    setReady(false);

    const resize = new ResizeObserver(() => {
      width = container.clientWidth;
      height = container.clientHeight;
      const density = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.round(width * density);
      surface.height = Math.round(height * density);
      context.setTransform(density, 0, 0, density, 0, 0);
      start();
    });
    resize.observe(container);
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    });
    observer.observe(container);

    fetch(assetPath("/data/ando-world.json"), { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("Unable to load world map");
        return response.json() as Promise<World>;
      })
      .then((data) => {
        if (disposed) return;
        world = {
          coastlines: data.coastlines.map((ring) => ring.map(([lon, lat]) => globeVector(lat, lon))),
          points: data.points.map(([lon, lat]) => globeVector(lat, lon)),
        };
        setReady(true);
        start();
      })
      .catch(() => { if (!disposed) setError(true); });

    const grid: Vector3[][] = [];
    for (let lat = -60; lat <= 60; lat += 30) {
      grid.push(Array.from({ length: 181 }, (_, index) => globeVector(lat, index * 2 - 180)));
    }
    for (let lon = -180; lon < 180; lon += 30) {
      grid.push(Array.from({ length: 91 }, (_, index) => globeVector(index * 2 - 90, lon)));
    }
    const buildingVectors = buildings.map((building) => ({ id: building.id, vector: globeVector(...building.coordinates) }));

    const draw = (time: number) => {
      frame = 0;
      if (disposed || document.hidden || !visible || live.current.inspecting) { previousTime = 0; return; }
      if (time - previousTime < 1000 / 30 && previousTime) { frame = requestAnimationFrame(draw); return; }
      const elapsed = previousTime ? Math.min((time - previousTime) / 1000, 0.06) : 0;
      previousTime = time;
      const destination = target.current;
      if (destination) {
        const ease = preference.matches ? 1 : Math.min(1, elapsed * 7 + 0.025);
        view.current.latitude += (destination.latitude - view.current.latitude) * ease;
        view.current.longitude = wrapLongitude(view.current.longitude + longitudeDifference(view.current.longitude, destination.longitude) * ease);
        view.current.zoom += (destination.zoom - view.current.zoom) * ease;
        if (Math.abs(destination.latitude - view.current.latitude) < 0.03 && Math.abs(longitudeDifference(view.current.longitude, destination.longitude)) < 0.03 && Math.abs(destination.zoom - view.current.zoom) < 0.001) target.current = null;
      } else if (live.current.rotating && !drag.current && !preference.matches) {
        view.current.longitude = wrapLongitude(view.current.longitude + elapsed * 2.2);
      }
      // Floating continues when zooming, filtering, or pausing the globe's rotation.
      if (!drag.current && !preference.matches) animationTime += elapsed;

      const radius = Math.min(width * 0.315, height * 0.345) * view.current.zoom;
      container.dataset.zoom = `${view.current.zoom}`;
      const cx = width / 2;
      const cy = height / 2 - 8;
      const project = globeProjector(view.current);
      context.clearRect(0, 0, width, height);

      const aura = context.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.6);
      aura.addColorStop(0, "rgba(123, 136, 151, 0.06)");
      aura.addColorStop(1, "rgba(123, 136, 151, 0)");
      context.fillStyle = aura;
      context.fillRect(0, 0, width, height);

      const sphere = context.createRadialGradient(cx - radius * 0.4, cy - radius * 0.5, 0, cx + radius * 0.25, cy + radius * 0.25, radius * 1.3);
      sphere.addColorStop(0, "#ffffff");
      sphere.addColorStop(0.6, "#f7f8fa");
      sphere.addColorStop(1, "#e7eaee");
      context.beginPath();
      context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.fillStyle = sphere;
      context.fill();
      context.strokeStyle = "rgba(171, 180, 191, 0.55)";
      context.lineWidth = 1;
      context.stroke();

      const drawLines = (lines: Vector3[][], stroke: string) => {
        context.strokeStyle = stroke;
        context.lineWidth = 0.65;
        context.beginPath();
        for (const line of lines) {
          let drawing = false;
          for (const vector of line) {
            const [x, y, z] = project(vector);
            if (z <= 0.005) { drawing = false; continue; }
            if (drawing) context.lineTo(cx + x * radius, cy - y * radius);
            else context.moveTo(cx + x * radius, cy - y * radius);
            drawing = true;
          }
        }
        context.stroke();
      };
      drawLines(grid, "rgba(171, 180, 191, 0.25)");
      if (world) {
        drawLines(world.coastlines, "rgba(117, 130, 145, 0.55)");
        context.fillStyle = "rgba(117, 130, 145, 0.56)";
        for (const vector of world.points) {
          const [x, y, z] = project(vector);
          if (z <= 0) continue;
          const size = Math.min(2.1, Math.max(0.8, radius / 190)) * (0.5 + z * 0.5);
          context.fillRect(cx + x * radius, cy - y * radius, size, size);
        }
      }

      const locations = buildingVectors.map(({ id, vector }) => {
        const [x, y, z] = project(vector);
        return { id, x: cx + x * radius, y: cy - y * radius, z };
      });
      const visibleMarkers = spreadMarkers(locations.filter((point) => point.z > 0.05)).map((point) => {
        const offset = markerOffsets.get(point.id) ?? { x: point.x - point.anchorX, y: point.y - point.anchorY };
        const settle = preference.matches ? 1 : 1 - Math.exp(-elapsed * 9);
        offset.x += (point.x - point.anchorX - offset.x) * settle;
        offset.y += (point.y - point.anchorY - offset.y) * settle;
        markerOffsets.set(point.id, offset);
        return { ...point, x: point.anchorX + offset.x, y: point.anchorY + offset.y };
      });
      const markerPositions = new Map(visibleMarkers.map((point) => [point.id, point]));
      for (const { id, z } of locations) {
        const button = markers.current.get(id);
        if (!button) continue;
        button.style.visibility = z > 0.05 ? "visible" : "hidden";
        button.tabIndex = z > 0.05 ? 0 : -1;
      }
      for (const point of visibleMarkers) {
        const button = markers.current.get(point.id);
        if (!button) continue;
        button.style.transform = `translate(${point.x}px, ${point.y}px) translate(-50%, -50%)`;
        context.strokeStyle = point.id === live.current.selectedId ? "#33383e" : "rgba(109, 116, 125, 0.55)";
        context.lineWidth = 1;
        if (Math.hypot(point.x - point.anchorX, point.y - point.anchorY) > 1) {
          context.beginPath();
          context.moveTo(point.anchorX, point.anchorY);
          context.lineTo(point.x, point.y);
          context.stroke();
        }
        context.beginPath();
        context.arc(point.anchorX, point.anchorY, 3, 0, Math.PI * 2);
        context.fillStyle = "#555e69";
        context.fill();
      }

      const proximity = photoAnchorProgress(view.current.zoom);
      const compact = width < 600;
      const candidates = live.current.photos.flatMap((photo) => {
        const button = cards.current.get(photo.id);
        if (!button) return [];
        const [x, y, z] = project(photoGlobeVector(photo.vector, photo.anchor, proximity));
        const [anchorX, anchorY, anchorZ] = project(photo.anchor);
        const marker = markerPositions.get(photo.building.id);
        const pinX = marker?.x ?? cx + anchorX * radius;
        const pinY = marker?.y ?? cy - anchorY * radius;
        const facing = Math.max(0, Math.min(1, (z + 0.12) / 0.4));
        const phase = photo.phase;
        const clock = preference.matches ? 0 : animationTime;
        const drift = preference.matches ? 0 : 1 - proximity * 0.35;
        const swayX = (Math.sin(clock * 0.37 + phase) * 6 + Math.sin(clock * 0.19 + phase * 2) * 2) * drift;
        const swayY = (Math.cos(clock * 0.43 + phase) * 6 + Math.sin(clock * 0.23 + phase) * 2) * drift;
        const tiltX = Math.sin(clock * 0.31 + phase) * 6 * drift;
        const tiltY = Math.cos(clock * 0.29 + phase) * 8 * drift;
        const roll = Math.sin(phase) * 4 + Math.sin(clock * 0.34 + phase) * 3 * drift;
        const scale = (compact ? 0.4 + proximity * 0.24 : 0.56 + proximity * 0.34) * (0.9 + Math.max(0, Math.min(1, z)) * 0.1);
        const [offsetX, offsetY] = photoClusterOffset(photo.index, photo.count, proximity, compact);
        const photoX = cx + x * radius + (pinX - cx - anchorX * radius) * proximity + offsetX;
        const photoY = cy - y * radius + (pinY - cy + anchorY * radius) * proximity + offsetY;
        // Use a fixed rotation envelope. Floating never feeds back into layout.
        const angle = 7 * Math.PI / 180;
        return [{
          id: photo.id, groupId: photo.building.id, button,
          x: photoX, y: photoY, homeX: photoX, homeY: photoY,
          width: (button.offsetWidth * Math.cos(angle) + button.offsetHeight * Math.sin(angle)) * scale,
          height: (button.offsetHeight * Math.cos(angle) + button.offsetWidth * Math.sin(angle)) * scale,
          orderX: offsetX, orderY: offsetY,
          scale, tiltX, tiltY, roll, swayX, swayY, facing, z, pinX, pinY, anchorZ, weight: facing,
        }];
      });
      const clearance = photoMapClearance(proximity, compact);
      const obstacles = visibleMarkers.map((point) => {
        const size = live.current.selectedId && point.id !== live.current.selectedId ? 34 : clearance;
        return { ...point, width: size, height: size };
      });
      // Overlapping map reserves share space; estimate their combined footprint.
      const onScreenPins = visibleMarkers.filter((p) => p.x > 0 && p.x < width && p.y > 0 && p.y < height);
      const reservedArea = onScreenPins.length ? Math.min(
        onScreenPins.length * clearance * clearance,
        (Math.max(...onScreenPins.map(p => p.x)) - Math.min(...onScreenPins.map(p => p.x)) + clearance)
          * (Math.max(...onScreenPins.map(p => p.y)) - Math.min(...onScreenPins.map(p => p.y)) + clearance),
      ) : 0;
      const density = photoDensityScale(candidates, { width, height }, reservedArea);
      for (const { button, facing } of candidates) {
        button.style.visibility = facing > 0 ? "visible" : "hidden";
        button.tabIndex = facing > 0.25 ? 0 : -1;
        button.style.pointerEvents = facing > 0.25 ? "auto" : "none";
      }
      const targets = candidates.filter((photo) => photo.facing > 0).map((photo) => ({ ...photo, width: photo.width * density, height: photo.height * density }));
      const scopeChanged = targets.length !== previousLayout.length || targets.some((photo, i) => photo.id !== previousLayout[i]?.id);
      const layoutChanged = scopeChanged || width !== layoutWidth || height !== layoutHeight || targets.some((photo, i) => {
        const before = previousLayout[i];
        return Math.abs(photo.x - before.x) > 0.25 || Math.abs(photo.y - before.y) > 0.25 || Math.abs(photo.width - before.width) > 0.25 || Math.abs(photo.height - before.height) > 0.25;
      });
      if (layoutChanged) {
        if (scopeChanged) photoOffsets.clear();
        const layout = relaxPhotoLayout(targets, photoOffsets, { width, height }, preference.matches ? 1 / 30 : elapsed, obstacles);
        for (const photo of layout) photoOffsets.set(photo.id, { x: photo.x - photo.homeX, y: photo.y - photo.homeY });
        previousLayout = targets;
        layoutWidth = width;
        layoutHeight = height;
      }
      for (const photo of targets) {
        const { button, scale, tiltX, tiltY, roll, facing, z, pinX, pinY, anchorZ } = photo;
        const destination = photoOffsets.get(photo.id) ?? { x: 0, y: 0 };
        const offset = displayedOffsets.get(photo.id) ?? { ...destination };
        const ease = preference.matches ? 1 : 1 - Math.exp(-elapsed * 9);
        offset.x += (destination.x - offset.x) * ease;
        offset.y += (destination.y - offset.y) * ease;
        displayedOffsets.set(photo.id, offset);
        const photoX = photo.x + offset.x + photo.swayX;
        const photoY = photo.y + offset.y + photo.swayY;
        button.style.opacity = `${facing * Math.max(0.3, Math.min(1, 0.65 + z * 0.35))}`;
        button.style.transform = `translate3d(${photoX}px, ${photoY}px, 0) translate(-50%, -50%) perspective(800px) scale(${scale * density}) rotateX(${tiltX}deg) rotateY(${tiltY}deg) rotateZ(${roll}deg)`;
        button.style.zIndex = `${Math.round(z * 10) + 12}`;
        if (anchorZ > 0.05 && proximity > 0.1) {
          context.beginPath();
          context.moveTo(pinX, pinY);
          context.lineTo(photoX, photoY);
          context.strokeStyle = `rgba(109, 116, 125, ${proximity * 0.24})`;
          context.lineWidth = 0.8;
          context.stroke();
        }
      }
      if ((!preference.matches && (live.current.rotating || live.current.photos.length > 0)) || target.current || drag.current) frame = requestAnimationFrame(draw);
    };
    function start() {
      if (!disposed && !frame && visible && !document.hidden) frame = requestAnimationFrame(draw);
    }
    document.addEventListener("visibilitychange", start);
    preference.addEventListener("change", start);
    requestDraw.current = start;
    start();
    return () => {
      disposed = true;
      controller.abort();
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      document.removeEventListener("visibilitychange", start);
      preference.removeEventListener("change", start);
      requestDraw.current = () => {};
    };
  }, [buildings, attempt]);

  const zoom = (factor: number) => {
    onInteract();
    const destination = target.current ?? view.current;
    target.current = { ...destination, zoom: clampGlobeZoom(destination.zoom * factor) };
    requestDraw.current();
  };

  const endPointer = (pointerId: number) => {
    if (!pointers.current.delete(pointerId)) return;
    pinchDistance.current = null;
    const remaining = Array.from(pointers.current.entries())[0];
    drag.current = remaining ? { pointerId: remaining[0], ...remaining[1] } : null;
    setDragging(!!remaining);
  };

  return (
    <div className={styles.globePanel}>
      <div
        ref={host}
        className={`${styles.globeStage} ${dragging ? styles.dragging : ""}`}
        role="group"
        aria-label="建築の地点と写真を表示する地球儀"
        aria-describedby="ando-globe-instructions"
        tabIndex={0}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail > 0) { event.preventDefault(); event.stopPropagation(); }
        }}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget) return;
          const delta: Record<string, [number, number]> = { ArrowLeft: [0, -10], ArrowRight: [0, 10], ArrowUp: [8, 0], ArrowDown: [-8, 0] };
          if (delta[event.key]) {
            event.preventDefault();
            onInteract();
            const [lat, lon] = delta[event.key];
            target.current = null;
            view.current.latitude = Math.max(-75, Math.min(75, view.current.latitude + lat / view.current.zoom));
            view.current.longitude = wrapLongitude(view.current.longitude + lon / view.current.zoom);
            requestDraw.current();
          }
          if (event.key === "+" || event.key === "=") { event.preventDefault(); zoom(1.25); }
          if (event.key === "-") { event.preventDefault(); zoom(1 / 1.25); }
        }}
        onPointerDown={(event) => {
          if (!pointers.current.size) suppressClick.current = false;
          const onButton = event.target instanceof Element && !!event.target.closest("button");
          if (onButton && event.pointerType !== "touch") return;
          if (event.pointerType === "mouse" && event.button !== 0) return;
          // Let a single touch keep its button as the tap target; pinch events still bubble here.
          if (!onButton) event.currentTarget.setPointerCapture(event.pointerId);
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 2) {
            const [a, b] = Array.from(pointers.current.values());
            pinchDistance.current = Math.hypot(a.x - b.x, a.y - b.y);
            suppressClick.current = true;
          }
          drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
          target.current = null;
          setDragging(!onButton || pointers.current.size > 1);
          onInteract();
          requestDraw.current();
        }}
        onPointerMove={(event) => {
          if (!pointers.current.has(event.pointerId)) return;
          pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
          if (pointers.current.size === 2) {
            suppressClick.current = true;
            setDragging(true);
            const [a, b] = Array.from(pointers.current.values());
            const distance = Math.hypot(a.x - b.x, a.y - b.y);
            if (pinchDistance.current !== null) view.current.zoom = clampGlobeZoom(view.current.zoom * distance / Math.max(pinchDistance.current, 1));
            pinchDistance.current = distance;
          } else if (drag.current?.pointerId === event.pointerId) {
            if (!suppressClick.current && Math.hypot(event.clientX - drag.current.x, event.clientY - drag.current.y) < 3) return;
            suppressClick.current = true;
            setDragging(true);
            view.current.longitude = wrapLongitude(view.current.longitude - (event.clientX - drag.current.x) * 0.3 / view.current.zoom);
            view.current.latitude = Math.max(-75, Math.min(75, view.current.latitude + (event.clientY - drag.current.y) * 0.3 / view.current.zoom));
          }
          drag.current = { pointerId: event.pointerId, x: event.clientX, y: event.clientY };
          requestDraw.current();
        }}
        onLostPointerCapture={(event) => {
          endPointer(event.pointerId);
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          endPointer(event.pointerId);
        }}
        onPointerCancel={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          endPointer(event.pointerId);
        }}
      >
        <canvas ref={canvas} className={styles.globeCanvas} aria-hidden="true" />
        {photos.map((photo) => (
          <button key={photo.id} ref={(element) => { if (element) cards.current.set(photo.id, element); else cards.current.delete(photo.id); }} className={styles.orbitPhoto} data-photo-id={photo.id} data-building-id={photo.building.id} onClick={(event) => onInspect(photo.id, event.currentTarget)} aria-label={`${photo.building.name}の写真を拡大`}>
            {/* Native images retain encoded filenames and the static export base path. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetPath(photo.src)} alt="" draggable={false} decoding="async" />
            <span>{photo.building.nameEn || photo.building.name}</span>
          </button>
        ))}
        {buildings.map((building, index) => (
          <button key={building.id} ref={(element) => { if (element) markers.current.set(building.id, element); else markers.current.delete(building.id); }} className={styles.mapPoint} data-building-id={building.id} data-selected={selectedId === building.id} onClick={() => onSelect(building.id)} aria-label={`${building.name}、${building.location}の写真を表示`} aria-pressed={selectedId === building.id}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.pointTooltip}>{building.name}</span>
          </button>
        ))}
        {(!ready || error) && <div className={styles.mapStatus} role="status">{error ? <button onClick={() => setAttempt((value) => value + 1)}>地図を読み込めませんでした。再試行</button> : "世界地図を読み込み中…"}</div>}
      </div>
      <div className={styles.globeBottomline}>
        <p className={styles.globeInstructions} id="ando-globe-instructions">ドラッグで回転 · 地点で絞り込み<br />ホイール・ピンチで拡大<span className={styles.keyboardInstructions}>。矢印キーでも回転、プラス・マイナスキーでも拡大縮小できます。</span></p>
        <div className={styles.globeTools}>
          <button onClick={onToggleRotation} aria-label={rotating ? "自動回転を停止" : "自動回転を開始"} aria-pressed={rotating} disabled={reducedMotion} title={reducedMotion ? "動きを減らす設定が有効です" : rotating ? "自動回転を停止" : "自動回転を開始"}>{rotating ? <Pause size={13} /> : <Play size={13} />}</button>
          <button onClick={() => zoom(1 / 1.25)} aria-label="地球儀を縮小"><Minus size={15} /></button>
          <button onClick={() => zoom(1.25)} aria-label="地球儀を拡大"><Plus size={15} /></button>
          <button onClick={() => { onInteract(); target.current = { ...initialView }; requestDraw.current(); }} aria-label="地球儀の向きをリセット"><RotateCcw size={14} /></button>
        </div>
      </div>
    </div>
  );
}
