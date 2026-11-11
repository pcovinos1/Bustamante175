import { useState, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Eye, MapPin, Plus, Trash2, Upload } from "lucide-react";
import type { LocationContent, LocationPhoto, MapView, PointOfInterest, Project } from "../../types/project";
import { fileToDataUrl } from "../../services/files";
import { migrateLocation } from "../../data/locationContent";
import { NeighborhoodMap } from "./NeighborhoodMap";

type EditProject = (updater: (project: Project) => Project) => Promise<void>;
type Screen = "story" | "map";
type TextFields = { eyebrow: string; title: string; description: string };

const imageTypes = ["image/png", "image/jpeg", "image/webp", "image/svg+xml"];
const mapTypes = ["image/svg+xml", "image/png", "image/webp"];
const categories: PointOfInterest["category"][] = ["Gastronomía", "Arte y cultura", "Tiendas", "Markets", "Espacios abiertos", "Otros", "Parques", "Educación", "Entretenimiento"];

function UploadImage({ label, onFiles, multiple, types = imageTypes }: {
  label: ReactNode; onFiles: (files: File[]) => void; multiple?: boolean; types?: string[];
}) {
  return <label className="secondary-touch admin-file-action">
    <Upload size={16} /> {label}
    <input type="file" accept={types.join(",")} multiple={multiple} onChange={(event) => {
      const files = Array.from(event.currentTarget.files ?? []);
      event.currentTarget.value = "";
      if (files.length) onFiles(files);
    }} />
  </label>;
}

function EditorialFields({ value, onChange }: { value: TextFields; onChange: (patch: Partial<TextFields>) => void }) {
  return <div className="admin-neighborhood-copy">
    <label>Encabezado<input className="field" value={value.eyebrow} onChange={(event) => onChange({ eyebrow: event.target.value })} /></label>
    <label>Título<input className="field" value={value.title} onChange={(event) => onChange({ title: event.target.value })} /></label>
    <label>Descripción<textarea className="field" rows={2} value={value.description} onChange={(event) => onChange({ description: event.target.value })} /></label>
  </div>;
}

export function AdminLocation({ project, updateProject, onPreview }: { project: Project; updateProject: EditProject; onPreview: (screen: Screen) => void }) {
  const [screen, setScreen] = useState<Screen>("story");
  const location = migrateLocation(project).location!;
  function updateLocation(updater: (current: LocationContent) => LocationContent) {
    return updateProject((current) => ({ ...current, location: updater(migrateLocation(current).location!) }));
  }

  return (
    <>
      <div className="admin-neighborhood-tabs">
        <div><p className="eyebrow">El barrio</p>
          <nav aria-label="Edición del barrio">
            <button type="button" aria-pressed={screen === "story"} onClick={() => setScreen("story")}>Storytelling</button>
            <button type="button" aria-pressed={screen === "map"} onClick={() => setScreen("map")}>Mapa y cercanías</button>
          </nav>
        </div>
        <button className="secondary-touch" type="button" onClick={() => onPreview(screen)}><Eye size={17} /> Vista previa de la pantalla</button>
      </div>
      {screen === "story"
        ? <StoryEditor story={location.storytelling} update={(updater) => updateLocation((current) => ({ ...current, storytelling: updater(current.storytelling) }))} />
        : <MapEditor project={project} location={location} updateProject={updateProject} />}
    </>
  );
}

