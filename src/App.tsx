import { ArrowRight, ArrowUp, ArrowDown, Building2, Check, ChevronLeft, ChevronRight, Download, FileUp, Grid3X3, Lock, Plus, RotateCcw, Save, Search, Trash2, Upload, View, X } from "lucide-react";
import type { PointerEvent, ReactNode } from "react";
import { useRef, useState } from "react";
import { FloorPlanInteractive } from "./components/FloorPlanInteractive";
import { GalleryModal } from "./components/GalleryModal";
import { GlobalNav } from "./components/GlobalNav";
import { PlanViewer } from "./components/PlanViewer";
import { useProject } from "./context/ProjectContext";
import { bumpVersion, exportProjectJson, exportProjectZip, fileToDataUrl, formatBytes, importProjectZip, isAllowedAsset } from "./services/files";
import { resetProject } from "./services/db";
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
  const { project, loading, updateProject, reload, syncFromRemote } = useProject();
  const [view, setView] = useState<ViewKey>("home");
  const [selectedTypologyId, setSelectedTypologyId] = useState("a-1");
  const [gallery, setGallery] = useState<{ images: GalleryImage[]; index: number } | null>(null);
  const [poiFilter, setPoiFilter] = useState("Todos");
  const [virtualTourOpen, setVirtualTourOpen] = useState(false);

  const selectedTypology = project?.typologies.find((item) => item.id === selectedTypologyId) ?? project?.typologies[0];
  const navigate = (next: ViewKey) => {
    if (next === "location") setPoiFilter("Todos");
    setView(next);
  };

  if (loading || !project) {
    return <div className="grid min-h-screen place-items-center bg-paper text-ink">Cargando Pardo 664...</div>;
  }

  return (
    <main className="min-h-screen bg-paper pb-28 text-ink">
      <GlobalNav current={view} onNavigate={navigate} />
      {view === "home" && <Home project={project} onNavigate={navigate} />}
      {view === "menu" && <MenuPage onNavigate={navigate} />}
      {view === "about" && <AboutUsPage project={project} />}
      {view === "project" && <ProjectPage project={project} onOpenGallery={setGallery} />}
      {view === "architecture" && <ArchitecturePage project={project} onOpenGallery={setGallery} />}
      {view === "amenities" && <AmenitiesPage project={project} onOpenGallery={setGallery} />}
      {view === "interiors" && <InteriorsPage project={project} onOpenGallery={setGallery} />}
      {view === "location" && <LocationPage project={project} filter={poiFilter} setFilter={setPoiFilter} onOpenGallery={setGallery} />}
      {view === "departments" && <DepartmentsPage project={project} selectedTypologyId={selectedTypologyId} setSelectedTypologyId={setSelectedTypologyId} onNavigate={navigate} onOpenVirtualTour={() => setVirtualTourOpen(true)} />}
      {view === "floor" && (
        <FloorPage
          project={project}
          selectedTypologyId={selectedTypologyId}
          setSelectedTypologyId={setSelectedTypologyId}
          onNavigate={navigate}
        />
      )}
      {view === "typology" && selectedTypology && (
        <TypologyPage project={project} typology={selectedTypology} setSelectedTypologyId={setSelectedTypologyId} onNavigate={navigate} />
      )}
      {view === "compare" && <ComparePage project={project} />}
      {view === "contact" && <ContactPage project={project} />}
      {view === "admin" && <AdminPage project={project} updateProject={updateProject} reload={reload} syncFromRemote={syncFromRemote} />}
      {gallery ? <GalleryModal images={gallery.images} initialIndex={gallery.index} onClose={() => setGallery(null)} /> : null}
      {virtualTourOpen ? <VirtualTourModal project={project} onClose={() => setVirtualTourOpen(false)} /> : null}
    </main>
  );
}

type VirtualTourScene = {
  id: string;
  title: string;
  eyebrow: string;
  imageSrc: string;
  initialRotation: number;
  hotspots: Array<{
    id: string;
    label: string;
    targetId: string;
    x: number;
    y: number;
  }>;
};

function VirtualTourModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const fachada = project.galleries.find((item) => item.id === "fachada")?.images[0]?.src ?? project.galleries[0]?.images[0]?.src;
  const lobby = project.galleries.find((item) => item.id === "proyecto-fachada")?.images[1]?.src ?? fachada;
  const sala = project.galleries.find((item) => item.id === "interiores")?.images[0]?.src ?? fachada;
  const dormitorio = project.galleries.find((item) => item.id === "interiores")?.images[1]?.src ?? sala;
  const terraza = project.galleries.find((item) => item.id === "areas")?.images[0]?.src ?? fachada;

  const scenes: VirtualTourScene[] = [
    {
      id: "fachada",
      title: "Fachada",
      eyebrow: "Ingreso principal",
      imageSrc: fachada,
      initialRotation: 48,
      hotspots: [
        { id: "fachada-lobby", label: "Entrar al lobby", targetId: "lobby", x: 50, y: 58 },
        { id: "fachada-terraza", label: "Ver áreas comunes", targetId: "terraza", x: 72, y: 38 }
      ]
    },
    {
      id: "lobby",
      title: "Lobby",
      eyebrow: "Recepción",
      imageSrc: lobby,
      initialRotation: 42,
      hotspots: [
        { id: "lobby-sala", label: "Ir al departamento modelo", targetId: "sala", x: 62, y: 54 },
        { id: "lobby-fachada", label: "Volver a fachada", targetId: "fachada", x: 22, y: 64 }
      ]
    },
    {
      id: "sala",
      title: "Sala comedor",
      eyebrow: "Departamento modelo",
      imageSrc: sala,
      initialRotation: 36,
      hotspots: [
        { id: "sala-dormitorio", label: "Ver dormitorio", targetId: "dormitorio", x: 76, y: 50 },
        { id: "sala-lobby", label: "Volver al lobby", targetId: "lobby", x: 20, y: 58 }
      ]
    },
    {
      id: "dormitorio",
      title: "Dormitorio",
      eyebrow: "Ambiente privado",
      imageSrc: dormitorio,
      initialRotation: 58,
      hotspots: [
        { id: "dormitorio-sala", label: "Volver a sala", targetId: "sala", x: 18, y: 62 },
        { id: "dormitorio-terraza", label: "Ver terraza común", targetId: "terraza", x: 68, y: 44 }
      ]
    },
    {
      id: "terraza",
      title: "Áreas comunes",
      eyebrow: "Amenities",
      imageSrc: terraza,
      initialRotation: 50,
      hotspots: [
        { id: "terraza-sala", label: "Ver departamento modelo", targetId: "sala", x: 28, y: 58 },
        { id: "terraza-fachada", label: "Salir a fachada", targetId: "fachada", x: 72, y: 60 }
      ]
    }
  ];

  const [activeSceneId, setActiveSceneId] = useState(scenes[0].id);
  const activeScene = scenes.find((scene) => scene.id === activeSceneId) ?? scenes[0];
  const [rotation, setRotation] = useState(activeScene.initialRotation);
  const [dragStart, setDragStart] = useState<{ x: number; rotation: number } | null>(null);

  const moveToScene = (sceneId: string) => {
    const next = scenes.find((scene) => scene.id === sceneId) ?? scenes[0];
    setActiveSceneId(next.id);
    setRotation(next.initialRotation);
    setDragStart(null);
  };

  const rotate = (delta: number) => setRotation((current) => (current + delta + 100) % 100);
  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragStart({ x: event.clientX, rotation });
  };
  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragStart) return;
    const delta = (dragStart.x - event.clientX) / 8;
    setRotation((dragStart.rotation + delta + 100) % 100);
  };
  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDragStart(null);
  };

  return (
    <div className="virtual-tour-overlay" role="dialog" aria-modal="true" aria-label="Recorrido virtual">
      <button className="virtual-tour-backdrop" onClick={onClose} type="button" aria-label="Cerrar recorrido virtual" />
      <section className="virtual-tour-panel">
        <header>
          <div>
            <p className="eyebrow">Departamentos</p>
            <h2>Tour 360</h2>
          </div>
          <div className="flex gap-2">
            <button className="virtual-tour-close" onClick={onClose} type="button" aria-label="Cerrar">
              <X className="size-5" />
            </button>
          </div>
        </header>
        <div className="virtual-tour-body">
          <aside className="virtual-tour-scenes" aria-label="Ambientes del recorrido">
            {scenes.map((scene) => (
              <button
                key={scene.id}
                className={activeScene.id === scene.id ? "is-active" : ""}
                onClick={() => moveToScene(scene.id)}
                type="button"
              >
                <span>{scene.eyebrow}</span>
                <strong>{scene.title}</strong>
              </button>
            ))}
          </aside>
          <div
            className="virtual-tour-frame"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            style={{ backgroundImage: `url(${activeScene.imageSrc})`, backgroundPosition: `${rotation}% center` }}
            role="img"
            aria-label={`${activeScene.title} en tour 360`}
          >
            <div className="virtual-tour-shade" />
            <div className="virtual-tour-info">
              <span>{activeScene.eyebrow}</span>
              <strong>{activeScene.title}</strong>
            </div>
            <div className="virtual-tour-controls" aria-label="Controles de giro">
              <button onClick={() => rotate(-8)} type="button" aria-label="Girar a la izquierda">
                <ChevronLeft className="size-5" />
              </button>
              <button onClick={() => setRotation(activeScene.initialRotation)} type="button" aria-label="Centrar vista">
                <RotateCcw className="size-5" />
              </button>
              <button onClick={() => rotate(8)} type="button" aria-label="Girar a la derecha">
                <ChevronRight className="size-5" />
              </button>
            </div>
            {activeScene.hotspots.map((hotspot) => (
              <button
                key={hotspot.id}
                className="virtual-tour-hotspot"
                onClick={() => moveToScene(hotspot.targetId)}
                style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                type="button"
              >
                <span>{hotspot.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function Home({ project, onNavigate }: { project: Project; onNavigate: (view: ViewKey) => void }) {
  const hero = project.galleries.find((item) => item.id === "fachada")?.images[0]?.src;
  return (
    <section className="screen-section relative overflow-hidden bg-ink text-white">
      <img className="absolute inset-0 h-full w-full scale-[1.02] object-cover opacity-72 transition duration-700" src={hero} alt="Render principal Pardo 664" />
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
                <img src={images[0]?.src} alt="Pardo 664" />
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
                <h2 className="font-display text-4xl leading-tight md:text-6xl">Tres miradas a la arquitectura de Pardo 664.</h2>
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

function DepartmentsPage({ project, selectedTypologyId, setSelectedTypologyId, onNavigate, onOpenVirtualTour }: { project: Project; selectedTypologyId: string; setSelectedTypologyId: (id: string) => void; onNavigate: (view: ViewKey) => void; onOpenVirtualTour: () => void }) {
  const [bedrooms, setBedrooms] = useState("Todos");
  const [area, setArea] = useState("Todas");
  const typologies = project.typologies.filter((item) => item.active);
  const filtered = typologies.filter((item) => (bedrooms === "Todos" || item.bedrooms === Number(bedrooms)) && (area === "Todas" || (area === "60-65" ? item.areaM2 <= 65 : item.areaM2 > 65)));
  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Explorador" title="Departamentos y tipologías" />
      <div className="mb-5 flex flex-wrap gap-3">
        {["Todos", "1", "2", "3"].map((value) => (
          <button key={value} className={`pill ${bedrooms === value ? "pill-active" : ""}`} onClick={() => setBedrooms(value)} type="button">
            {value === "Todos" ? "Todos los dormitorios" : `${value} dorm.`}
          </button>
        ))}
        {["Todas", "60-65", "66+"].map((value) => (
          <button key={value} className={`pill ${area === value ? "pill-active" : ""}`} onClick={() => setArea(value)} type="button">
            {value === "Todas" ? "Todas las áreas" : value === "60-65" ? "60 a 65 m²" : "Más de 65 m²"}
          </button>
        ))}
        <button className="primary-touch ml-auto" onClick={() => onNavigate("floor")} type="button">
          Ver planta típica <Grid3X3 />
        </button>
        <button className="secondary-touch" onClick={onOpenVirtualTour} type="button">
          Recorrido virtual <View className="size-5" />
        </button>
        <button className="secondary-touch" onClick={() => onNavigate("compare")} type="button">
          Comparar <Search />
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {filtered.map((typology) => (
          <article key={typology.id} className={`rounded border bg-porcelain p-4 ${selectedTypologyId === typology.id ? "border-morada" : "border-ink/10"}`}>
            <img className="h-44 w-full rounded border border-ink/10 bg-white object-contain" src={typology.thumbnailSrc} alt={`Plano ${typology.code}`} />
          <div className="mt-4 flex items-start justify-between">
            <div>
              <h2 className="font-display text-4xl">{typology.code}</h2>
              <p className="text-ink/70">Plano en alta resolución</p>
            </div>
            <span className="rounded-full bg-morada/10 px-3 py-1 text-sm text-morada">{typology.format}</span>
          </div>
            <div className="mt-4 flex gap-2">
              <button className="primary-touch flex-1" onClick={() => { setSelectedTypologyId(typology.id); onNavigate("typology"); }} type="button">
                Ver plano
              </button>
              <button className="secondary-touch flex-1" onClick={() => { setSelectedTypologyId(typology.id); onNavigate("floor"); }} type="button">
                En planta
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function FloorPage({ project, selectedTypologyId, setSelectedTypologyId, onNavigate }: { project: Project; selectedTypologyId: string; setSelectedTypologyId: (id: string) => void; onNavigate: (view: ViewKey) => void }) {
  const typology = project.typologies.find((item) => item.id === selectedTypologyId);
  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Planta típica" title="Pisos 3 al 12" text="La planta típica exhibida corresponde a los pisos 3 al 12 y se muestra únicamente para fines ilustrativos." />
      <div className="grid gap-6 lg:grid-cols-[1fr_330px]">
        <FloorPlanInteractive floorPlan={project.floorPlan} typologies={project.typologies} selectedId={selectedTypologyId} onSelect={setSelectedTypologyId} />
        <aside className="rounded border border-ink/10 bg-porcelain p-5">
          {typology ? (
            <>
              <p className="text-sm uppercase tracking-[0.25em] text-morada">Seleccionado</p>
              <h2 className="mt-3 font-display text-6xl">{typology.code}</h2>
              <p className="mt-2 text-xl">Tipología activa en planta</p>
              <img className="mt-5 h-48 w-full rounded bg-white object-contain" src={typology.thumbnailSrc} alt={`Miniatura ${typology.code}`} />
              <button className="primary-touch mt-6 w-full" onClick={() => onNavigate("typology")} type="button">
                Ver plano <ArrowRight />
              </button>
            </>
          ) : null}
        </aside>
      </div>
    </section>
  );
}

function TypologyPage({ project, typology, setSelectedTypologyId, onNavigate }: { project: Project; typology: Typology; setSelectedTypologyId: (id: string) => void; onNavigate: (view: ViewKey) => void }) {
  const active = project.typologies.filter((item) => item.active);
  const index = active.findIndex((item) => item.id === typology.id);
  const move = (direction: number) => {
    const next = active[(index + direction + active.length) % active.length];
    setSelectedTypologyId(next.id);
  };
  return (
    <section className="page-wrap">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <PageHeading eyebrow="Detalle de tipología" title={`Tipología ${typology.code}`} text="La imagen del plano contiene la información técnica vigente." />
        <div className="flex gap-2">
          <button className="secondary-touch" onClick={() => move(-1)} type="button"><ChevronLeft /> Anterior</button>
          <button className="secondary-touch" onClick={() => move(1)} type="button">Siguiente <ChevronRight /></button>
          <button className="primary-touch" onClick={() => onNavigate("floor")} type="button">Regresar a planta</button>
        </div>
      </div>
      <div className="grid gap-6">
        <PlanViewer src={typology.planSrc} title={`Plano ${typology.code}`} />
      </div>
    </section>
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
          <h1 className="editorial-title">Informes Pardo 664</h1>
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

function AdminPage({ project, updateProject, reload, syncFromRemote }: { project: Project; updateProject: (updater: Project | ((project: Project) => Project)) => Promise<void>; reload: () => Promise<void>; syncFromRemote: () => Promise<Project | null> }) {
  const [pin, setPin] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [message, setMessage] = useState("");
  const [selected, setSelected] = useState(project.typologies[0]?.id ?? "");
  const typology = project.typologies.find((item) => item.id === selected);

  const publish = async (change: string) => {
    await updateProject((current) => bumpVersion({ ...current, lastPublishedSnapshot: current }, change));
    setMessage("Cambios publicados localmente.");
  };

  if (!unlocked) {
    return (
      <section className="page-wrap max-w-xl">
        <PageHeading eyebrow="Administrador local" title="Ingrese PIN" text="PIN inicial del MVP: 6640. Puede cambiarse en los datos locales más adelante." />
        <div className="rounded border border-ink/10 bg-porcelain p-6">
          <Lock className="mb-4 text-morada" />
          <input className="field" type="password" value={pin} onChange={(event) => setPin(event.target.value)} placeholder="PIN" />
          <button className="primary-touch mt-4 w-full" onClick={() => setUnlocked(pin === project.adminPin)} type="button">Entrar</button>
          {pin && pin !== project.adminPin ? <p className="mt-3 text-sm text-red-700">PIN incorrecto.</p> : null}
        </div>
      </section>
    );
  }

  return (
    <section className="page-wrap">
      <PageHeading eyebrow="Administrador local" title="Contenido, planos y respaldos" text={`Versión ${project.version.version} · Publicado ${project.version.publishedAt}`} />
      {message ? <p className="mb-4 rounded border border-morada/20 bg-morada/10 p-3 text-morada">{message}</p> : null}
      <div className="grid gap-6 xl:grid-cols-[1fr_0.85fr]">
        <div className="space-y-5">
          <AdminGeneral project={project} updateProject={updateProject} />
          <AdminAbout project={project} updateProject={updateProject} />
          <AdminEditorialContent project={project} updateProject={updateProject} />
          <AdminGalleries project={project} updateProject={updateProject} />
          <AdminLocation project={project} updateProject={updateProject} />
          <div className="rounded border border-ink/10 bg-porcelain p-5">
            <h2 className="section-title">Tipologías y planos</h2>
            <select className="field mb-4" value={selected} onChange={(event) => setSelected(event.target.value)}>
              {project.typologies.map((item) => <option key={item.id} value={item.id}>{item.code}</option>)}
            </select>
            {typology ? <AdminTypology typology={typology} updateProject={updateProject} /> : null}
          </div>
          <div className="rounded border border-ink/10 bg-porcelain p-5">
            <h2 className="section-title">Zonas clicables de planta típica</h2>
            <FloorPlanInteractive
              editable
              floorPlan={project.floorPlan}
              typologies={project.typologies}
              selectedId={selected}
              onSelect={setSelected}
              onHotspotChange={(hotspot) => updateProject((current) => ({ ...current, floorPlan: { ...current.floorPlan, hotspots: current.floorPlan.hotspots.map((item) => item.id === hotspot.id ? hotspot : item) } }))}
            />
          </div>
        </div>
        <aside className="space-y-5">
          <AdminFiles project={project} selectedTypologyId={selected} updateProject={updateProject} />
          <div className="rounded border border-ink/10 bg-porcelain p-5">
            <h2 className="section-title">Importación, exportación y respaldo</h2>
            <button className="primary-touch mb-3 w-full" onClick={async () => {
              try {
                await exportProjectZip(project);
                setMessage("ZIP generado. Revisa la carpeta Descargas.");
              } catch {
                setMessage("No se pudo generar el ZIP.");
              }
            }} type="button"><Download /> Exportar actualización</button>
            <button className="secondary-touch mb-3 w-full" onClick={async () => {
              try {
                setMessage("Generando project.json optimizado...");
                await exportProjectJson(project);
                setMessage("project.json generado. Revisa la carpeta Descargas.");
              } catch {
                setMessage("No se pudo generar project.json.");
              }
            }} type="button"><Download /> Descargar project.json para GitHub</button>
            <label className="secondary-touch mb-3 w-full cursor-pointer justify-center">
              <FileUp /> Importar actualización
              <input className="hidden" type="file" accept=".zip,application/zip" onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                try {
                  const imported = await importProjectZip(file);
                  if (confirm(`Importar versión ${imported.version.version}? Se reemplazarán los datos actuales.`)) {
                    await updateProject(imported);
                    setMessage("Actualización importada correctamente.");
                  }
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "No se pudo importar el ZIP.");
                }
              }} />
            </label>
            <button className="secondary-touch mb-3 w-full" onClick={async () => {
              try {
                const remote = await syncFromRemote();
                setMessage(remote ? `Contenido sincronizado desde GitHub. Versión ${remote.version.version}.` : "No hay una versión más nueva publicada en GitHub.");
              } catch (error) {
                setMessage(error instanceof Error ? error.message : "No se pudo sincronizar desde GitHub.");
              }
            }} type="button"><RotateCcw /> Sincronizar desde GitHub</button>
            <button className="secondary-touch mb-3 w-full" onClick={async () => publish("Se publicaron cambios desde el administrador local.")} type="button"><Save /> Publicar cambios</button>
            <button className="secondary-touch w-full" onClick={async () => {
              if (confirm("Restaurar la información inicial extraída del PDF?")) {
                await resetProject();
                await reload();
                setMessage("Contenido inicial restaurado.");
              }
            }} type="button"><RotateCcw /> Restaurar inicial</button>
          </div>
          <div className="rounded border border-ink/10 bg-porcelain p-5">
            <h2 className="section-title">Historial local</h2>
            <div className="space-y-3">
              {project.version.changes.map((change) => <p key={change.id} className="border-b border-ink/10 pb-2 text-sm"><strong>{change.date}</strong><br />{change.text}</p>)}
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

function AdminGeneral({ project, updateProject }: { project: Project; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const [logoStatus, setLogoStatus] = useState("");
  const setField = (field: keyof Project, value: string) => updateProject((current) => ({ ...current, [field]: value }));
  const replaceLogo = async (file: File) => {
    if (!isAllowedAsset(file) || file.type === "application/pdf") {
      setLogoStatus("Usa PNG, JPG o SVG para el logo.");
      return;
    }
    const logoSrc = await fileToDataUrl(file);
    await updateProject((current) => ({ ...current, logoSrc }));
    setLogoStatus(`${file.name} · ${formatBytes(file.size)} · logo actualizado`);
  };
  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">Información general</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label>Título<input className="field" value={project.name} onChange={(event) => setField("name", event.target.value)} /></label>
        <label>Distrito<input className="field" value={project.district} onChange={(event) => setField("district", event.target.value)} /></label>
        <label>Texto alternativo del logo<input className="field" value={project.logoText} onChange={(event) => setField("logoText", event.target.value)} /></label>
        <label>Arquitectos<input className="field" value={project.architect} onChange={(event) => setField("architect", event.target.value)} /></label>
        <label>Certificación<input className="field" value={project.certification} onChange={(event) => setField("certification", event.target.value)} /></label>
        <label className="md:col-span-2">Descripción<textarea className="field min-h-24" value={project.shortDescription} onChange={(event) => setField("shortDescription", event.target.value)} /></label>
      </div>
      <div className="mt-5 rounded border border-ink/10 bg-white p-4">
        <h3 className="mb-3 font-display text-2xl">Logo oficial de Morada</h3>
        <div className="grid gap-4 md:grid-cols-[260px_1fr]">
          <div className="grid min-h-24 place-items-center rounded bg-ink p-4">
            {project.logoSrc ? <img className="max-h-16 max-w-full object-contain" src={project.logoSrc} alt={project.logoText} /> : <p className="text-2xl font-bold tracking-tight text-white">{project.logoText}</p>}
          </div>
          <div>
            <p className="mb-3 text-sm text-ink/70">Formato sugerido: SVG o PNG transparente, ancho aproximado 600 px.</p>
            {logoStatus ? <p className="mb-3 text-sm text-morada">{logoStatus}</p> : null}
            <div className="flex flex-wrap gap-2">
              <label className="secondary-touch cursor-pointer">
                <Upload className="size-4" /> Reemplazar logo
                <input className="hidden" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void replaceLogo(file);
                  event.currentTarget.value = "";
                }} />
              </label>
              <button className="secondary-touch" onClick={() => updateProject((current) => ({ ...current, logoSrc: "" }))} type="button">
                <Trash2 className="size-4" /> Quitar logo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminAbout({ project, updateProject }: { project: Project; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const updateAbout = (patch: Partial<Project["about"]>) =>
    updateProject((current) => ({ ...current, about: { ...current.about, ...patch } }));
  const updateSlide = (id: string, patch: Partial<Project["about"]["slides"][number]>) =>
    updateProject((current) => ({
      ...current,
      about: {
        ...current.about,
        slides: current.about.slides.map((slide) => (slide.id === id ? { ...slide, ...patch } : slide))
      }
    }));
  const replaceSlideImage = async (id: string, file: File) => {
    if (!isAllowedAsset(file) || file.type === "application/pdf") return;
    const imageSrc = await fileToDataUrl(file);
    await updateSlide(id, { imageSrc });
  };
  const replaceCoverImage = async (file: File) => {
    if (!isAllowedAsset(file) || file.type === "application/pdf") return;
    const coverImageSrc = await fileToDataUrl(file);
    await updateAbout({ coverImageSrc });
  };
  const updateAboutProject = (id: string, patch: Partial<Project["about"]["projects"][number]>) =>
    updateProject((current) => ({
      ...current,
      about: {
        ...current.about,
        projects: current.about.projects.map((item) => (item.id === id ? { ...item, ...patch } : item))
      }
    }));
  const addAboutProject = () =>
    updateProject((current) => ({
      ...current,
      about: {
        ...current.about,
        projects: [
          ...current.about.projects,
          {
            id: `morada-project-${Date.now()}`,
            name: "Nuevo proyecto",
            year: String(new Date().getFullYear()),
            district: "Miraflores",
            imageSrc: current.about.projects[0]?.imageSrc ?? "",
            order: current.about.projects.length + 1
          }
        ]
      }
    }));
  const removeAboutProject = (id: string) =>
    updateProject((current) => ({
      ...current,
      about: {
        ...current.about,
        projects: current.about.projects.filter((item) => item.id !== id).map((item, index) => ({ ...item, order: index + 1 }))
      }
    }));
  const replaceAboutProjectImage = async (id: string, file: File) => {
    if (!isAllowedAsset(file) || file.type === "application/pdf") return;
    const imageSrc = await fileToDataUrl(file);
    await updateAboutProject(id, { imageSrc });
  };
  const sortedAboutProjects = [...(project.about.projects ?? [])].sort((a, b) => a.order - b.order);
  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">About us</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <label>Eyebrow<input className="field" value={project.about.eyebrow} onChange={(event) => updateAbout({ eyebrow: event.target.value })} /></label>
        <label className="md:col-span-2">Título<input className="field" value={project.about.title} onChange={(event) => updateAbout({ title: event.target.value })} /></label>
        <label className="md:col-span-3">Subtítulo<input className="field" value={project.about.subtitle} onChange={(event) => updateAbout({ subtitle: event.target.value })} /></label>
      </div>
      <div className="mt-5 rounded border border-ink/10 bg-white p-4">
        <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
          <div>
            <h3 className="font-display text-2xl">Imagen de portada</h3>
            <p className="mt-1 text-sm leading-relaxed text-ink/60">Se muestra en la primera pantalla de About us, junto al titular principal. Tamaño sugerido: 2400 x 1600 px en JPG o PNG.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <label className="secondary-touch cursor-pointer">
                <Upload className="size-4" /> Reemplazar imagen
                <input className="hidden" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void replaceCoverImage(file);
                  event.currentTarget.value = "";
                }} />
              </label>
              <button className="secondary-touch" onClick={() => updateAbout({ coverImageSrc: "" })} type="button">
                <Trash2 className="size-4" /> Quitar imagen
              </button>
            </div>
          </div>
          <div className="grid min-h-44 place-items-center rounded bg-paper">
            {project.about.coverImageSrc ? <img className="h-44 w-full rounded object-cover" src={project.about.coverImageSrc} alt="" /> : <span className="text-sm text-ink/50">Portada About us</span>}
          </div>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {project.about.slides.map((slide) => (
          <article key={slide.id} className="rounded border border-ink/10 bg-white p-4">
            <div className="grid gap-3 lg:grid-cols-[80px_1fr_260px]">
              <label>Número<input className="field" value={slide.number} onChange={(event) => updateSlide(slide.id, { number: event.target.value })} /></label>
              <label>Texto<textarea className="field min-h-32" value={slide.text} onChange={(event) => updateSlide(slide.id, { text: event.target.value })} /></label>
              <div>
                <div className="mb-3 grid min-h-32 place-items-center rounded bg-paper">
                  {slide.imageSrc ? <img className="h-32 w-full rounded object-cover" src={slide.imageSrc} alt="" /> : <span className="text-sm text-ink/50">Imagen lateral derecha</span>}
                </div>
                <label className="secondary-touch w-full cursor-pointer justify-center">
                  <Upload className="size-4" /> Reemplazar imagen
                  <input className="hidden" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void replaceSlideImage(slide.id, file);
                    event.currentTarget.value = "";
                  }} />
                </label>
                <button className="secondary-touch mt-2 w-full" onClick={() => updateSlide(slide.id, { imageSrc: "" })} type="button">
                  <Trash2 className="size-4" /> Quitar imagen
                </button>
              </div>
            </div>
            <label className="mt-3 block">Keywords destacadas
              <input
                className="field"
                value={slide.keywords.join(", ")}
                onChange={(event) => updateSlide(slide.id, { keywords: event.target.value.split(",").map((item) => item.trim()).filter(Boolean) })}
                placeholder="Separar por comas"
              />
            </label>
          </article>
        ))}
      </div>
      <div className="mt-5 rounded border border-ink/10 bg-white p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-display text-2xl">Proyectos</h3>
            <p className="mt-1 text-sm text-ink/60">Slide final de About us. La grilla y los filtros se actualizan según el distrito de cada proyecto.</p>
          </div>
          <button className="primary-touch" onClick={addAboutProject} type="button">
            <Plus className="size-4" /> Agregar proyecto
          </button>
        </div>
        <div className="space-y-3">
          {sortedAboutProjects.map((item) => (
            <article key={item.id} className="rounded border border-ink/10 bg-paper p-3">
              <div className="grid gap-3 lg:grid-cols-[160px_1fr_120px]">
                <div>
                  <div className="mb-2 grid h-32 place-items-center overflow-hidden rounded bg-white">
                    {item.imageSrc ? <img className="h-full w-full object-cover" src={item.imageSrc} alt="" /> : <span className="text-xs text-ink/40">Fachada</span>}
                  </div>
                  <label className="secondary-touch w-full cursor-pointer justify-center">
                    <Upload className="size-4" /> Fachada
                    <input className="hidden" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void replaceAboutProjectImage(item.id, file);
                      event.currentTarget.value = "";
                    }} />
                  </label>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <label>Nombre<input className="field" value={item.name} onChange={(event) => updateAboutProject(item.id, { name: event.target.value })} /></label>
                  <label>Año<input className="field" inputMode="numeric" value={item.year} onChange={(event) => updateAboutProject(item.id, { year: event.target.value })} /></label>
                  <label>Distrito
                    <select className="field" value={item.district} onChange={(event) => updateAboutProject(item.id, { district: event.target.value })}>
                      {["Miraflores", "San Isidro", "Barranco", "Surco"].map((district) => <option key={district} value={district}>{district}</option>)}
                    </select>
                  </label>
                  <label>Orden<input className="field" type="number" value={item.order} onChange={(event) => updateAboutProject(item.id, { order: Number(event.target.value) || 1 })} /></label>
                </div>
                <button className="secondary-touch self-end" onClick={() => removeAboutProject(item.id)} type="button">
                  <Trash2 className="size-4" /> Eliminar
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminEditorialContent({ project, updateProject }: { project: Project; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const updateList = (field: "sharedAreas" | "leedAttributes", value: string) =>
    updateProject((current) => ({
      ...current,
      [field]: value.split("\n").map((item) => item.trim()).filter(Boolean)
    }));

  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">Contenido editorial</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label>Frase de portada<input className="field" value={project.tagline} onChange={(event) => updateProject((current) => ({ ...current, tagline: event.target.value }))} /></label>
        <label>Dirección<input className="field" value={project.address} onChange={(event) => updateProject((current) => ({ ...current, address: event.target.value }))} /></label>
        <label>Rango de áreas<input className="field" value={project.areaRange} onChange={(event) => updateProject((current) => ({ ...current, areaRange: event.target.value }))} /></label>
        <label>Resumen tipologías<input className="field" value={project.typologySummary} onChange={(event) => updateProject((current) => ({ ...current, typologySummary: event.target.value }))} /></label>
        <label className="md:col-span-2">Áreas comunes<textarea className="field min-h-28" value={project.sharedAreas.join("\n")} onChange={(event) => updateList("sharedAreas", event.target.value)} /></label>
        <label className="md:col-span-2">Atributos sostenibles<textarea className="field min-h-24" value={project.leedAttributes.join("\n")} onChange={(event) => updateList("leedAttributes", event.target.value)} /></label>
      </div>
      <div className="mt-6 border-t border-ink/10 pt-5">
        <h3 className="mb-3 font-display text-2xl">Capítulos de la experiencia</h3>
        <div className="grid gap-3 md:grid-cols-2">
          {project.sections.map((section) => (
            <div key={section.id} className="rounded border border-ink/10 bg-white p-3">
              <input
                className="field mt-0"
                value={section.title}
                onChange={(event) =>
                  updateProject((current) => ({
                    ...current,
                    sections: current.sections.map((item) => (item.id === section.id ? { ...item, title: event.target.value } : item))
                  }))
                }
              />
              <textarea
                className="field min-h-20"
                value={section.summary}
                onChange={(event) =>
                  updateProject((current) => ({
                    ...current,
                    sections: current.sections.map((item) => (item.id === section.id ? { ...item, summary: event.target.value } : item))
                  }))
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminGalleries({ project, updateProject }: { project: Project; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const [status, setStatus] = useState("");

  const updateGalleryImage = (galleryId: string, imageId: string, patch: Partial<GalleryImage>) =>
    updateProject((current) => ({
      ...current,
      galleries: current.galleries.map((gallery) =>
        gallery.id === galleryId
          ? { ...gallery, images: gallery.images.map((image) => (image.id === imageId ? { ...image, ...patch } : image)) }
          : gallery
      )
    }));

  const replaceImage = async (galleryId: string, imageId: string, file: File) => {
    if (!isAllowedAsset(file) || file.type === "application/pdf") {
      setStatus("Usa PNG, JPG o SVG para galerías.");
      return;
    }
    const src = await fileToDataUrl(file);
    setStatus(`${file.name} · ${formatBytes(file.size)} · imagen actualizada`);
    await updateGalleryImage(galleryId, imageId, { src, updatedAt: new Date().toISOString() });
  };

  const addImage = async (galleryId: string, file: File) => {
    if (!isAllowedAsset(file) || file.type === "application/pdf") {
      setStatus("Usa PNG, JPG o SVG para galerías.");
      return;
    }
    const src = await fileToDataUrl(file);
    await updateProject((current) => ({
      ...current,
      galleries: current.galleries.map((gallery) =>
        gallery.id === galleryId
          ? {
              ...gallery,
              images: [
                ...gallery.images,
                {
                  id: crypto.randomUUID(),
                  title: file.name.replace(/\.[^.]+$/, ""),
                  src,
                  category: gallery.category,
                  updatedAt: new Date().toISOString()
                }
              ]
            }
          : gallery
      )
    }));
    setStatus(`${file.name} · ${formatBytes(file.size)} · imagen agregada`);
  };

  const addImages = async (galleryId: string, files: FileList | null) => {
    if (!files?.length) return;
    for (const file of Array.from(files)) {
      await addImage(galleryId, file);
    }
    setStatus(`${files.length} imagen(es) agregada(s) a ${galleryLabel(galleryId)}`);
  };

  const replaceGalleryWithImages = async (galleryId: string, files: FileList | null) => {
    if (!files?.length) return;
    const gallery = project.galleries.find((item) => item.id === galleryId);
    if (!gallery) return;
    const images: GalleryImage[] = [];
    for (const file of Array.from(files)) {
      if (!isAllowedAsset(file) || file.type === "application/pdf") {
        setStatus("Usa PNG, JPG o SVG para galerías.");
        return;
      }
      images.push({
        id: crypto.randomUUID(),
        title: file.name.replace(/\.[^.]+$/, ""),
        src: await fileToDataUrl(file),
        category: gallery.category,
        updatedAt: new Date().toISOString()
      });
    }
    await updateProject((current) => ({
      ...current,
      galleries: current.galleries.map((item) => (item.id === galleryId ? { ...item, images } : item))
    }));
    setStatus(`${galleryLabel(galleryId)} reemplazada con ${images.length} imagen(es).`);
  };

  const orderedGalleries = [...project.galleries].sort((a, b) => {
    const order = ["proyecto-fachada", "fachada", "arquitectura", "areas", "interiores", "barrio"];
    const aIndex = order.includes(a.id) ? order.indexOf(a.id) : 999;
    const bIndex = order.includes(b.id) ? order.indexOf(b.id) : 999;
    return aIndex - bIndex;
  });

  const removeImage = (galleryId: string, imageId: string) =>
    updateProject((current) => ({
      ...current,
      galleries: current.galleries.map((gallery) =>
        gallery.id === galleryId ? { ...gallery, images: gallery.images.filter((image) => image.id !== imageId) } : gallery
      )
    }));

  const moveImage = (galleryId: string, imageId: string, direction: number) =>
    updateProject((current) => ({
      ...current,
      galleries: current.galleries.map((gallery) => {
        if (gallery.id !== galleryId) return gallery;
        const index = gallery.images.findIndex((image) => image.id === imageId);
        const nextIndex = index + direction;
        if (index < 0 || nextIndex < 0 || nextIndex >= gallery.images.length) return gallery;
        const images = [...gallery.images];
        const [image] = images.splice(index, 1);
        images.splice(nextIndex, 0, image);
        return { ...gallery, images };
      })
    }));

  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">Fotos y galerías</h2>
      {status ? <p className="mb-4 rounded bg-white p-3 text-sm text-ink/70">{status}</p> : null}
      <div className="mb-5 grid gap-3 md:grid-cols-3">
        <label className="flex min-h-24 cursor-pointer flex-col justify-center rounded border border-morada/20 bg-white p-4 text-morada">
          <span className="mb-2 flex items-center gap-2 font-semibold"><Plus className="size-4" /> Agregar imágenes a Proyecto/Fachada</span>
          <span className="text-sm text-ink/70">{imageSizeRecommendation("proyecto-fachada")}</span>
          <input className="hidden" type="file" multiple accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
            void addImages("proyecto-fachada", event.currentTarget.files);
            event.currentTarget.value = "";
          }} />
        </label>
        <label className="flex min-h-24 cursor-pointer flex-col justify-center rounded border border-morada/20 bg-white p-4 text-morada">
          <span className="mb-2 flex items-center gap-2 font-semibold"><Plus className="size-4" /> Agregar imágenes a Interiores</span>
          <span className="text-sm text-ink/70">{imageSizeRecommendation("interiores")}</span>
          <input className="hidden" type="file" multiple accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
            void addImages("interiores", event.currentTarget.files);
            event.currentTarget.value = "";
          }} />
        </label>
        <label className="flex min-h-24 cursor-pointer flex-col justify-center rounded border border-morada/20 bg-white p-4 text-morada">
          <span className="mb-2 flex items-center gap-2 font-semibold"><Plus className="size-4" /> Agregar imágenes a Áreas comunes</span>
          <span className="text-sm text-ink/70">{imageSizeRecommendation("areas")}</span>
          <input className="hidden" type="file" multiple accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
            void addImages("areas", event.currentTarget.files);
            event.currentTarget.value = "";
          }} />
        </label>
      </div>
      <div className="space-y-6">
        {orderedGalleries.map((gallery) => (
          <section key={gallery.id} className="border-t border-ink/10 pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="eyebrow mb-1">{gallery.category}</p>
                <input
                  className="field mt-0 max-w-md"
                  value={gallery.title}
                  onChange={(event) =>
                    updateProject((current) => ({
                      ...current,
                      galleries: current.galleries.map((item) => (item.id === gallery.id ? { ...item, title: event.target.value } : item))
                    }))
                  }
                />
                <p className="text-sm text-ink/70">{gallery.images.length} imagen(es)</p>
                {gallery.id === "proyecto-fachada" ? (
                  <p className="mt-2 text-sm font-semibold text-ink">
                    Actualmente Proyecto muestra: {gallery.images.slice(0, 3).map((image) => image.title).join(" · ") || "sin imágenes"}
                  </p>
                ) : null}
                <p className="mt-2 max-w-2xl rounded bg-white px-3 py-2 text-sm text-ink/70">
                  Tamaño sugerido: {imageSizeRecommendation(gallery.id)}
                </p>
                {galleryUsageNote(gallery.id) ? (
                  <p className="mt-2 max-w-2xl rounded bg-morada/10 px-3 py-2 text-sm text-morada">
                    {galleryUsageNote(gallery.id)}
                  </p>
                ) : null}
              </div>
              <label className="secondary-touch cursor-pointer">
                <Plus className="size-4" /> Agregar foto
                <input className="hidden" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void addImage(gallery.id, file);
                  event.currentTarget.value = "";
                }} />
              </label>
              {gallery.id === "proyecto-fachada" ? (
                <label className="secondary-touch cursor-pointer">
                  <Upload className="size-4" /> Vaciar y reemplazar
                  <input className="hidden" type="file" multiple accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
                    void replaceGalleryWithImages(gallery.id, event.currentTarget.files);
                    event.currentTarget.value = "";
                  }} />
                </label>
              ) : null}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {gallery.images.map((image, index) => (
                <article key={image.id} className="grid gap-3 rounded border border-ink/10 bg-white p-3 md:grid-cols-[140px_1fr]">
                  <img className="h-32 w-full rounded object-cover" src={image.src} alt={image.title} />
                  <div className="space-y-2">
                    <input className="field mt-0" value={image.title} onChange={(event) => updateGalleryImage(gallery.id, image.id, { title: event.target.value })} />
                    <textarea className="field min-h-20" value={image.description ?? ""} placeholder="Descripción opcional" onChange={(event) => updateGalleryImage(gallery.id, image.id, { description: event.target.value })} />
                    <div className="flex flex-wrap gap-2">
                      <button className="secondary-touch" onClick={() => moveImage(gallery.id, image.id, -1)} disabled={index === 0} type="button">
                        <ArrowUp className="size-4" /> Subir
                      </button>
                      <button className="secondary-touch" onClick={() => moveImage(gallery.id, image.id, 1)} disabled={index === gallery.images.length - 1} type="button">
                        <ArrowDown className="size-4" /> Bajar
                      </button>
                      <label className="secondary-touch cursor-pointer">
                        <Upload className="size-4" /> Reemplazar
                        <input className="hidden" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void replaceImage(gallery.id, image.id, file);
                          event.currentTarget.value = "";
                        }} />
                      </label>
                      <button className="secondary-touch" onClick={() => confirm("Eliminar esta imagen?") && void removeImage(gallery.id, image.id)} type="button">
                        <Trash2 className="size-4" /> Quitar
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function AdminLocation({ project, updateProject }: { project: Project; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const [status, setStatus] = useState("");
  const [selectedPoiId, setSelectedPoiId] = useState(project.pointsOfInterest[0]?.id ?? "");
  const mapFrameRef = useRef<HTMLDivElement | null>(null);
  const categories: Array<Project["pointsOfInterest"][number]["category"]> = ["Gastronomía", "Parques", "Educación", "Tiendas"];
  const barrioGallery = project.galleries.find((gallery) => gallery.id === "barrio");
  const mapImage = barrioGallery?.images[0];
  const sortedPois = [...project.pointsOfInterest].sort((a, b) => a.order - b.order);
  const selectedPoi = sortedPois.find((poi) => poi.id === selectedPoiId) ?? sortedPois[0];

  const replaceMap = async (file: File) => {
    if (!isAllowedAsset(file) || file.type === "application/pdf") {
      setStatus("Usa PNG, JPG o SVG para el mapa.");
      return;
    }
    const src = await fileToDataUrl(file);
    await updateProject((current) => ({
      ...current,
      galleries: current.galleries.map((gallery) =>
        gallery.id === "barrio"
          ? { ...gallery, images: gallery.images.map((image, index) => (index === 0 ? { ...image, src, updatedAt: new Date().toISOString() } : image)) }
          : gallery
      )
    }));
    setStatus(`${file.name} · ${formatBytes(file.size)} · mapa actualizado`);
  };

  const updatePoi = (id: string, patch: Partial<Project["pointsOfInterest"][number]>) =>
    updateProject((current) => ({
      ...current,
      pointsOfInterest: current.pointsOfInterest.map((poi) => (poi.id === id ? { ...poi, ...patch } : poi))
    }));

  const addPoi = () => {
    const id = crypto.randomUUID();
    setSelectedPoiId(id);
    updateProject((current) => ({
      ...current,
      pointsOfInterest: [...current.pointsOfInterest, { id, name: "Nuevo punto", category: "Gastronomía", x: 50, y: 50, visible: true, order: current.pointsOfInterest.length + 1 }]
    }));
  };

  const placeSelectedPoi = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedPoi) return;
    const frame = mapFrameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    const x = Math.min(100, Math.max(0, ((event.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((event.clientY - rect.top) / rect.height) * 100));
    void updatePoi(selectedPoi.id, { x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) });
  };

  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">Ubicación y mapa</h2>
      {status ? <p className="mb-4 rounded bg-white p-3 text-sm text-ink/70">{status}</p> : null}
      <div className="grid gap-5 lg:grid-cols-[520px_1fr]">
        <div>
          {mapImage ? (
            <div className="admin-location-map mb-3">
              <div ref={mapFrameRef} className="location-map-frame" onPointerDown={placeSelectedPoi}>
                <img className="h-full w-full object-contain" src={mapImage.src} alt={mapImage.title} />
                {sortedPois.map((poi) => (
                  <button
                    key={poi.id}
                    className={`admin-poi-marker ${selectedPoi?.id === poi.id ? "is-active" : ""} ${poi.visible ? "" : "is-muted"}`}
                    style={{ left: `${poi.x}%`, top: `${poi.y}%` }}
                    onPointerDown={(event) => {
                      event.stopPropagation();
                      setSelectedPoiId(poi.id);
                    }}
                    type="button"
                    aria-label={`Seleccionar ${poi.name}`}
                  >
                    <span>{poi.order}</span>
                    <em>{poi.name}</em>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <p className="mb-3 rounded bg-white px-3 py-2 text-sm text-ink/70">
            Punto seleccionado: <strong>{selectedPoi?.order}. {selectedPoi?.name}</strong>. Toca el mapa para moverlo.
          </p>
          <p className="mb-3 rounded bg-white px-3 py-2 text-sm text-ink/70">
            Tamaño sugerido: {imageSizeRecommendation("barrio")}
          </p>
          <label className="secondary-touch w-full cursor-pointer justify-center">
            <Upload className="size-4" /> Reemplazar mapa
            <input className="hidden" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void replaceMap(file);
              event.currentTarget.value = "";
            }} />
          </label>
          <button className="primary-touch mt-3 w-full" onClick={addPoi} type="button">
            <Plus className="size-4" /> Agregar punto
          </button>
        </div>
        <div className="space-y-2">
          {sortedPois.map((poi) => (
            <div key={poi.id} className={`admin-poi-row ${selectedPoi?.id === poi.id ? "is-active" : ""}`}>
              <button className="admin-poi-select" onClick={() => setSelectedPoiId(poi.id)} type="button" aria-label={`Seleccionar ${poi.name}`}>
                {poi.order}
              </button>
              <label className="text-xs">Nombre del lugar
                <input className="field" value={poi.name} onFocus={() => setSelectedPoiId(poi.id)} onChange={(event) => updatePoi(poi.id, { name: event.target.value })} />
              </label>
              <label className="text-xs">Categoría
                <select className="field" value={poi.category} onFocus={() => setSelectedPoiId(poi.id)} onChange={(event) => updatePoi(poi.id, { category: event.target.value as typeof poi.category })}>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="text-xs">X %
                <input className="field" type="number" min="0" max="100" value={poi.x} onFocus={() => setSelectedPoiId(poi.id)} onChange={(event) => updatePoi(poi.id, { x: Number(event.target.value) })} />
              </label>
              <label className="text-xs">Y %
                <input className="field" type="number" min="0" max="100" value={poi.y} onFocus={() => setSelectedPoiId(poi.id)} onChange={(event) => updatePoi(poi.id, { y: Number(event.target.value) })} />
              </label>
              <label className="flex items-center gap-2 self-end pb-3 text-xs"><input type="checkbox" checked={poi.visible} onFocus={() => setSelectedPoiId(poi.id)} onChange={(event) => updatePoi(poi.id, { visible: event.target.checked })} /> Visible</label>
              <button className="icon-button self-end" onClick={() => confirm("Eliminar punto?") && void updateProject((current) => ({ ...current, pointsOfInterest: current.pointsOfInterest.filter((item) => item.id !== poi.id) }))} type="button" aria-label="Eliminar punto">
                <Trash2 className="size-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AdminTypology({ typology, updateProject }: { typology: Typology; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const [fileInfo, setFileInfo] = useState("");
  const update = (patch: Partial<Typology>) => updateProject((project) => ({ ...project, typologies: project.typologies.map((item) => item.id === typology.id ? { ...item, ...patch } : item) }));
  const replacePlan = async (file: File) => {
    if (!isAllowedAsset(file) || file.type === "application/pdf") {
      setFileInfo("Usa PNG, JPG o SVG para el plano de la tipología.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setFileInfo(`${file.name} · ${formatBytes(file.size)} · vista previa actualizada`);
    await update({ planSrc: dataUrl, thumbnailSrc: dataUrl, updatedAt: new Date().toISOString() });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
      <img className="h-80 w-full rounded bg-white object-contain" src={typology.planSrc} alt={`Plano ${typology.code}`} />
      <div className="space-y-3">
        <label>Código<input className="field" value={typology.code} onChange={(event) => update({ code: event.target.value })} /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={typology.active} onChange={(event) => update({ active: event.target.checked })} /> Tipología activa</label>
        <p className="rounded bg-white px-3 py-2 text-sm text-ink/70">
          Tamaño sugerido: {imageSizeRecommendation("plano")}
        </p>
        <label className="secondary-touch w-full cursor-pointer justify-center">
          <Upload className="size-4" /> Reemplazar plano
          <input className="hidden" type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void replacePlan(file);
            event.currentTarget.value = "";
          }} />
        </label>
        <p className="text-sm text-ink/70">La imagen del plano es la única fuente de información técnica para esta tipología. La miniatura se actualiza automáticamente.</p>
        {fileInfo ? <p className="rounded bg-white p-3 text-sm text-ink/70">{fileInfo}</p> : null}
      </div>
    </div>
  );
}

function AdminFiles({ project, selectedTypologyId, updateProject }: { project: Project; selectedTypologyId: string; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const [fileInfo, setFileInfo] = useState("");
  const replaceFloorPlan = async (file: File) => {
    if (!isAllowedAsset(file) || file.type === "application/pdf") {
      setFileInfo("Usa PNG, JPG o SVG para la planta típica.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setFileInfo(`${file.name} · ${formatBytes(file.size)} · planta típica actualizada`);
    await updateProject((project) => ({
      ...project,
      floorPlan: { ...project.floorPlan, imageSrc: dataUrl, updatedAt: new Date().toISOString() },
      typologies: project.typologies.map((item) => ({ ...item, floorThumbnailSrc: dataUrl }))
    }));
  };
  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">Planta típica</h2>
      <img className="mb-3 h-56 w-full rounded bg-white object-contain" src={project.floorPlan.imageSrc} alt={project.floorPlan.title} />
      <p className="mb-3 rounded bg-white px-3 py-2 text-sm text-ink/70">
        Tamaño sugerido: {imageSizeRecommendation("planta")}
      </p>
      <label className="field mb-3 block cursor-pointer text-center">
        <Upload className="mx-auto mb-2" /> Reemplazar planta típica
        <input className="hidden" type="file" accept="image/png,image/jpeg,image/svg+xml,application/pdf" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void replaceFloorPlan(file);
          event.currentTarget.value = "";
        }} />
      </label>
      <p className="text-sm text-ink/70">La planta típica se actualiza en el explorador, miniaturas de ubicación y herramienta de zonas clicables.</p>
      {fileInfo ? <p className="mt-3 rounded bg-white p-3 text-sm">{fileInfo}</p> : null}
    </div>
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

function imageSizeRecommendation(id: string) {
  const recommendations: Record<string, string> = {
    fachada: "Hero/portada: 2880 x 1800 px, JPG/WebP horizontal, menos de 2.5 MB si es posible.",
    "proyecto-fachada": "Proyecto/Fachada: 2880 x 1800 px o 3000 x 2000 px, horizontal, imagen arquitectónica limpia.",
    arquitectura: "Arquitectura: 2400 x 1600 px, JPG horizontal, buen foco en personas o fachada.",
    interiores: "Interiores parallax: 2560 x 1700 px o 3000 x 2000 px, horizontal, sin textos incrustados.",
    areas: "Áreas comunes parallax: 2560 x 1700 px o 3000 x 2000 px, horizontal, imagen limpia y luminosa.",
    barrio: "Mapa/ubicación: 2400 x 1600 px en PNG o SVG; mantener nombres legibles en tablet.",
    plano: "Plano de tipología: 3000 x 2200 px o superior, PNG/JPG nítido; toda la ficha técnica debe venir dentro de la imagen.",
    planta: "Planta típica: 3000 x 2000 px o superior, PNG/JPG nítido; dejar margen para zonas táctiles."
  };
  return recommendations[id] ?? "Imagen editorial: mínimo 2400 px de ancho, horizontal, JPG/PNG/SVG.";
}

function galleryUsageNote(id: string) {
  const notes: Record<string, string> = {
    "proyecto-fachada": "Proyecto usa automáticamente las primeras 3 imágenes de esta galería. Reordénalas con Subir/Bajar para cambiar esa sección.",
    arquitectura: "Proyecto usa automáticamente la primera imagen de esta galería para el bloque de Arquitectos.",
    fachada: "La primera imagen se usa como portada principal y hero del Proyecto.",
    interiores: "Todas las imágenes se muestran como capítulos grandes en Interiores.",
    areas: "Todas las imágenes se muestran como capítulos grandes en Áreas comunes."
  };
  return notes[id];
}

function galleryLabel(id: string) {
  const labels: Record<string, string> = {
    "proyecto-fachada": "Proyecto/Fachada",
    interiores: "Interiores",
    areas: "Áreas comunes"
  };
  return labels[id] ?? id;
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
