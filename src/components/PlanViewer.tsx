import { Minus, Plus, RotateCcw } from "lucide-react";
import { useState } from "react";

export function PlanViewer({ src, title }: { src: string; title: string }) {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState<{ x: number; y: number } | null>(null);

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden rounded border border-ink/10 bg-white">
      <div className="absolute right-3 top-3 z-10 flex gap-2 rounded-full bg-paper/90 p-2">
        <button className="icon-button" onClick={() => setZoom((value) => Math.min(value + 0.2, 3))} type="button" aria-label="Acercar">
          <Plus />
        </button>
        <button className="icon-button" onClick={() => setZoom((value) => Math.max(value - 0.2, 0.6))} type="button" aria-label="Alejar">
          <Minus />
        </button>
        <button className="icon-button" onClick={() => { setZoom(1); setOffset({ x: 0, y: 0 }); }} type="button" aria-label="Restablecer zoom">
          <RotateCcw />
        </button>
      </div>
      <div
        className="h-full min-h-[420px] cursor-grab touch-none"
        onPointerDown={(event) => setDrag({ x: event.clientX - offset.x, y: event.clientY - offset.y })}
        onPointerMove={(event) => {
          if (drag) setOffset({ x: event.clientX - drag.x, y: event.clientY - drag.y });
        }}
        onPointerUp={() => setDrag(null)}
        onPointerLeave={() => setDrag(null)}
      >
        <img
          className="h-full w-full object-contain transition-transform duration-150"
          src={src}
          alt={title}
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})` }}
          draggable={false}
        />
      </div>
    </div>
  );
}