function StoryEditor({ story, update }: {
  story: LocationContent["storytelling"];
  update: (updater: (story: LocationContent["storytelling"]) => LocationContent["storytelling"]) => Promise<void>;
}) {
  const [selectedId, setSelectedId] = useState(story.mainImageId);
  const [message, setMessage] = useState("");
  const selected = story.images.find((item) => item.id === selectedId) ?? story.images[0];
  const index = story.images.findIndex((item) => item.id === selected?.id);

  function changePhoto(id: string, patch: Partial<LocationPhoto>) {
    void update((current) => ({
      ...current,
      images: current.images.map((item) => item.id === id ? { ...item, ...patch } : item)
    }));
  }

  function movePhoto(direction: number) {
    if (!selected) return;
    void update((current) => {
      const images = [...current.images];
      const from = images.findIndex((item) => item.id === selected.id);
      const to = from + direction;
      if (from < 0 || to < 0 || to >= images.length) return current;
      const [image] = images.splice(from, 1);
      images.splice(to, 0, image);
      return { ...current, images };
    });
  }

  async function upload(files: File[], replaceId?: string) {
    if (files.some((file) => !imageTypes.includes(file.type))) {
      setMessage("Selecciona imágenes PNG, JPG, WebP o SVG.");
      return;
    }
    try {
      const added = await Promise.all(files.map(async (file): Promise<LocationPhoto> => ({
        id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, ""), description: "",
        src: await fileToDataUrl(file), active: true
      })));
      if (replaceId) {
        changePhoto(replaceId, { src: added[0].src, credit: undefined, sourceUrl: undefined, licenseUrl: undefined });
      } else {
        await update((current) => ({ ...current, images: [...current.images, ...added] }));
        setSelectedId(added[0].id);
      }
      setMessage("");
    } catch {
      setMessage("No se pudo leer la imagen.");
    }
  }

  return (
    <section className="admin-card">
      <h2>Texto de portada</h2>
      <EditorialFields value={story} onChange={(patch) => void update((current) => ({ ...current, ...patch }))} />
      <div className="admin-card-heading mt-5">
        <h2>Fotografías</h2>
        <UploadImage label="Agregar fotografías" multiple onFiles={(files) => void upload(files)} />
      </div>
      {message && <p role="alert" className="text-sm text-red-700">{message}</p>}
      <div className="admin-neighborhood-thumbs" aria-label="Fotografías de Storytelling">
        {story.images.map((image) => <button key={image.id} type="button" aria-pressed={selected?.id === image.id} onClick={() => setSelectedId(image.id)}>
          <img src={image.src} alt="" /><span>{image.title || "Sin título"}{story.mainImageId === image.id ? " · Principal" : ""}{!image.active ? " · Oculta" : ""}</span>
        </button>)}
      </div>
      {selected && <div className="admin-neighborhood-inspector" key={selected.id}>
        <div className="admin-neighborhood-copy">
          <label>Título de la imagen<input className="field" value={selected.title} onChange={(event) => changePhoto(selected.id, { title: event.target.value })} /></label>
          <label>Descripción de la imagen<input className="field" value={selected.description} onChange={(event) => changePhoto(selected.id, { description: event.target.value })} /></label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={selected.active} onChange={(event) => changePhoto(selected.id, { active: event.target.checked })} /> Mostrar fotografía</label>
        </div>
        <div className="admin-actions mt-3">
          <UploadImage label="Reemplazar fotografía" onFiles={(files) => void upload(files, selected.id)} />
          <button className="secondary-touch" type="button" disabled={story.mainImageId === selected.id && selected.active} onClick={() => void update((current) => ({
            ...current, mainImageId: selected.id,
            images: current.images.map((item) => item.id === selected.id ? { ...item, active: true } : item)
          }))}>Usar como principal</button>
          <button className="secondary-touch" type="button" disabled={index <= 0} onClick={() => movePhoto(-1)}><ArrowUp size={16} /> Anterior</button>
          <button className="secondary-touch" type="button" disabled={index >= story.images.length - 1} onClick={() => movePhoto(1)}><ArrowDown size={16} /> Siguiente</button>
          <button className="secondary-touch" type="button" onClick={() => {
            if (!confirm("¿Eliminar esta fotografía?")) return;
            void update((current) => ({
              ...current, mainImageId: current.mainImageId === selected.id ? undefined : current.mainImageId,
              images: current.images.filter((item) => item.id !== selected.id)
            }));
          }}><Trash2 size={16} /> Eliminar</button>
        </div>
      </div>}
    </section>
  );
}

