import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { LocateFixed, Minus, Plus } from "lucide-react";
import { referenceMapMask } from "../../data/locationContent";
import type { LocationContent, MapPosition, MapView, PointOfInterest } from "../../types/project";

export const bound = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

interface Props {
  map: LocationContent["map"];
  points: PointOfInterest[];
  selectedId?: string;
  onSelect: (id: string) => void;
  mode?: "navigate" | "place" | "project";
  onPlace?: (id: string, position: MapPosition) => void;
  onProjectPlace?: (position: MapPosition) => void;
  onViewChange?: (view: MapView) => void;
}

export function NeighborhoodMap({ map, points, selectedId, onSelect, mode = "navigate", onPlace, onProjectPlace, onViewChange }: Props) {
  const frame = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [natural, setNatural] = useState({ width: 1, height: 1 });
  const [view, setView] = useState(map.initialView);
  const camera = useRef(view);
  const pointers = useRef(new Map<number, MapPosition>());
  const gesture = useRef<{ view: MapView; center: MapPosition; distance: number; moved: boolean }>();
  const draggedMarker = useRef<string>();
  const [dragged, setDragged] = useState<{ id: string; position: MapPosition }>();
  const lastTap = useRef<{ time: number; point: MapPosition }>();
  const callbacks = useRef({ onPlace, onProjectPlace, onViewChange });
  callbacks.current = { onPlace, onProjectPlace, onViewChange };

  const crop = map.crop ?? { x: 0, y: 0, width: 1, height: 1 };
  const imageWidth = natural.width * crop.width;
  const imageHeight = natural.height * crop.height;
  const fit = Math.min(size.width / imageWidth, size.height / imageHeight);
  const base = { width: imageWidth * fit, height: imageHeight * fit };
  const geometry = useRef({ size, base });
  geometry.current = { size, base };

  function updateView(next: MapView) {
    const safe = { x: bound(next.x), y: bound(next.y), zoom: bound(next.zoom, 1, 5) };
    camera.current = safe;
    setView(safe);
    callbacks.current.onViewChange?.(safe);
  }

  useEffect(() => {
    updateView(map.initialView);
    // Reset on a newly configured camera or image, while keeping user gestures local.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map.imageSrc, map.initialView.x, map.initialView.y, map.initialView.zoom]);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const element = frame.current;
    if (!element || mode !== "navigate") return;
    const wheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = element.getBoundingClientRect();
      zoomAt({ x: event.clientX - rect.left, y: event.clientY - rect.top }, Math.exp(-event.deltaY * .002));
    };
    element.addEventListener("wheel", wheel, { passive: false });
    return () => element.removeEventListener("wheel", wheel);
  }, [mode]);

  function zoomAt(point: MapPosition, factor: number) {
    const { size, base } = geometry.current;
    const old = camera.current;
    const zoom = bound(old.zoom * factor, 1, 5);
    updateView({
      zoom,
      x: old.x + (point.x - size.width / 2) / base.width * 100 * (1 / old.zoom - 1 / zoom),
      y: old.y + (point.y - size.height / 2) / base.height * 100 * (1 / old.zoom - 1 / zoom)
    });
  }

  function eventPoint(event: ReactPointerEvent): MapPosition {
    const rect = frame.current!.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  function toImage(point: MapPosition): MapPosition {
    const { size, base } = geometry.current;
    const view = camera.current;
    return {
      x: bound(view.x + (point.x - size.width / 2) / (base.width * view.zoom) * 100),
      y: bound(view.y + (point.y - size.height / 2) / (base.height * view.zoom) * 100)
    };
  }

  function startGesture() {
    const values = [...pointers.current.values()];
    const first = values[0];
    if (!first) { gesture.current = undefined; return; }
    const second = values[1];
    gesture.current = {
      view: camera.current,
      center: second ? { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 } : first,
      distance: second ? Math.hypot(first.x - second.x, first.y - second.y) : 0,
      moved: false
    };
  }

  function pointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, eventPoint(event));
    if (pointers.current.size > 1) lastTap.current = undefined;
    startGesture();
  }

  function pointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    const point = eventPoint(event);
    pointers.current.set(event.pointerId, point);
    const previous = gesture.current;
    if (!previous) return;
    if (Math.hypot(point.x - previous.center.x, point.y - previous.center.y) > 4) previous.moved = true;
    if (mode !== "navigate") {
      if (draggedMarker.current) setDragged({ id: draggedMarker.current, position: toImage(point) });
      return;
    }
    const values = [...pointers.current.values()];
    const first = values[0];
    const second = values[1];
    const center = second ? { x: (first.x + second.x) / 2, y: (first.y + second.y) / 2 } : first;
    const zoom = second && previous.distance
      ? bound(previous.view.zoom * Math.hypot(first.x - second.x, first.y - second.y) / previous.distance, 1, 5)
      : previous.view.zoom;
    updateView({
      zoom,
      x: previous.view.x + (previous.center.x - size.width / 2) / (base.width * previous.view.zoom) * 100 - (center.x - size.width / 2) / (base.width * zoom) * 100,
      y: previous.view.y + (previous.center.y - size.height / 2) / (base.height * previous.view.zoom) * 100 - (center.y - size.height / 2) / (base.height * zoom) * 100
    });
  }

  function pointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!pointers.current.has(event.pointerId)) return;
    const point = eventPoint(event);
    const moved = gesture.current?.moved;
    if (mode === "project" && !moved) callbacks.current.onProjectPlace?.(toImage(point));
    if (mode === "place" && ((draggedMarker.current && moved) || (!draggedMarker.current && !moved && selectedId))) {
      callbacks.current.onPlace?.(draggedMarker.current ?? selectedId!, toImage(point));
    }
    if (mode === "navigate" && !moved && pointers.current.size === 1) {
      const previous = lastTap.current;
      if (previous && Date.now() - previous.time < 320 && Math.hypot(point.x - previous.point.x, point.y - previous.point.y) < 30) {
        zoomAt(point, 1.5);
        lastTap.current = undefined;
      } else {
        lastTap.current = { time: Date.now(), point };
      }
    }
    pointers.current.delete(event.pointerId);
    draggedMarker.current = undefined;
    setDragged(undefined);
    startGesture();
  }

  function cancelPointer(event: ReactPointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
    draggedMarker.current = undefined;
    setDragged(undefined);
    startGesture();
  }

  function screenPosition(point: MapPosition) {
    return { left: size.width / 2 + (point.x - view.x) / 100 * base.width * view.zoom, top: size.height / 2 + (point.y - view.y) / 100 * base.height * view.zoom };
  }

  return (
    <div className="neighborhood-map-shell">
      <div
        className="neighborhood-map-canvas"
        data-mode={mode}
        ref={frame}
        tabIndex={0}
        role="region"
        aria-label={mode === "navigate" ? "Mapa interactivo del barrio" : "Edición de posiciones en el mapa"}
        onPointerDown={pointerDown}
        onPointerMove={pointerMove}
        onPointerUp={pointerUp}
        onPointerCancel={cancelPointer}
        onKeyDown={(event) => {
          if (event.target !== event.currentTarget || mode !== "navigate") return;
          const step = 7 / camera.current.zoom;
          const keys: Record<string, Partial<MapView>> = {
            ArrowLeft: { x: camera.current.x - step }, ArrowRight: { x: camera.current.x + step },
            ArrowUp: { y: camera.current.y - step }, ArrowDown: { y: camera.current.y + step }
          };
          if (keys[event.key]) {
            event.preventDefault();
            updateView({ ...camera.current, ...keys[event.key] });
          }
          if (event.key === "+" || event.key === "=") zoomAt({ x: size.width / 2, y: size.height / 2 }, 1.25);
          if (event.key === "-") zoomAt({ x: size.width / 2, y: size.height / 2 }, .8);
          if (event.key === "Home") updateView(map.initialView);
        }}
      >
        <div className="neighborhood-map-image" data-reference={Boolean(map.crop)} style={{
          width: base.width, height: base.height,
          left: size.width / 2 - view.x / 100 * base.width * view.zoom,
          top: size.height / 2 - view.y / 100 * base.height * view.zoom,
          transform: `scale(${view.zoom})`,
          maskImage: map.crop ? referenceMapMask : undefined,
          maskSize: "100% 100%",
          WebkitMaskImage: map.crop ? referenceMapMask : undefined,
          WebkitMaskSize: "100% 100%"
        }}>
          <img src={map.imageSrc} alt="Mapa del barrio de Bustamante 175" draggable={false} onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth, height: event.currentTarget.naturalHeight })}
            style={{ width: `${100 / crop.width}%`, height: `${100 / crop.height}%`, left: `${-crop.x / crop.width * 100}%`, top: `${-crop.y / crop.height * 100}%` }} />
        </div>
        {points.map((point) => {
          const position = dragged?.id === point.id ? dragged.position : point;
          return <button key={point.id} type="button" className="neighborhood-pin" data-selected={selectedId === point.id}
            aria-label={`Seleccionar ${point.name}`} aria-pressed={selectedId === point.id}
            style={screenPosition(position)}
            onPointerDown={(event) => {
              if (mode === "navigate") event.stopPropagation();
              else if (mode === "place") { draggedMarker.current = point.id; onSelect(point.id); }
            }}
            onClick={(event) => { event.stopPropagation(); if (mode !== "project") onSelect(point.id); }}
          ><span>{point.order}</span></button>;
        })}
        {map.projectPosition && <div className="neighborhood-project-pin" style={screenPosition(map.projectPosition)} aria-label="Bustamante 175">
          <span>BUSTAMANTE <strong>175</strong></span>
        </div>}
      </div>
      <div className="neighborhood-map-controls" aria-label="Controles del mapa">
        <button type="button" aria-label="Ampliar mapa" onClick={() => zoomAt({ x: size.width / 2, y: size.height / 2 }, 1.3)}><Plus size={21} /></button>
        <button type="button" aria-label="Reducir mapa" onClick={() => zoomAt({ x: size.width / 2, y: size.height / 2 }, 1 / 1.3)}><Minus size={21} /></button>
        <button type="button" aria-label="Restablecer vista del mapa" onClick={() => updateView(map.initialView)}><LocateFixed size={21} /></button>
      </div>
    </div>
  );
}
