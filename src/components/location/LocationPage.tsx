import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Footprints, Hand, MapPin, X } from "lucide-react";
import type { Project } from "../../types/project";
import { migrateLocation } from "../../data/locationContent";
import { NeighborhoodMap } from "./NeighborhoodMap";
import "../../styles/location.css";

function allowsScreenGesture(target: EventTarget | null) {
  return target instanceof Element && !target.closest(
    ".neighborhood-map-area, .neighborhood-filmstrip, button, a, input, select, textarea"
  );
}

export function LocationPage({ project, initialScreen = "story" }: { project: Project; initialScreen?: "story" | "map" }) {
  const content = migrateLocation(project);
  const location = content.location!;
  const [screen, setScreen] = useState(initialScreen);
  const pointer = useRef<{ id: number; x: number; y: number }>();
  const wheel = useRef({ lastAt: 0, distance: 0, changed: false });
  const isStory = screen === "story";
  const crop = location.map.crop;
  const [imageId, setImageId] = useState(location.storytelling.mainImageId);
  const [filter, setFilter] = useState("Destacados");
  const [selectedId, setSelectedId] = useState<string>();
  const images = location.storytelling.images.filter((image) => image.active);
  const active = images.find((image) => image.id === imageId) ?? images[0];
  const activeIndex = images.findIndex((image) => image.id === active?.id);
  const allVisible = content.pointsOfInterest.filter((point) => point.visible && point.positioned !== false).sort((a, b) => a.order - b.order);
  const categories = [...new Set(allVisible.map((point) => point.category))];
  const points = allVisible.filter((point) => filter === "Destacados" ? point.featured : filter === "Todos" || point.category === filter);
  const selected = points.find((point) => point.id === selectedId);

  function nextImage(direction: number) {
    if (images.length) setImageId(images[(activeIndex + direction + images.length) % images.length].id);
  }

  function navigate(next: "story" | "map") {
    pointer.current = undefined;
    setScreen(next);
    setSelectedId(undefined);
  }

  function swipe(distance: number) {
    if (isStory && distance < -55) navigate("map");
    else if (!isStory && distance > 55) navigate("story");
  }

  return (
    <section
      className="neighborhood-experience"
      aria-label="Ubicación y entorno"
      onPointerDown={(event) => {
        if (!event.isPrimary) return;
        pointer.current = undefined;
        if (event.button !== 0 || !allowsScreenGesture(event.target)) return;
        pointer.current = { id: event.pointerId, x: event.clientX, y: event.clientY };
      }}
      onPointerUp={(event) => {
        const start = pointer.current;
        if (start?.id !== event.pointerId) return;
        pointer.current = undefined;
        const x = event.clientX - start.x;
        const y = event.clientY - start.y;
        if (Math.abs(x) > Math.abs(y) * 1.45) swipe(x);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") pointer.current = undefined;
      }}
      onPointerCancel={(event) => {
        if (pointer.current?.id === event.pointerId) pointer.current = undefined;
      }}
      onWheel={(event) => {
        if (!allowsScreenGesture(event.target) || event.ctrlKey) return;
        const now = performance.now();
        if (now - wheel.current.lastAt > 200) wheel.current = { lastAt: now, distance: 0, changed: false };
        wheel.current.lastAt = now;
        if (wheel.current.changed || Math.abs(event.deltaX) <= Math.abs(event.deltaY) * 1.45) return;
        wheel.current.distance += event.deltaX * (event.deltaMode === 1 ? 16 : 1);
        if ((isStory && wheel.current.distance > 55) || (!isStory && wheel.current.distance < -55)) {
          wheel.current.changed = true;
          swipe(-wheel.current.distance);
        }
      }}
    >
      {screen === "story" ? (
        <div key="story" className="neighborhood-story neighborhood-slide">
          <div className="neighborhood-hero">
            {images.map((image) => <img key={image.id} src={image.src} draggable={false} alt={image.description || image.title} aria-hidden={active?.id !== image.id} className={active?.id === image.id ? "is-current" : ""} />)}
            <div className="neighborhood-story-copy">
              <p className="neighborhood-eyebrow">{location.storytelling.eyebrow}</p>
              <h1>{location.storytelling.title}</h1>
              <p className="neighborhood-description">{location.storytelling.description}</p>
            </div>
            {active && <div className="neighborhood-photo-caption">
              <span>{active.description || active.title}</span>
              {active.credit && <small>{active.sourceUrl ? <a href={active.sourceUrl} target="_blank" rel="noreferrer">{active.credit}</a> : active.credit}{active.licenseUrl && <> · <a href={active.licenseUrl} target="_blank" rel="noreferrer">Licencia</a></>}</small>}
            </div>}
            {images.length > 1 && <div className="neighborhood-photo-arrows">
              <button type="button" aria-label="Fotografía anterior" onClick={() => nextImage(-1)}><ChevronLeft /></button>
              <button type="button" aria-label="Fotografía siguiente" onClick={() => nextImage(1)}><ChevronRight /></button>
            </div>}
          </div>
          <div className="neighborhood-filmstrip" aria-label="Fotografías del entorno">
            {images.map((image) => <button key={image.id} type="button" onClick={() => setImageId(image.id)} aria-pressed={active?.id === image.id}>
              <img src={image.src} alt="" /><span>{image.title}</span>
            </button>)}
            {!images.length && <p>Agrega fotografías del barrio desde el administrador.</p>}
          </div>
        </div>
      ) : (
        <div key="map" className="neighborhood-location neighborhood-slide">
          <aside className="neighborhood-map-copy">
            <p className="neighborhood-eyebrow">{location.map.eyebrow}</p>
            <h1>{location.map.title}</h1>
            <p className="neighborhood-description">{location.map.description}</p>
            <p className="neighborhood-address">{project.address}</p>
            <div className="neighborhood-filters" aria-label="Categorías del entorno">
              {["Destacados", "Todos", ...categories].map((category) => <button key={category} type="button" aria-pressed={filter === category} onClick={() => { setFilter(category); setSelectedId(undefined); }}>{category}</button>)}
            </div>
            <div className="neighborhood-place-list" aria-label="Lugares del mapa">
              {points.map((point) => <button key={point.id} type="button" aria-pressed={selectedId === point.id} onClick={() => setSelectedId(point.id)}><span>{point.order}</span>{point.name}</button>)}
              {!points.length && <p>No hay lugares visibles en esta categoría.</p>}
            </div>
          </aside>
          <div className="neighborhood-map-area">
            <NeighborhoodMap map={location.map} points={points} selectedId={selectedId} onSelect={setSelectedId} />
            {selected && <article className="neighborhood-place-card" aria-label={selected.name}>
              <button type="button" aria-label="Cerrar información del lugar" onClick={() => setSelectedId(undefined)}><X size={18} /></button>
              {selected.photoSrc && <img src={selected.photoSrc} alt={selected.name} />}
              {selected.photoCredit?.credit && <small className="neighborhood-place-credit">
                <a href={selected.photoCredit.sourceUrl} target="_blank" rel="noreferrer">{selected.photoCredit.credit}</a>
                {selected.photoCredit.licenseUrl && <> · <a href={selected.photoCredit.licenseUrl} target="_blank" rel="noreferrer">Licencia</a></>}
              </small>}
              <div><p>{selected.category}</p><h2>{selected.name}</h2>
                {selected.walkingVerified && typeof selected.walkingMinutes === "number" && Number.isFinite(selected.walkingMinutes) && selected.walkingMinutes > 0 && selected.walkingSource?.trim() && (
                  <p className="neighborhood-walking" title={selected.walkingSource}><Footprints size={16} /> {selected.walkingMinutes} min caminando</p>
                )}
              </div>
            </article>}
          </div>
        </div>
      )}
      <footer className="neighborhood-pagination" data-screen={screen}>
        <div className="neighborhood-progress" aria-live="polite" aria-atomic="true">
          <span className="neighborhood-progress-count">{isStory ? "01" : "02"} <span>/ 02</span></span>
          <span className="neighborhood-progress-label">{isStory ? "Descubre Barranco" : "Explora el entorno"}</span>
          <div className="neighborhood-progress-track" aria-hidden="true"><span /><span /></div>
        </div>
        {isStory && (
          <>
            <div className="neighborhood-swipe-hint">
              <span aria-hidden="true"><ArrowLeft size={13} /><Hand size={19} /></span>
              Desliza hacia la izquierda para explorar el mapa
            </div>
            <button className="neighborhood-map-preview" type="button" aria-label="Abrir vista previa del mapa del entorno" onClick={() => navigate("map")}>
              <img src={location.map.imageSrc} alt="" draggable={false} style={crop ? {
                width: `${100 / crop.width}%`, height: `${100 / crop.height}%`,
                left: `${-crop.x / crop.width * 100}%`, top: `${-crop.y / crop.height * 100}%`
              } : undefined} />
              <MapPin size={15} aria-hidden="true" />
            </button>
          </>
        )}
        <button className="neighborhood-pagination-action" type="button" onClick={() => navigate(isStory ? "map" : "story")}>
          {isStory ? <MapPin size={18} /> : <ArrowLeft size={18} />}
          {isStory ? "Ver mapa del entorno" : "Descubre Barranco"}
          {isStory && <ArrowRight size={18} />}
        </button>
      </footer>
    </section>
  );
}
