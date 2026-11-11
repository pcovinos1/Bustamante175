import { ArrowRight, Building2, Check, ChevronLeft, ChevronRight, Grid3X3, Search, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { FloorPlanInteractive } from "./components/FloorPlanInteractive";
import { GalleryModal } from "./components/GalleryModal";
import { GlobalNav } from "./components/GlobalNav";
import { PlanViewer } from "./components/PlanViewer";
import { useProject } from "./context/ProjectContext";
import { AdminPage } from "./components/AdminPage";
import type { Gallery, GalleryImage, Project, Typology, ViewKey } from "./types/project";

const menuItems: Array<{ view: ViewKey; title: string; text: string }> = [
  { view: "about", title: "About us", text: "La visión y origen de Morada." },
  { view: "project", title: "El proyecto", text: "LEED, Miraflores y visión Morada." },
  { view: "architecture", title: "Arquitectura", text: "Nómena Arquitectura y fachada tridimensional." },
  { view: "location", title: "Ubicación", text: "Mapa ilustrado con filtros offline." },
  { view: "amenities", title: "Áreas comunes", text: "Diez ambientes compartidos." },
  { view: "interiors", title: "Interiores", text: "Renders y propuesta de interiorismo." },
  { view: "departments", title: "Departamentos", text: "Tipologías, planta típica y planos." },
  { view: "contact", title: "Contacto", text: "Información comercial." }
];

export default function App() {
  const { project, loading } = useProject();
  const [view, setView] = useState<ViewKey>("home");
  const [preview, setPreview] = useState<ViewKey | null>(null);
  const visibleView = preview ?? view;
  const [selectedTypologyId, setSelectedTypologyId] = useState("a-1");
  const [planTypologyIds, setPlanTypologyIds] = useState<string[] | null>(null);
  const [gallery, setGallery] = useState<{ images: GalleryImage[]; index: number } | null>(null);
  const [poiFilter, setPoiFilter] = useState("Todos");

  const selectedTypology = project?.typologies.find((item) => item.id === selectedTypologyId) ?? project?.typologies[0];
  const navigate = (next: ViewKey) => {
    if (next === "location") setPoiFilter("Todos");
    if (preview) {
      setPreview(next === "admin" ? null : next);
    } else {
      setView(next);
    }
  };
  const openTypology = (id: string, ids: string[]) => {
    setSelectedTypologyId(id);
    setPlanTypologyIds(ids);
  };

  if (loading || !project) {
    return <div className="grid min-h-screen place-items-center bg-paper text-ink">Cargando Bustamante 175...</div>;
  }

  return (
    <>
      {view === "admin" && (
        <div hidden={Boolean(preview)}>
          <AdminPage project={project} onExit={() => navigate("home")} onPreview={setPreview} />
        </div>
      )}
      {visibleView !== "admin" && (
        <main className="min-h-screen bg-paper pb-28 text-ink">
          {preview && (
            <button className="admin-preview-return" type="button" onClick={() => {
              setGallery(null);
              setPlanTypologyIds(null);
              setPreview(null);
            }}>Volver al editor</button>
          )}
          <GlobalNav current={visibleView} onNavigate={navigate} />
          {visibleView === "home" && <Home project={project} onNavigate={navigate} />}
          {visibleView === "menu" && <MenuPage onNavigate={navigate} />}
          {visibleView === "about" && <AboutUsPage project={project} />}
          {visibleView === "project" && <ProjectPage project={project} onOpenGallery={setGallery} />}
          {visibleView === "architecture" && <ArchitecturePage project={project} onOpenGallery={setGallery} />}
          {visibleView === "amenities" && <AmenitiesPage project={project} onOpenGallery={setGallery} />}
          {visibleView === "interiors" && <InteriorsPage project={project} onOpenGallery={setGallery} />}
          {visibleView === "location" && <LocationPage project={project} filter={poiFilter} setFilter={setPoiFilter} onOpenGallery={setGallery} />}
          {visibleView === "departments" && <DepartmentsPage project={project} selectedTypologyId={selectedTypologyId} setSelectedTypologyId={setSelectedTypologyId} onNavigate={navigate} onOpenTypology={openTypology} />}
          {visibleView === "floor" && (
            <FloorPage
              project={project}
              selectedTypologyId={selectedTypologyId}
              setSelectedTypologyId={setSelectedTypologyId}
              onOpenTypology={openTypology}
            />
          )}
          {planTypologyIds && selectedTypology && (
            <TypologyDialog
              typology={selectedTypology}
              typologyIds={planTypologyIds}
              setSelectedTypologyId={setSelectedTypologyId}
              onClose={() => setPlanTypologyIds(null)}
              onShowFloor={() => {
                setPlanTypologyIds(null);
                navigate("floor");
              }}
            />
          )}
          {visibleView === "compare" && <ComparePage project={project} />}
          {visibleView === "contact" && <ContactPage project={project} />}
          {gallery ? <GalleryModal images={gallery.images} initialIndex={gallery.index} onClose={() => setGallery(null)} /> : null}
        </main>
      )}
    </>
  );
}

function Home({ project, onNavigate }: { project: Project; onNavigate: (view: ViewKey) => void }) {
  const hero = project.galleries.find((item) => item.id === "fachada")?.images[0]?.src;
  return (
    <section className="screen-section relative overflow-hidden bg-ink text-white">
      <img className="absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-72 transition duration-700" src={hero} alt={`Render principal ${project.name}`} />
      <div className="absolute inset-0 bg-gradient-to-r from-ink/80 via-ink/30 to-transparent" />
      <div className="relative z-10 flex min-h-screen max-w-7xl flex-col justify-between px-6 pb-32 pt-8 md:px-12">
        <header className="flex items-center justify-between">
          {project.logoSrc ? (
            <img className="h-10 w-auto max-w-[220px] object-contain" src={project.logoSrc} alt={project.logoText} />
          ) : (
            <p className="text-3xl font-bold tracking-tight">{project.logoText}</p>
          )}
          <button className="rounded-full bg-white/10 px-4 py-3 text-sm backdrop-blur" onClick={() => onNavigate("admin")} type="button">
            Administrador
          </button>
        </header>
        <div className="max-w-3xl pb-12">
          <p className="mb-4 text-sm uppercase tracking-[0.3em] text-white/70">{project.tagline}</p>
          <h1 className="font-display text-6xl leading-none md:text-8xl">{project.name}</h1>
          <p className="mt-6 max-w-2xl text-xl leading-relaxed text-white/90">{project.shortDescription}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <button className="primary-touch" onClick={() => onNavigate("project")} type="button">
              Explorar el proyecto <ArrowRight />
            </button>
            <button className="home-departments-button" onClick={() => onNavigate("departments")} type="button">
              DEPARTAMENTOS <Building2 />
            </button>
          </div>
        </div>
        <p className="text-sm text-white/60">Modo presentación: la pantalla vuelve a esta portada al reiniciar la experiencia.</p>
      </div>
    </section>
  );
}

function AboutUsPage({ project }: { project: Project }) {
  const [projectFilter, setProjectFilter] = useState("Todos");
  const aboutProjects = [...(project.about.projects ?? [])].sort((a, b) => a.order - b.order);
  const districts = ["Todos", ...Array.from(new Set(aboutProjects.map((item) => item.district).filter(Boolean)))];
  const filteredProjects = aboutProjects.filter((item) => projectFilter === "Todos" || item.district === projectFilter);
  const aboutSlides = [
    {
      id: "about-cover",
      content: (
        <div className={`about-cover ${project.about.coverImageSrc ? "has-image" : ""}`}>
          <div className="about-cover__copy">
            <p className="eyebrow">{project.about.eyebrow}</p>
            <h1>{project.about.title}</h1>
            <span>{project.about.subtitle}</span>
          </div>
          {project.about.coverImageSrc ? (
            <div className="about-cover__image">
              <img src={project.about.coverImageSrc} alt="" />
            </div>
          ) : null}
        </div>
      )
    },
    ...project.about.slides.map((slide) => ({
      id: slide.id,
      content: <AboutSlide number={slide.number} text={highlightText(slide.text, slide.keywords)} imageSrc={slide.imageSrc} />
    })),
    {
      id: "about-projects",
      content: (
        <AboutProjectsSlide
          districts={districts}
          filter={projectFilter}
          projects={filteredProjects}
          setFilter={setProjectFilter}
        />
      )
    }
  ];
  return <HorizontalSections label="About us" slides={aboutSlides} />;
}

function AboutProjectsSlide({ districts, filter, projects, setFilter }: { districts: string[]; filter: string; projects: Project["about"]["projects"]; setFilter: (value: string) => void }) {
  return (
    <div className="about-projects">
      <header>
        <p className="eyebrow">Morada</p>
        <h2>Proyectos</h2>
        <div className="about-project-filters">
          {districts.map((district) => (
            <button key={district} className={filter === district ? "is-active" : ""} onClick={() => setFilter(district)} type="button">
              {district}
            </button>
          ))}
        </div>
      </header>
      <div className="about-project-grid">
        {projects.map((item) => (
          <article key={item.id} className="about-project-card">
              <img src={item.imageSrc} alt={item.name} />
            <div>
              <h3>{item.name}</h3>
              <p>{item.year}</p>
              <span>{item.district}</span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function AboutSlide({ number, text, imageSrc }: { number: string; text: ReactNode; imageSrc?: string }) {
  return (
    <div className={`about-slide ${imageSrc ? "has-image" : ""}`}>
      <article>
        <span>{number}</span>
        <p>{text}</p>
      </article>
      {imageSrc ? (
        <div className="about-slide__image">
          <img src={imageSrc} alt="" />
        </div>
      ) : null}
    </div>
  );
}

function highlightText(text: string, keywords: string[]) {
  const activeKeywords = keywords.map((keyword) => keyword.trim()).filter(Boolean);
  if (!activeKeywords.length) return text;
  const escaped = activeKeywords.map((keyword) => keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const matcher = new RegExp(`(${escaped.join("|")})`, "gi");
  return text.split(matcher).map((part, index) => (
    activeKeywords.some((keyword) => keyword.toLowerCase() === part.toLowerCase()) ? <strong key={`${part}-${index}`}>{part}</strong> : part
  ));
}

function MenuPage({ onNavigate }: { onNavigate: (view: ViewKey) => void }) {
  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Menú principal" title="Una navegación pensada para sala de ventas" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {menuItems.map((item, index) => (
          <button key={item.view} className="group min-h-[190px] rounded border border-ink/10 bg-porcelain p-6 text-left transition hover:border-morada" onClick={() => onNavigate(item.view)} type="button">
            <span className="text-sm text-morada">{`${index + 1}`.padStart(2, "0")}</span>
            <h2 className="mt-8 font-display text-4xl">{item.title}</h2>
            <p className="mt-3 text-ink/70">{item.text}</p>
            <ArrowRight className="mt-5 text-morada transition group-hover:translate-x-1" />
          </button>
        ))}
      </div>
    </section>
  );
}

function ProjectPage({ project, onOpenGallery }: { project: Project; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const images = project.galleries.find((item) => item.id === "fachada")?.images ?? [];
  const projectFacadeGallery = project.galleries.find((item) => item.id === "proyecto-fachada") ?? project.galleries.find((item) => item.id === "fachada");
  const architectureGallery = project.galleries.find((item) => item.id === "arquitectura");
  const architectureSection = getSection(project, "architecture");
  const projectFacadeImages = projectFacadeGallery?.images.slice(0, 3) ?? [];
  const architectureImage = architectureGallery?.images[0];
  const section = getSection(project, "project");
  return (
    <HorizontalSections
      label="Proyecto"
      slides={[
        {
          id: "project-intro",
          content: (
            <div className="horizontal-editorial-layout">
              <button className="horizontal-editorial-image" onClick={() => onOpenGallery({ images, index: 0 })} type="button">
                <img src={images[0]?.src} alt={project.name} />
              </button>
              <article>
                <p className="eyebrow">{section.title}</p>
                <h1 className="editorial-title">{project.name}</h1>
                <p className="editorial-lead">{project.shortDescription}</p>
                <div className="editorial-stats">
                  <Stat label="Arquitectura" value={project.architect} />
                  <Stat label="Certificación" value={project.certification} />
                  <Stat label="Distrito" value={project.district} />
                  <Stat label="Áreas" value={project.areaRange} />
                </div>
              </article>
            </div>
          )
        },
        {
          id: "project-facade",
          content: (
            <div className="horizontal-feature-layout">
              <article>
                <p className="eyebrow">{projectFacadeGallery?.title ?? "Fachada y proyecto"}</p>
                <h2 className="font-display text-4xl leading-tight md:text-6xl">Tres miradas a la arquitectura de {project.name}.</h2>
                <p>{section.summary}</p>
              </article>
              <div className="horizontal-image-strip">
                {projectFacadeImages.map((image, index) => (
                  <button key={image.id} className={index === 0 ? "is-wide" : ""} onClick={() => projectFacadeGallery && onOpenGallery({ images: projectFacadeGallery.images, index })} type="button">
                    <img src={image.src} alt={image.title} />
                    <span>{image.title}</span>
                  </button>
                ))}
              </div>
            </div>
          )
        },
        {
          id: "project-architects",
          content: (
            <div className="horizontal-editorial-layout is-reversed">
              <button className="horizontal-editorial-image" onClick={() => architectureGallery && onOpenGallery({ images: architectureGallery.images, index: 0 })} type="button">
                <img src={architectureImage?.src} alt={architectureImage?.title ?? project.architect} />
              </button>
              <article>
                <p className="eyebrow">{architectureSection.title}</p>
                <h2 className="editorial-title">{project.architect}</h2>
                <p className="editorial-lead">{architectureSection.summary}</p>
                {architectureImage?.description ? <p className="mt-6 text-xl leading-relaxed text-ink/70">{architectureImage.description}</p> : null}
              </article>
            </div>
          )
        }
      ]}
    />
  );
}

function AmenitiesPage({ project, onOpenGallery }: { project: Project; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const gallery = project.galleries.find((item) => item.id === "areas");
  const section = getSection(project, "amenities");
  return (
    <HorizontalGalleryStory eyebrow={section.title} title={gallery?.title ?? section.title} text={section.summary} gallery={gallery} labels={project.sharedAreas} onOpenGallery={onOpenGallery} />
  );
}

function ArchitecturePage({ project, onOpenGallery }: { project: Project; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const gallery = project.galleries.find((item) => item.id === "arquitectura");
  const image = gallery?.images[0];
  const section = getSection(project, "architecture");
  return (
    <section className="editorial-page">
      <div className="architecture-layout">
        <button className="architecture-image" onClick={() => gallery && onOpenGallery({ images: gallery.images, index: 0 })} type="button">
          <img src={image?.src} alt="Nómena Arquitectura" />
        </button>
        <article className="architecture-copy">
          <p className="eyebrow">{section.title}</p>
          <h1 className="editorial-title">{project.architect}</h1>
          <p className="editorial-lead">{section.summary}</p>
          {image?.description ? <p className="mt-8 max-w-xl text-lg leading-relaxed text-ink/70">{image.description}</p> : null}
          <button className="editorial-link mt-8" onClick={() => gallery && onOpenGallery({ images: gallery.images, index: 0 })} type="button">
            Ver arquitectura <ArrowRight className="size-4" />
          </button>
        </article>
      </div>
    </section>
  );
}

function InteriorsPage({ project, onOpenGallery }: { project: Project; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const gallery = project.galleries.find((item) => item.id === "interiores");
  const section = getSection(project, "interiors");
  return (
    <HorizontalGalleryStory eyebrow={section.title} title={gallery?.title ?? section.title} text={section.summary} gallery={gallery} labels={gallery?.images.map((image) => image.title) ?? ["Sala", "Comedor", "Cocina", "Dormitorio principal", "Dormitorio secundario", "Baño", "Detalles de materiales"]} onOpenGallery={onOpenGallery} />
  );
}

function LocationPage({ project, filter, setFilter, onOpenGallery }: { project: Project; filter: string; setFilter: (value: string) => void; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const [hoveredPoiId, setHoveredPoiId] = useState<string | null>(null);
  const [selectedPoiId, setSelectedPoiId] = useState<string | null>(null);
  const categories = ["Todos", "Gastronomía", "Parques", "Educación", "Tiendas"];
  const gallery = project.galleries.find((item) => item.id === "barrio");
  const visible = project.pointsOfInterest
    .filter((poi) => poi.visible)
    .filter((poi) => filter === "Todos" || poi.category === filter)
    .sort((a, b) => a.order - b.order);
  const section = getSection(project, "location");
  const activePoiId = hoveredPoiId ?? selectedPoiId;
  const activePoi = visible.find((poi) => poi.id === activePoiId);
  return (
    <section className="editorial-page">
      <div className="location-scene">
        <aside className="location-copy">
          <p className="eyebrow">{section.title}</p>
          <h1 className="editorial-title">{project.address}</h1>
          <p className="editorial-lead">{section.summary}</p>
          <div className="location-filters">
            {categories.map((category) => (
              <button key={category} className={`pill ${filter === category ? "pill-active" : ""}`} onClick={() => { setFilter(category); setHoveredPoiId(null); setSelectedPoiId(null); }} type="button">
                {category}
              </button>
            ))}
          </div>
        </aside>
        <div className="location-map" aria-label="Mapa interactivo de puntos de interés">
          <div className="location-map-frame">
            <img className="h-full w-full object-contain" src={gallery?.images[0]?.src} alt="Mapa ilustrado offline" />
            {visible.map((poi) => {
              const active = activePoiId === poi.id;
              return (
                <button
                  key={poi.id}
                  className={`location-marker ${active ? "is-active" : ""}`}
                  style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
                  onMouseEnter={() => setHoveredPoiId(poi.id)}
                  onMouseLeave={() => setHoveredPoiId(null)}
                  onFocus={() => setHoveredPoiId(poi.id)}
                  onBlur={() => setHoveredPoiId(null)}
                  onClick={() => setSelectedPoiId((current) => (current === poi.id ? null : poi.id))}
                  type="button"
                  aria-label={poi.name}
                >
                  <span>{poi.order}</span>
                  <em>{poi.name}</em>
                </button>
              );
            })}
          </div>
        </div>
        <aside className="location-list">
          <div className="location-list-head">
            <div>
              <p className="eyebrow mb-1">Puntos de interés</p>
              <span>{visible.length} lugares visibles</span>
            </div>
            {activePoi ? <strong>{activePoi.order}</strong> : null}
          </div>
          {activePoi ? <p className="location-active-name">{activePoi.name}</p> : null}
          <div className="location-list-scroll">
            {visible.map((poi) => {
              const active = activePoiId === poi.id;
              return (
                <button
                  key={poi.id}
                  className={active ? "is-active" : ""}
                  onMouseEnter={() => setHoveredPoiId(poi.id)}
                  onMouseLeave={() => setHoveredPoiId(null)}
                  onFocus={() => setHoveredPoiId(poi.id)}
                  onBlur={() => setHoveredPoiId(null)}
                  onClick={() => setSelectedPoiId((current) => (current === poi.id ? null : poi.id))}
                  type="button"
                >
                  <span>{poi.order}</span>
                  <strong>{poi.name}</strong>
                </button>
              );
            })}
          </div>
        </aside>
        {/* <div className="location-filters">
          {categories.map((category) => (
            <button key={category} className={`pill ${filter === category ? "pill-active" : ""}`} onClick={() => setFilter(category)} type="button">
              {category}
            </button>
          ))}
        </div> */}
      </div>
    </section>
  );
}

function Photobook({ eyebrow, title, text, gallery, labels, onOpenGallery }: { eyebrow: string; title: string; text: string; gallery?: Gallery; labels: string[]; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  const [index, setIndex] = useState(0);
  if (!gallery || gallery.images.length === 0) return null;
  const active = gallery.images[index % gallery.images.length];
  const next = (direction: number) => setIndex((current) => (current + direction + gallery.images.length) % gallery.images.length);
  return (
    <div className="photobook">
      <div className="photobook-copy">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="editorial-title">{title}</h1>
        <p className="editorial-lead">{text}</p>
        <div className="photobook-labels">
          {labels.map((label) => <span key={label}>{label}</span>)}
        </div>
      </div>
      <div className="photobook-stage">
        <button className="photobook-main" onClick={() => onOpenGallery({ images: gallery.images, index })} type="button">
          <img src={active.src} alt={active.title} />
          <span>{active.title}</span>
        </button>
        <div className="photobook-controls">
          <button onClick={() => next(-1)} type="button" aria-label="Imagen anterior"><ChevronLeft /></button>
          <div>
            {gallery.images.map((image, dotIndex) => (
              <button key={image.id} className={dotIndex === index ? "is-active" : ""} onClick={() => setIndex(dotIndex)} type="button" aria-label={`Ver ${image.title}`} />
            ))}
          </div>
          <button onClick={() => next(1)} type="button" aria-label="Imagen siguiente"><ChevronRight /></button>
        </div>
        <div className="photobook-thumbs">
          {gallery.images.map((image, thumbIndex) => (
            <button key={image.id} className={thumbIndex === index ? "is-active" : ""} onClick={() => setIndex(thumbIndex)} type="button">
              <img src={image.src} alt={image.title} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function HorizontalSections({ label, slides }: { label: string; slides: Array<{ id: string; content: JSX.Element }> }) {
  const [index, setIndex] = useState(0);
  const trackRef = useRef<HTMLDivElement | null>(null);
  const goTo = (nextIndex: number) => {
    const boundedIndex = Math.min(slides.length - 1, Math.max(0, nextIndex));
    setIndex(boundedIndex);
    const track = trackRef.current;
    if (track) track.scrollTo({ left: track.clientWidth * boundedIndex, behavior: "smooth" });
  };
  return (
    <section className="horizontal-story" aria-label={label}>
      <div className="horizontal-track" ref={trackRef} onScroll={(event) => setIndex(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))}>
        {slides.map((slide) => (
          <section className="horizontal-slide" key={slide.id}>
            {slide.content}
          </section>
        ))}
      </div>
      {slides.length > 1 ? (
        <div className="horizontal-nav">
          <button onClick={() => goTo(index - 1)} disabled={index === 0} type="button" aria-label="Anterior"><ChevronLeft /></button>
          <div>
            {slides.map((slide, dotIndex) => (
              <button key={slide.id} className={dotIndex === index ? "is-active" : ""} onClick={() => goTo(dotIndex)} type="button" aria-label={`Ir a sección ${dotIndex + 1}`} />
            ))}
          </div>
          <button onClick={() => goTo(index + 1)} disabled={index === slides.length - 1} type="button" aria-label="Siguiente"><ChevronRight /></button>
        </div>
      ) : null}
    </section>
  );
}

function HorizontalGalleryStory({ eyebrow, title, text, gallery, labels, onOpenGallery }: { eyebrow: string; title: string; text: string; gallery?: Gallery; labels: string[]; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  if (!gallery || gallery.images.length === 0) return null;
  const detailImages = gallery.images.slice(1);
  return (
    <HorizontalSections
      label={title}
      slides={[
        {
          id: "intro",
          content: (
            <div className="horizontal-gallery-intro">
              <article>
                <p className="eyebrow">{eyebrow}</p>
                <h1 className="editorial-title">{title}</h1>
                <p className="editorial-lead">{text}</p>
                <div className="photobook-labels">
                  {labels.map((label) => <span key={label}>{label}</span>)}
                </div>
              </article>
              <button onClick={() => onOpenGallery({ images: gallery.images, index: 0 })} type="button">
                <img src={gallery.images[0].src} alt={gallery.images[0].title} />
                <span>{gallery.images[0].title}</span>
              </button>
            </div>
          )
        },
        ...detailImages.map((image, imageIndex) => {
          const galleryIndex = imageIndex + 1;
          return {
          id: image.id,
          content: (
            <div className="horizontal-gallery-slide">
              <button onClick={() => onOpenGallery({ images: gallery.images, index: galleryIndex })} type="button">
                <img src={image.src} alt={image.title} />
              </button>
              <article>
                <h2>{image.title}</h2>
                {image.description ? <p>{image.description}</p> : null}
              </article>
            </div>
          )
        };
        })
      ]}
    />
  );
}

function ParallaxStory({ eyebrow, title, text, gallery, labels, onOpenGallery }: { eyebrow: string; title: string; text: string; gallery?: Gallery; labels: string[]; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  if (!gallery || gallery.images.length === 0) return null;
  return (
    <div className="parallax-story">
      <header className="parallax-intro">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="editorial-title">{title}</h1>
        <p className="editorial-lead">{text}</p>
        <div className="photobook-labels">
          {labels.map((label) => <span key={label}>{label}</span>)}
        </div>
      </header>
      {gallery.images.map((image, index) => (
        <section className={`parallax-panel ${index % 2 ? "is-offset" : ""}`} key={image.id}>
          <button className="parallax-image" onClick={() => onOpenGallery({ images: gallery.images, index })} type="button">
            <img src={image.src} alt={image.title} />
          </button>
          <article className="parallax-caption">
            <span>{String(index + 1).padStart(2, "0")}</span>
            <h2>{image.title}</h2>
            {image.description ? <p>{image.description}</p> : null}
          </article>
        </section>
      ))}
    </div>
  );
}

function DepartmentsPage({ project, selectedTypologyId, setSelectedTypologyId, onNavigate, onOpenTypology }: { project: Project; selectedTypologyId: string; setSelectedTypologyId: (id: string) => void; onNavigate: (view: ViewKey) => void; onOpenTypology: (id: string, ids: string[]) => void }) {
  const [bedrooms, setBedrooms] = useState("Todos");
  const [area, setArea] = useState("Todas");
  const [generalPlanId, setGeneralPlanId] = useState("");
  const generalPlan = project.generalPlans?.find(plan => plan.id === generalPlanId);
  const typologies = project.typologies.filter((item) => item.active);
  const filtered = typologies.filter((item) => (bedrooms === "Todos" || item.bedrooms === Number(bedrooms)) && (area === "Todas" || (area === "<60" ? item.areaM2 < 60 : area === "60-65" ? item.areaM2 >= 60 && item.areaM2 <= 65 : item.areaM2 > 65)));
  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Explorador" title="Departamentos y tipologías" />
      <div className="mb-5 flex flex-wrap gap-3">
        {["Todos", "1", "2", "3"].map((value) => (
          <button key={value} className={`pill ${bedrooms === value ? "pill-active" : ""}`} onClick={() => setBedrooms(value)} type="button">
            {value === "Todos" ? "Todos los dormitorios" : `${value} dorm.`}
          </button>
        ))}
        {["Todas", "<60", "60-65", "66+"].map((value) => (
          <button key={value} className={`pill ${area === value ? "pill-active" : ""}`} onClick={() => setArea(value)} type="button">
            {value === "Todas" ? "Todas las áreas" : value === "<60" ? "Menos de 60 m²" : value === "60-65" ? "60 a 65 m²" : "Más de 65 m²"}
          </button>
        ))}
        <button className="primary-touch ml-auto" onClick={() => onNavigate("floor")} type="button">
          Ver ubicación en planta <Grid3X3 />
        </button>
        <button className="secondary-touch" onClick={() => onNavigate("compare")} type="button">
          Comparar <Search />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((typology) => (
          <article key={typology.id} className={`relative rounded border bg-porcelain p-4 transition hover:border-morada ${selectedTypologyId === typology.id ? "border-morada" : "border-ink/10"}`}>
            <img className="h-44 w-full rounded border border-ink/10 bg-white object-contain" src={typology.thumbnailSrc} alt={`Plano ${typology.code}`} />
            <div className="mt-4 flex items-start justify-between">
              <div>
                <h2 className="font-display text-4xl">{typology.code}</h2>
                <p className="text-ink/70">Plano en alta resolución</p>
              </div>
              <span className="rounded-full bg-morada/10 px-3 py-1 text-sm text-morada">{typology.format}</span>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                className="primary-touch flex-1 after:absolute after:inset-0 after:rounded after:content-[''] focus-visible:after:ring-2 focus-visible:after:ring-morada active:transform-none"
                onClick={() => onOpenTypology(typology.id, filtered.map((item) => item.id))}
                type="button"
                aria-label={`Ver plano de ${typology.code}`}
                aria-haspopup="dialog"
              >
                Ver plano
              </button>
              <button className="secondary-touch relative z-10 flex-1" onClick={() => { setSelectedTypologyId(typology.id); onNavigate("floor"); }} type="button">
                En planta
              </button>
            </div>
          </article>
        ))}
      </div>
      {!!project.generalPlans?.length && (
        <div className="mt-10">
          <h2 className="mb-4 font-display text-4xl">Planos generales</h2>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-5">
            {project.generalPlans.map(plan => (
              <button key={plan.id} type="button" className="rounded border border-ink/10 bg-porcelain p-4 text-left" onClick={() => setGeneralPlanId(plan.id)}>
                <img src={plan.thumbnailSrc} alt={`Plano de ${plan.title}`} className="h-40 w-full bg-white object-contain" loading="lazy" />
                <span className="mt-3 block text-xl">{plan.title}</span>
                <span className="text-morada">Ver plano</span>
              </button>
            ))}
          </div>
        </div>
      )}
      {generalPlan && (
        <div className="fixed inset-0 z-[100] overflow-auto bg-porcelain p-4 md:p-8" role="dialog" aria-modal="true" aria-label={generalPlan.title} onKeyDown={event => { if (event.key === "Escape") setGeneralPlanId(""); }}>
          <div className="mb-4 flex items-center justify-between gap-4">
            <h2 className="font-display text-4xl">{generalPlan.title}</h2>
            <button autoFocus type="button" className="secondary-touch" onClick={() => setGeneralPlanId("")}>Cerrar plano</button>
          </div>
          <PlanViewer key={generalPlan.id} src={generalPlan.planSrc} title={generalPlan.title} />
        </div>
      )}
    </section>
  );
}

function FloorPage({ project, selectedTypologyId, setSelectedTypologyId, onOpenTypology }: { project: Project; selectedTypologyId: string; setSelectedTypologyId: (id: string) => void; onOpenTypology: (id: string, ids: string[]) => void }) {
  const typology = project.typologies.find((item) => item.id === selectedTypologyId);
  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Ubicación en planta" title={typology?.code ?? project.floorPlan.title} text="Ubicación referencial incluida en la ficha del departamento." />
      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        {project.floorPlan.hotspots.some((zone) => project.typologies.some((item) => item.id === zone.typologyId)) ? (
          <FloorPlanInteractive floorPlan={project.floorPlan} typologies={project.typologies} selectedId={selectedTypologyId} onSelect={setSelectedTypologyId} />
        ) : (
          <PlanViewer src={typology?.floorThumbnailSrc ?? project.floorPlan.imageSrc} title={`Ubicación ${typology?.code ?? "en planta"}`} />
        )}
        <aside className="rounded border border-ink/10 bg-porcelain p-5">
          {typology ? (
            <>
              <p className="text-sm uppercase tracking-[0.25em] text-morada">Seleccionado</p>
              <h2 className="mt-3 font-display text-6xl">{typology.code}</h2>
              <p className="mt-2 text-xl">Ubicación del departamento</p>
              <img className="mt-5 h-48 w-full rounded bg-white object-contain" src={typology.thumbnailSrc} alt={`Miniatura ${typology.code}`} />
              <button className="primary-touch mt-6 w-full" onClick={() => onOpenTypology(typology.id, project.typologies.filter((item) => item.active || item.id === typology.id).map((item) => item.id))} type="button" aria-haspopup="dialog">
                Ver plano <ArrowRight />
              </button>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function TypologyDialog({ typology, typologyIds, setSelectedTypologyId, onClose, onShowFloor }: { typology: Typology; typologyIds: string[]; setSelectedTypologyId: (id: string) => void; onClose: () => void; onShowFloor: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  const index = typologyIds.indexOf(typology.id);
  const move = (direction: number) => {
    setSelectedTypologyId(typologyIds[(index + direction + typologyIds.length) % typologyIds.length]);
  };
  return (
    <dialog
      ref={dialogRef}
      className="typology-dialog fixed inset-0 m-0 h-dvh max-h-none w-full max-w-none overflow-hidden bg-paper text-ink"
      aria-labelledby="typology-plan-title"
      onCancel={(event) => { event.preventDefault(); onClose(); }}
    >
      <div className="grid h-full grid-rows-[auto_minmax(0,1fr)] gap-1 p-1 sm:gap-2 sm:p-2">
        <header className="flex flex-wrap items-center justify-between gap-x-3 px-2">
          <h1 id="typology-plan-title" className="font-display text-xl sm:text-2xl">{typology.code}</h1>
          <div className="flex items-center gap-1">
            <button className="icon-button disabled:opacity-40" disabled={typologyIds.length < 2} onClick={() => move(-1)} type="button" aria-label="Tipología anterior"><ChevronLeft className="size-5" /></button>
            <button className="icon-button disabled:opacity-40" disabled={typologyIds.length < 2} onClick={() => move(1)} type="button" aria-label="Siguiente tipología"><ChevronRight className="size-5" /></button>
            <button className="icon-button px-2 text-sm" onClick={onShowFloor} type="button">En planta</button>
            <button autoFocus className="icon-button" onClick={onClose} type="button" aria-label="Cerrar plano"><X className="size-5" /></button>
          </div>
        </header>
        <PlanViewer key={typology.id} src={typology.planSrc} title={`Plano ${typology.code}`} fitViewport />
      </div>
    </dialog>
  );
}

function ComparePage({ project }: { project: Project }) {
  const [left, setLeft] = useState(project.typologies[0]?.id ?? "");
  const [right, setRight] = useState(project.typologies[1]?.id ?? "");
  const items = [project.typologies.find((item) => item.id === left), project.typologies.find((item) => item.id === right)].filter(Boolean) as Typology[];
  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Comparador" title="Comparar dos tipologías" />
      <div className="mb-5 flex flex-wrap gap-3">
        {[left, right].map((value, index) => (
          <select key={index} className="min-h-12 rounded-full border border-ink/10 bg-white px-4" value={value} onChange={(event) => (index === 0 ? setLeft(event.target.value) : setRight(event.target.value))}>
            {project.typologies.map((typology) => <option key={typology.id} value={typology.id}>{typology.code}</option>)}
          </select>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        {items.map((typology) => (
          <article key={typology.id} className="rounded border border-ink/10 bg-porcelain p-4">
            <h2 className="font-display text-5xl">{typology.code}</h2>
            <p className="my-4 text-ink/70">Comparación visual basada en las imágenes oficiales de cada plano.</p>
            <img className="h-[420px] w-full rounded bg-white object-contain" src={typology.planSrc} alt={`Plano ${typology.code}`} />
          </article>
        ))}
      </div>
    </section>
  );
}

function ContactPage({ project }: { project: Project }) {
  return (
    <section className="editorial-page">
      <div className="contact-layout">
        <div>
          <p className="eyebrow">Contacto</p>
          <h1 className="editorial-title">Informes {project.name}</h1>
          <p className="editorial-lead">Una conversación directa con el equipo comercial de Morada.</p>
        </div>
        <div className="contact-lines">
          <p><span>Proyecto</span>{project.name}</p>
          <p><span>Correo</span>informes@morada.pe</p>
          <p><span>Teléfono</span>(511) 300-6492</p>
          <p><span>WhatsApp</span>+51 990 930 808</p>
        </div>
      </div>
    </section>
  );
}

function GalleryStrip({ gallery, onOpenGallery }: { gallery?: { images: GalleryImage[]; title: string }; onOpenGallery: (value: { images: GalleryImage[]; index: number }) => void }) {
  if (!gallery) return null;
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {gallery.images.map((image, index) => (
        <button key={image.id} className="image-panel min-h-[320px]" onClick={() => onOpenGallery({ images: gallery.images, index })} type="button">
          <img src={image.src} alt={image.title} />
          <span className="absolute bottom-4 left-4 rounded-full bg-white/90 px-4 py-2 text-sm font-medium">{image.title}</span>
        </button>
      ))}
    </div>
  );
}

function PageHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text?: string }) {
  return (
    <header className="mb-8 max-w-4xl">
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="font-display text-5xl leading-tight md:text-7xl">{title}</h1>
      {text ? <p className="mt-4 max-w-3xl text-lg leading-relaxed text-ink/70">{text}</p> : null}
    </header>
  );
}

function getSection(project: Project, id: string) {
  return project.sections.find((section) => section.id === id) ?? { id, title: id, summary: "", order: 0, enabled: true };
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-ink/10 bg-porcelain p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-morada">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <p>
      <span>{label}</span>
      <strong>{value}</strong>
    </p>
  );
}

function InfoBlock({ title, items, compact }: { title: string; items: string[]; compact?: boolean }) {
  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">{title}</h2>
      <div className={`grid gap-2 ${compact ? "grid-cols-3" : "sm:grid-cols-2"}`}>
        {items.map((item) => (
          <p key={item} className="flex items-center gap-2 rounded bg-white/70 p-3 text-sm">
            <Check className="size-4 shrink-0 text-morada" /> {item}
          </p>
        ))}
      </div>
    </div>
  );
}
