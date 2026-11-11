import { Minus, Plus, RotateCcw } from "lucide-react";
import { useRef, useState, type PointerEvent } from "react";

type Point = { x: number; y: number };
const initialView = { zoom: 1, x: 0, y: 0 };
const clampZoom = (zoom: number) => Math.max(0.6, Math.min(zoom, 3));
const midpoint = (a: Point, b: Point) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

export function PlanViewer({ src, title, fitViewport = false }: { src: string; title: string; fitViewport?: boolean }) {
  const [view, setView] = useState(initialView);
  const pointers = useRef(new Map<number, Point>());
  const height = fitViewport ? "min-h-0" : "min-h-[420px]";

  function startPointer(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0 || pointers.current.size >= 2) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
  }

  function movePointer(event: PointerEvent<HTMLDivElement>) {
    const previous = pointers.current.get(event.pointerId);
    if (!previous) return;
    const next = { x: event.clientX, y: event.clientY };
    pointers.current.set(event.pointerId, next);
    const other = [...pointers.current.entries()].find(([id]) => id !== event.pointerId)?.[1];

    if (!other) {
      setView((current) => ({ ...current, x: current.x + next.x - previous.x, y: current.y + next.y - previous.y }));
      return;
    }

    const before = midpoint(previous, other);
    const after = midpoint(next, other);
    const ratio = distance(next, other) / Math.max(distance(previous, other), 1);
    const rect = event.currentTarget.getBoundingClientRect();
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };

    setView((current) => {
      const zoom = clampZoom(current.zoom * ratio);
      const scale = zoom / current.zoom;
      return {
        zoom,
        x: after.x - center.x - (before.x - center.x - current.x) * scale,
        y: after.y - center.y - (before.y - center.y - current.y) * scale
      };
    });
  }

  function endPointer(event: PointerEvent<HTMLDivElement>) {
    pointers.current.delete(event.pointerId);
  }

  function changeZoom(delta: number) {
    setView((current) => ({ ...current, zoom: clampZoom(current.zoom + delta) }));
  }

  return (
    <div className={`relative h-full ${height} overflow-hidden rounded border border-ink/10 bg-white`}>
      <div className="absolute right-3 top-3 z-10 flex gap-2 rounded-full bg-paper/90 p-2">
        <button className="icon-button" onClick={() => changeZoom(0.2)} type="button" aria-label="Acercar">
          <Plus />
        </button>
        <button className="icon-button" onClick={() => changeZoom(-0.2)} type="button" aria-label="Alejar">
          <Minus />
        </button>
        <button className="icon-button" onClick={() => setView(initialView)} type="button" aria-label="Restablecer zoom">
          <RotateCcw />
        </button>
      </div>
      <div
        className={`h-full ${height} cursor-grab touch-none select-none`}
        onPointerDown={startPointer}
        onPointerMove={movePointer}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onLostPointerCapture={endPointer}
      >
        <img
          className="h-full w-full object-contain"
          src={src}
          alt={title}
          style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.zoom})` }}
          draggable={false}
        />
      </div>
    </div>
  );
}
