import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import type { FloorPlan, Hotspot, Typology } from "../types/project";

interface Props {
  floorPlan: FloorPlan;
  typologies: Typology[];
  selectedId?: string;
  editable?: boolean;
  onSelect: (typologyId: string) => void;
  onHotspotAdd?: (hotspot: Hotspot) => void;
  onHotspotDelete?: (id: string) => void;
  onHotspotChange?: (hotspot: Hotspot) => void;
}

export function FloorPlanInteractive({ floorPlan, typologies, selectedId, editable, onSelect, onHotspotChange, onHotspotAdd, onHotspotDelete }: Props) {
  const byId = new Map(typologies.map((typology) => [typology.id, typology]));
  const [imageRatio, setImageRatio] = useState<number | null>(null);

  const targetId = byId.has(selectedId ?? "") ? selectedId! : typologies[0]?.id ?? "";

  function addZone() {
    if (!targetId) return;
    onHotspotAdd?.({ id: crypto.randomUUID(), typologyId: targetId, x: 40, y: 40, width: 15, height: 15 });
    onSelect(targetId);
  }

  function update(hotspot: Hotspot, patch: Partial<Hotspot>) {
    const width = clamp(patch.width ?? hotspot.width, 1, 100);
    const height = clamp(patch.height ?? hotspot.height, 1, 100);
    onHotspotChange?.({
      ...hotspot,
      ...patch,
      x: clamp(patch.x ?? hotspot.x, 0, 100 - width),
      y: clamp(patch.y ?? hotspot.y, 0, 100 - height),
      width,
      height
    });
  }

  return (
    <div className="overflow-hidden rounded border border-ink/10 bg-white">
      {editable && (
        <div className="space-y-3 border-b border-ink/10 bg-paper p-4">
          <div className="flex flex-wrap items-end gap-3">
            <label className="min-w-48 flex-1">Tipología para la nueva zona
              <select className="field" value={targetId} onChange={(event) => onSelect(event.target.value)} disabled={!typologies.length}>
                {typologies.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
              </select>
            </label>
            <button className="primary-touch disabled:opacity-50" type="button" disabled={!targetId || !onHotspotAdd} onClick={addZone}>
              <Plus className="size-4" /> Agregar zona clicable
            </button>
          </div>
          <p className="text-sm text-ink/70">Elige una tipología y agrega una zona. Ajusta su posición y tamaño con los controles debajo del plano. Los cambios se guardan automáticamente en este navegador.</p>
          {!typologies.length && <p role="status">Primero agrega una tipología.</p>}
          {!floorPlan.hotspots.length && <p role="status">Todavía no hay zonas clicables.</p>}
        </div>
      )}
      <div className="relative mx-auto w-full" style={imageRatio ? { aspectRatio: `${imageRatio}` } : undefined}>
        <img
          className="absolute inset-0 h-full w-full select-none object-contain"
          src={floorPlan.imageSrc}
          alt={floorPlan.title}
          draggable={false}
          onLoad={(event) => {
            const image = event.currentTarget;
            if (image.naturalWidth && image.naturalHeight) setImageRatio(image.naturalWidth / image.naturalHeight);
          }}
        />
        {floorPlan.hotspots.map((hotspot) => {
          const typology = byId.get(hotspot.typologyId);
          const active = selectedId === hotspot.typologyId;
          if (!typology) return null;
          return (
            <button
              key={hotspot.id}
              className={
                editable
                  ? `absolute border-2 text-xs font-bold transition ${
                      active ? "border-morada bg-morada/25 text-ink ring-4 ring-morada/20" : "border-morada/50 bg-morada/10 text-morada hover:bg-morada/15"
                    }`
                  : `absolute border-0 bg-transparent text-transparent outline-none transition ${
                      active ? "ring-4 ring-morada/80 ring-offset-2 ring-offset-transparent" : ""
                    }`
              }
              style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: `${hotspot.width}%`, height: `${hotspot.height}%` }}
              onClick={() => onSelect(hotspot.typologyId)}
              type="button"
              aria-label={`Seleccionar tipología ${typology.code}`}
            >
              {editable ? typology.code : null}

            </button>
          );
        })}
      </div>
      {editable ? (
        <div className="grid gap-3 border-t border-ink/10 bg-paper p-4 md:grid-cols-2 xl:grid-cols-4">
          {floorPlan.hotspots.map((hotspot) => {
            const typology = byId.get(hotspot.typologyId);
            return (
              <div key={hotspot.id} className="rounded border border-ink/10 bg-white p-3">
                <label className="mb-3 block text-sm">Tipología de la zona
                  <select className="field" value={hotspot.typologyId} onChange={(event) => { update(hotspot, { typologyId: event.target.value }); onSelect(event.target.value); }}>
                    {!typology && <option value={hotspot.typologyId}>Selecciona una tipología</option>}
                    {typologies.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
                  </select>
                </label>
                {(["x", "y", "width", "height"] as const).map((field) => (
                  <label className="mb-2 grid grid-cols-[70px_1fr_42px] items-center gap-2 text-xs" key={field}>
                    <span>{{ x: "Horizontal", y: "Vertical", width: "Ancho", height: "Alto" }[field]}</span>
                    <input type="range" min={field === "width" || field === "height" ? 1 : 0} max={field === "x" ? 100 - hotspot.width : field === "y" ? 100 - hotspot.height : 100} value={hotspot[field]} onChange={(event) => update(hotspot, { [field]: Number(event.target.value) })} />
                    <span>{Math.round(hotspot[field])}%</span>
                  </label>
                ))}
                <button className="secondary-touch mt-2 w-full" type="button" onClick={() => onHotspotDelete?.(hotspot.id)} disabled={!onHotspotDelete} aria-label={`Eliminar zona ${typology?.code ?? "sin asignar"}`}>
                  <Trash2 className="size-4" /> Eliminar zona
                </button>
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}
