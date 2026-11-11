import { useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Footprints, X } from "lucide-react";
import type { Project } from "../../types/project";
import { migrateLocation } from "../../data/locationContent";
import { NeighborhoodMap } from "./NeighborhoodMap";
import "../../styles/location.css";

export function LocationPage({ project, initialScreen = "story" }: { project: Project; initialScreen?: "story" | "map" }) {
  const content = migrateLocation(project);
  const location = content.location!;
  const [screen, setScreen] = useState(initialScreen);
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

  return (
    <section className="neighborhood-experience" aria-label="Ubicación y entorno">
      {screen === "story" ? (
        <div className="neighborhood-story">
          <div className="neighborhood-hero">
            {images.map((image) => <img key={image.id} src={image.src} alt={image.description || image.title} aria-hidden={active?.id !== image.id} className={active?.id === image.id ? "is-current" : ""} />)}
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
        <div className="neighborhood-location">
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
      <footer className="neighborhood-pagination">
        <span aria-live="polite">{screen === "story" ? "01" : "02"} <span>/ 02</span></span>
        <button type="button" onClick={() => { setScreen(screen === "story" ? "map" : "story"); setSelectedId(undefined); }}>
          {screen === "map" && <ArrowLeft size={21} />}
          {screen === "story" ? "Explorar la ubicación" : "Descubrir Barranco"}
          {screen === "story" && <ArrowRight size={21} />}
        </button>
      </footer>
    </section>
  );
}