function MapEditor({ project, location, updateProject }: {
  project: Project; location: LocationContent; updateProject: EditProject;
}) {
  const { map } = location;
  const [selectedId, setSelectedId] = useState(project.pointsOfInterest[0]?.id ?? "");
  const [mode, setMode] = useState<"navigate" | "place" | "project">("navigate");
  const [view, setView] = useState<MapView>(map.initialView);
  const [message, setMessage] = useState("");
  const points = [...project.pointsOfInterest].sort((a, b) => a.order - b.order);
  const selected = points.find((point) => point.id === selectedId);
  const legacyMap = project.galleries.find((gallery) => gallery.id === "barrio");
  const legacyText = project.sections.find((section) => section.id === "location");

  function changeMap(patch: Partial<LocationContent["map"]>) {
    void updateProject((current) => ({ ...current, location: { ...current.location!, map: { ...current.location!.map, ...patch } } }));
  }

  function changePoint(id: string, patch: Partial<PointOfInterest>) {
    void updateProject((current) => ({ ...current, pointsOfInterest: current.pointsOfInterest.map((point) => point.id === id ? { ...point, ...patch } : point) }));
  }

  function addPoint() {
    const id = crypto.randomUUID();
    setSelectedId(id);
    setMode("place");
    void updateProject((current) => ({
      ...current,
      pointsOfInterest: [...current.pointsOfInterest, {
        id, name: "Nuevo lugar", category: "Otros", x: 0, y: 0, positioned: false, visible: false,
        order: Math.max(0, ...current.pointsOfInterest.map((point) => point.order)) + 1
      }]
    }));
  }

  async function replaceImage(file: File, id?: string) {
    if (!(id ? imageTypes : mapTypes).includes(file.type)) {
      setMessage(id ? "Selecciona una foto PNG, JPG, WebP o SVG." : "Selecciona un mapa SVG, PNG o WebP.");
      return;
    }
    try {
      const src = await fileToDataUrl(file);
      if (id) changePoint(id, { photoSrc: src, photoCredit: undefined });
      else {
        await updateProject((current) => ({
          ...current,
          location: { ...current.location!, map: { ...current.location!.map, imageSrc: src, crop: undefined, projectPosition: undefined, initialView: { x: 50, y: 50, zoom: 1 } } },
          pointsOfInterest: current.pointsOfInterest.map((point) => ({ ...point, visible: false, positioned: false, walkingVerified: false }))
        }));
        setMode("project");
      }
      setMessage(id ? "" : "Mapa reemplazado. Posiciona el proyecto y vuelve a ubicar y activar los lugares.");
    } catch {
      setMessage("No se pudo leer la imagen.");
    }
  }

  return (
    <section className="admin-card">
      <details className="admin-neighborhood-settings">
        <summary>Texto y encuadre inicial</summary>
        <EditorialFields value={map} onChange={changeMap} />
        <label className="block mt-3">Dirección del proyecto<input className="field" value={project.address} onChange={(event) => {
          const address = event.target.value;
          void updateProject((current) => ({ ...current, address }));
        }} /></label>
        <div className="admin-actions mt-3">
          <button className="secondary-touch" type="button" onClick={() => changeMap({ initialView: view })}>Guardar vista actual · {view.zoom.toFixed(1)}×</button>
          <button className="secondary-touch" type="button" disabled={!map.projectPosition} onClick={() => {
            if (map.projectPosition) changeMap({ initialView: { ...map.projectPosition, zoom: view.zoom } });
          }}>Centrar en Bustamante 175</button>
        </div>
      </details>
      <div className="admin-card-heading">
        <h2>Mapa y marcadores</h2>
        <UploadImage label="Reemplazar mapa" types={mapTypes} onFiles={([file]) => void replaceImage(file)} />
      </div>
      {message && <p role="status" className="mb-3 text-sm text-morada">{message}</p>}
      <div className="admin-actions mb-2" aria-label="Modo del mapa">
        <button className={mode === "navigate" ? "primary-touch" : "secondary-touch"} type="button" aria-pressed={mode === "navigate"} onClick={() => setMode("navigate")}>Navegar</button>
        <button className={mode === "place" ? "primary-touch" : "secondary-touch"} type="button" aria-pressed={mode === "place"} onClick={() => setMode("place")}>Editar marcadores</button>
        <button className={mode === "project" ? "primary-touch" : "secondary-touch"} type="button" aria-pressed={mode === "project"} onClick={() => setMode("project")}><MapPin size={16} /> Ubicar proyecto</button>
      </div>
      <p className="mb-3 text-sm text-ink/70">{mode === "navigate" ? "Arrastra el mapa y ajusta el zoom para preparar el encuadre." : mode === "project" ? "Toca la posición de Bustamante 175 en el mapa." : "Toca el mapa para ubicar el lugar seleccionado o arrastra su marcador."}</p>
      <div className="admin-neighborhood-map-grid">
        <div className="admin-neighborhood-canvas">
          <NeighborhoodMap map={map} points={points.filter((point) => point.positioned !== false)} selectedId={selectedId}
            onSelect={setSelectedId} mode={mode} onViewChange={setView}
            onPlace={(id, position) => changePoint(id, { ...position, positioned: true, walkingVerified: false })}
            onProjectPlace={(position) => {
              void updateProject((current) => ({
                ...current,
                location: { ...current.location!, map: { ...current.location!.map, projectPosition: position, initialView: { ...position, zoom: view.zoom } } },
                pointsOfInterest: current.pointsOfInterest.map((point) => ({ ...point, walkingVerified: false }))
              }));
              setMode("navigate");
            }} />
        </div>
        <div className="admin-neighborhood-inspector">
          <div className="admin-actions mb-2">
            <button className="secondary-touch" type="button" onClick={addPoint}><Plus size={16} /> Agregar lugar</button>
            <span className="text-xs text-ink/70">{points.filter((point) => point.featured && point.visible).length} destacados</span>
          </div>
          <label>Lugar seleccionado
            <select className="field" value={selected?.id ?? ""} onChange={(event) => setSelectedId(event.target.value)}>
              <option value="">Seleccionar lugar</option>
              {points.map((point) => <option key={point.id} value={point.id}>{point.order}. {point.name}</option>)}
            </select>
          </label>
          {selected && <div className="mt-3 grid gap-2">
            <label>Nombre<input className="field" value={selected.name} onChange={(event) => changePoint(selected.id, { name: event.target.value })} /></label>
            <label>Categoría<select className="field" value={selected.category} onChange={(event) => changePoint(selected.id, { category: event.target.value as PointOfInterest["category"] })}>
              {categories.map((category) => <option key={category}>{category}</option>)}
            </select></label>
            <div className="flex flex-wrap gap-3">
              <label className="flex items-center gap-2"><input type="checkbox" checked={selected.featured ?? false} onChange={(event) => changePoint(selected.id, { featured: event.target.checked })} /> Destacado</label>
              <label className="flex items-center gap-2"><input type="checkbox" checked={selected.visible} disabled={selected.positioned === false} onChange={(event) => changePoint(selected.id, { visible: event.target.checked })} /> Visible</label>
            </div>
            <details className="admin-neighborhood-settings">
              <summary>Fotografía y tiempo a pie</summary>
              {selected.photoSrc && <img className="mb-2 h-24 w-full object-cover" src={selected.photoSrc} alt={selected.name} />}
              <UploadImage label={selected.photoSrc ? "Reemplazar foto" : "Agregar foto"} onFiles={([file]) => void replaceImage(file, selected.id)} />
              {selected.photoSrc && <button className="secondary-touch ml-1" type="button" onClick={() => changePoint(selected.id, { photoSrc: undefined, photoCredit: undefined })}>Quitar foto</button>}
              <label className="mt-2 block">Minutos a pie<input className="field" type="number" min="1" step="1" value={selected.walkingMinutes ?? ""} onChange={(event) => {
                const minutes = event.target.valueAsNumber;
                changePoint(selected.id, { walkingMinutes: Number.isFinite(minutes) && minutes > 0 ? minutes : undefined, walkingVerified: false });
              }} /></label>
              <label>Fuente o medición<input className="field" value={selected.walkingSource ?? ""} onChange={(event) => changePoint(selected.id, { walkingSource: event.target.value, walkingVerified: false })} /></label>
              <label className="flex items-center gap-2 mt-2"><input type="checkbox" disabled={!selected.walkingMinutes || !selected.walkingSource?.trim() || !map.projectPosition || selected.positioned === false} checked={selected.walkingVerified ?? false}
                onChange={(event) => changePoint(selected.id, { walkingVerified: event.target.checked })} /> Tiempo verificado</label>
            </details>
            <button className="secondary-touch justify-self-start" type="button" onClick={() => {
              if (!confirm(`¿Eliminar ${selected.name} del mapa?`)) return;
              setSelectedId("");
              void updateProject((current) => ({ ...current, pointsOfInterest: current.pointsOfInterest.filter((point) => point.id !== selected.id) }));
            }}><Trash2 size={16} /> Eliminar lugar</button>
          </div>}
        </div>
      </div>
      {!!location.archivedPoints?.length && <details className="admin-neighborhood-settings mt-4">
        <summary>Archivo de ubicación anterior · {location.archivedPoints.length} lugares</summary>
        {legacyText && <p className="mb-2 text-sm"><strong>{legacyText.title}</strong> · {legacyText.summary}</p>}
        {legacyMap?.images[0] && <a href={legacyMap.images[0].src} download="mapa-anterior.svg" className="text-sm underline">Descargar mapa anterior</a>}
        <ul className="admin-neighborhood-archive">{location.archivedPoints.map((point) => <li key={point.id}>{point.order}. {point.name} · {point.category}</li>)}</ul>
      </details>}
    </section>
  );
}
