import { ArrowDown, ArrowLeft, ArrowUp, Armchair, Building2, Download, Eye, FileUp, GripVertical, Home, Info, Lock, MapPin, Plus, RotateCcw, Save, Settings, Sparkles, Trash2, Trees, Upload } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminLocation } from "./location/AdminLocation";
import { FloorPlanInteractive } from "./FloorPlanInteractive";
import { useProject } from "../context/ProjectContext";
import { bumpVersion, exportProjectJson, exportProjectZip, fetchRemoteProject, fileToDataUrl, formatBytes, importProjectZip, isAllowedAsset } from "../services/files";
import { initialProject } from "../data/initialProject";
import type { Gallery, GalleryImage, GeneralPlan, Hotspot, Project, Typology, ViewKey } from "../types/project";
import "../styles/admin.css";

const tabs = [
  { id: "home", label: "Inicio", icon: Home, galleries: ["fachada"] },
  { id: "about", label: "About us", icon: Info, galleries: [] },
  { id: "project", label: "Proyecto", icon: Sparkles, galleries: ["proyecto-fachada", "arquitectura"] },
  { id: "location", label: "Ubicación", icon: MapPin, galleries: ["barrio"] },
  { id: "amenities", label: "Áreas comunes", icon: Trees, galleries: ["areas"] },
  { id: "interiors", label: "Interiores", icon: Armchair, galleries: ["interiores"] },
  { id: "departments", label: "Departamentos", icon: Building2, galleries: [] },
  { id: "settings", label: "Configuración", icon: Settings, galleries: [] }
] as const;

type AdminTab = typeof tabs[number]["id"];
type EditProject = (updater: (current: Project) => Project) => Promise<void>;
const assignedGalleries = new Set<string>(tabs.flatMap((item) => [...item.galleries] as string[]));
const sectionIds = ["project", "architecture", "location", "amenities", "interiors"];

export function AdminPage({ project, onExit, onPreview }: { project: Project; onExit: () => void; onPreview: (view: ViewKey, locationScreen?: "story" | "map") => void }) {
  const { updateProject, saveStatus, syncFromRemote } = useProject();
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [active, setActive] = useState<AdminTab>("home");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [remoteVersion, setRemoteVersion] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  const tab = tabs.find((item) => item.id === active)!;
  const galleryIds = active === "settings"
    ? project.galleries.filter((item) => !assignedGalleries.has(item.id)).map((item) => item.id)
    : active === "location" ? [] : tab.galleries;
  const sections = active === "location" ? [] : active === "settings" ? project.sections.filter((item) => !sectionIds.includes(item.id)).map((item) => item.id)
    : active === "project" ? ["project", "architecture"] : sectionIds.includes(active) ? [active] : [];

  useEffect(() => {
    const refreshConnection = () => setOnline(navigator.onLine);
    window.addEventListener("online", refreshConnection);
    window.addEventListener("offline", refreshConnection);
    return () => {
      window.removeEventListener("online", refreshConnection);
      window.removeEventListener("offline", refreshConnection);
    };
  }, []);

  useEffect(() => {
    if (!unlocked || !online || active !== "settings") return;
    let mounted = true;
    void fetchRemoteProject().then((remote) => {
      if (mounted && remote) setRemoteVersion(remote.version.version);
    }).catch(() => undefined);
    return () => { mounted = false; };
  }, [unlocked, online, active]);

  const edit: EditProject = async (updater) => {
    try {
      await updateProject(updater);
    } catch {
      setMessage("No se pudo guardar. Reintenta antes de salir.");
    }
  };

  async function run(action: () => Promise<string>) {
    setMessage("");
    setBusy(true);
    try {
      setMessage(await action());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "No se pudo completar la operación.");
    } finally {
      setBusy(false);
    }
  }

  if (!unlocked) {
    return (
      <section className="admin-login">
        <form onSubmit={(event) => {
          event.preventDefault();
          setUnlocked(pin === project.adminPin);
          setPinError(pin !== project.adminPin);
        }}>
          <Lock className="mb-4 text-morada" />
          <h1>Administrador local</h1>
          <label>PIN del administrador
            <input className="field" type="password" inputMode="numeric" value={pin} onChange={(event) => {
              setPin(event.target.value);
              setPinError(false);
            }} aria-invalid={pinError} required />
          </label>
          {pinError && <p role="alert" className="text-sm text-red-700">PIN incorrecto.</p>}
          <button className="primary-touch mt-4 w-full" type="submit">Entrar</button>
          <button className="secondary-touch mt-2 w-full" type="button" onClick={onExit}>Volver a la presentación</button>
        </form>
      </section>
    );
  }

  return (
    <section className="admin-shell">
      <aside className="admin-sidebar">
        <div className="admin-brand"><strong>{project.logoText}</strong><span>Administrador local</span></div>
        <nav aria-label="Secciones de edición">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button" aria-current={active === id ? "page" : undefined} onClick={() => { setActive(id); setMessage(""); }}>
              <Icon size={18} aria-hidden="true" /> {label}
            </button>
          ))}
        </nav>
        <button className="admin-exit" type="button" onClick={onExit} disabled={busy || saveStatus === "saving"}><ArrowLeft size={18} /> Presentación</button>
      </aside>

      <div className="admin-workspace">
        <header className="admin-toolbar">
          <div>
            <h1>{tab.label}</h1>
            <p className="admin-status" role="status">
              <span data-state={saveStatus}>{saveStatus === "saving" ? "Guardando…" : saveStatus === "error" ? "Error al guardar" : project.localDraft ? "Borrador guardado en este dispositivo" : "Contenido local al día"}</span>
              {project.localDraft && <span>Pendiente de publicación local</span>}
            </p>
          </div>
          <div className="admin-actions">
            {active !== "settings" && active !== "location" && <button className="secondary-touch" type="button" onClick={() => onPreview(active)}><Eye size={17} /> Vista previa</button>}
            {saveStatus === "error" && <button className="secondary-touch" type="button" onClick={() => void run(async () => {
              await updateProject((current) => current, project.localDraft ? "edit" : "publish");
              return "Contenido guardado en este dispositivo.";
            })}>Reintentar guardado</button>}
            <button className="primary-touch" type="button" disabled={busy || saveStatus === "saving" || !project.localDraft} onClick={() => void run(async () => {
              await updateProject((current) => bumpVersion(current, "Se publicaron cambios desde el administrador local."), "publish");
              return "Versión publicada en este dispositivo.";
            })}><Save size={17} /> Publicar localmente</button>
          </div>
        </header>
        {message && <p role="status" className="admin-notice">{message}</p>}
        <fieldset disabled={busy} className="admin-editors" key={active} aria-label={tab.label}>
          {active === "home" && <AdminGeneral project={project} updateProject={edit} />}
          {active === "about" && <AdminAbout project={project} updateProject={edit} />}
          {active === "project" && <AdminText project={project} updateProject={edit} fields={["architect", "certification", "district", "areaRange"]} />}
          {active === "amenities" && <AdminText project={project} updateProject={edit} fields={["sharedAreas"]} />}
          <AdminSections project={project} updateProject={edit} ids={sections} />
          {active === "location" && <AdminLocation project={project} updateProject={edit} onPreview={(screen) => onPreview("location", screen)} />}
          {active === "departments" && <AdminDepartments project={project} updateProject={edit} />}
          {galleryIds.length > 0 && <AdminGalleries project={project} updateProject={edit} ids={galleryIds} />}
          {active === "settings" && (
            <>
              <AdminText project={project} updateProject={edit} fields={["typologySummary", "leedAttributes"]} />
              <section className="admin-card">
                <h2>Publicación y respaldos</h2>
                <dl className="admin-versions">
                  <div><dt>Publicación local</dt><dd>v{project.version.version} · {project.version.publishedAt}</dd></div>
                  <div><dt>Última versión consultada de GitHub</dt><dd>{remoteVersion ? `v${remoteVersion}` : "Sin consultar"}{!online && " · Sin conexión"}</dd></div>
                </dl>
                {project.localDraft && <p className="mb-3 text-sm text-ink/70">El borrador conserva el número de la última publicación local. Publícalo localmente si necesitas un número de versión nuevo para GitHub.</p>}
                <p className="mb-4 text-sm text-ink/70">Para publicar en GitHub Pages, reemplaza <code>public/content/project.json</code> en el repositorio con el archivo descargado y sube el cambio a <code>main</code>.</p>
                <div className="admin-actions">
                  <button className="secondary-touch" type="button" disabled={saveStatus === "saving"} onClick={() => void run(async () => {
                    await exportProjectJson(project);
                    return "project.json descargado.";
                  })}><Download size={17} /> Descargar project.json</button>
                  <button className="secondary-touch" type="button" onClick={() => void run(async () => {
                    await exportProjectZip(project);
                    return "Respaldo ZIP descargado.";
                  })}><Download size={17} /> Exportar ZIP</button>
                  <label className="secondary-touch admin-file-action">
                    <FileUp size={17} /> Importar ZIP
                    <input type="file" accept=".zip,application/zip" onChange={(event) => {
                      const file = event.currentTarget.files?.[0];
                      event.currentTarget.value = "";
                      if (!file) return;
                      void run(async () => {
                        const imported = await importProjectZip(file);
                        if (!confirm(`¿Reemplazar el contenido local con la versión ${imported.version.version}?`)) return "";
                        await updateProject(imported, "replace");
                        return "Actualización importada.";
                      });
                    }} />
                  </label>
                  <button className="secondary-touch" type="button" disabled={!online} onClick={() => {
                    if (project.localDraft && !confirm("Si hay una versión más reciente en GitHub, se reemplazará el borrador local. ¿Continuar?")) return;
                    void run(async () => {
                      const remote = await syncFromRemote(true);
                      if (remote) setRemoteVersion(remote.version.version);
                      return remote ? `Versión ${remote.version.version} sincronizada desde GitHub.` : "No se aplicó una versión más reciente.";
                    });
                  }}><RotateCcw size={17} /> Sincronizar desde GitHub</button>
                  <button className="secondary-touch" type="button" onClick={() => {
                    if (!confirm("¿Restaurar el contenido inicial del proyecto?")) return;
                    void run(async () => {
                      await updateProject(initialProject, "replace");
                      return "Contenido inicial restaurado.";
                    });
                  }}><RotateCcw size={17} /> Restaurar inicial</button>
                </div>
              </section>
              <section className="admin-card">
                <h2>Historial local</h2>
                {project.version.changes.map((change) => <p key={change.id} className="border-b border-ink/10 py-2 text-sm"><time>{change.date}</time> · {change.text}</p>)}
              </section>
            </>
          )}
        </fieldset>
      </div>
    </section>
  );
}

const textLabels = {
  architect: "Arquitectos",
  certification: "Certificación",
  district: "Distrito",
  areaRange: "Rango de áreas",
  address: "Dirección",
  sharedAreas: "Áreas comunes",
  typologySummary: "Resumen de tipologías",
  leedAttributes: "Atributos sostenibles"
};

function AdminText({ project, updateProject, fields }: { project: Project; updateProject: EditProject; fields: Array<keyof typeof textLabels> }) {
  return (
    <section className="admin-card">
      <h2>{fields.includes("typologySummary") ? "Contenido heredado" : "Información editorial"}</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <label key={field}>{textLabels[field]}
            {field === "sharedAreas" || field === "leedAttributes" ? (
              <textarea className="field min-h-32" defaultValue={project[field].join("\n")} onChange={(event) => {
                const value = event.target.value.split("\n").map((item) => item.trim()).filter(Boolean);
                void updateProject((current) => ({ ...current, [field]: value }));
              }} />
            ) : <input className="field" value={project[field]} onChange={(event) => {
              const value = event.target.value;
              void updateProject((current) => ({ ...current, [field]: value }));
            }} />}
          </label>
        ))}
      </div>
    </section>
  );
}

function AdminSections({ project, updateProject, ids }: { project: Project; updateProject: EditProject; ids: string[] }) {
  return project.sections.filter((section) => ids.includes(section.id)).map((section) => (
    <section className="admin-card" key={section.id}>
      <h2>{section.id === "architecture" ? "Arquitectura" : section.title || "Capítulo"}</h2>
      <div className="grid gap-4">
        <label>Título del capítulo
          <input className="field" value={section.title} onChange={(event) => {
            const title = event.target.value;
            void updateProject((current) => ({ ...current, sections: current.sections.map((item) => item.id === section.id ? { ...item, title } : item) }));
          }} />
        </label>
        <label>Texto del capítulo
          <textarea className="field min-h-24" value={section.summary} onChange={(event) => {
            const summary = event.target.value;
            void updateProject((current) => ({ ...current, sections: current.sections.map((item) => item.id === section.id ? { ...item, summary } : item) }));
          }} />
        </label>
      </div>
    </section>
  ));
}

function AdminDepartments({ project, updateProject }: { project: Project; updateProject: EditProject }) {
  const [selected, setSelected] = useState(project.typologies[0]?.id ?? "");
  const [selectedZone, setSelectedZone] = useState<string>();
  const typology = project.typologies.find((item) => item.id === selected) ?? project.typologies[0];

  const addTypology = () => {
    const code = nextTypologyCode(project.typologies);
    const id = slugify(`typology-${code}-${Date.now()}`);
    const basePlan = typology?.planSrc ?? project.floorPlan.imageSrc;
    const next: Typology = {
      id, code, areaM2: 0, bedrooms: 1, bathrooms: 1, format: "Flat", active: true,
      planSrc: basePlan, thumbnailSrc: basePlan, floorThumbnailSrc: project.floorPlan.imageSrc,
      rooms: [], apartments: [], features: {}, updatedAt: new Date().toISOString(),
      notes: "Nueva tipología. Reemplazar plano y completar información comercial."
    };
    void updateProject((current) => ({ ...current, typologies: [...current.typologies, next] }));
    selectTypology(id);
  };

  function selectTypology(id: string) {
    setSelected(id);
    setSelectedZone(undefined);
  }

  function selectZone(zone: Hotspot) {
    setSelected(zone.typologyId);
    setSelectedZone(zone.id);
  }

  function changeZones(updater: (zones: Hotspot[]) => Hotspot[]) {
    return updateProject((current) => ({
      ...current,
      floorPlan: { ...current.floorPlan, updatedAt: new Date().toISOString(), hotspots: updater(current.floorPlan.hotspots) }
    }));
  }

  return (
    <>
      <section className="admin-card">
        <div className="admin-card-heading">
          <h2>Planta típica</h2>
          <button className="secondary-touch" type="button" onClick={addTypology}><Plus size={17} /> Agregar tipología</button>
        </div>
        <FloorPlanInteractive
          editable
          floorPlan={project.floorPlan}
          typologies={project.typologies}
          selectedId={typology?.id}
          selectedZoneId={selectedZone}
          onSelect={selectTypology}
          onZoneSelect={selectZone}
          onHotspotAdd={(zone) => { void changeZones((zones) => [...zones, zone]); selectZone(zone); }}
          onHotspotDelete={(id) => { void changeZones((zones) => zones.filter((zone) => zone.id !== id)); setSelectedZone(undefined); }}
          onHotspotChange={(updated) => { void changeZones((zones) => zones.map((zone) => zone.id === updated.id ? updated : zone)); }}
          inspector={typology && <AdminTypology key={typology.id} typology={typology} updateProject={updateProject} />}
        />
        <AdminFiles updateProject={updateProject} />
      </section>
      <AdminGeneralPlans plans={project.generalPlans} updateProject={updateProject} />
    </>
  );
}

function AdminGeneralPlans({ plans, updateProject }: { plans?: GeneralPlan[]; updateProject: EditProject }) {
  const [message, setMessage] = useState("");
  if (!plans?.length) return null;

  function updatePlan(id: string, patch: Partial<GeneralPlan>) {
    return updateProject((current) => ({
      ...current,
      generalPlans: current.generalPlans?.map((plan) => plan.id === id ? { ...plan, ...patch, updatedAt: new Date().toISOString() } : plan)
    }));
  }

  async function replacePlan(id: string, file: File) {
    if (!galleryAccept.split(",").includes(file.type)) {
      setMessage("Selecciona un plano en formato PNG, JPG, SVG o WebP.");
      return;
    }
    try {
      const src = await fileToDataUrl(file);
      await updatePlan(id, { planSrc: src, thumbnailSrc: src });
      setMessage("");
    } catch {
      setMessage("No se pudo abrir el archivo del plano.");
    }
  }

  return (
    <section className="admin-card">
      <h2>Planos generales</h2>
      {message && <p role="alert">{message}</p>}
      <div className="admin-gallery-grid">
        {plans.map((plan) => (
          <article key={plan.id} className="admin-image">
            <img className="h-32 w-full object-contain" src={plan.thumbnailSrc} alt={plan.title} loading="lazy" />
            <div className="admin-image-fields">
              <label>Título
                <input className="field" value={plan.title} onChange={(event) => void updatePlan(plan.id, { title: event.target.value })} />
              </label>
              <label className="secondary-touch admin-file-action">
                <Upload size={16} /> Reemplazar plano
                <input type="file" accept={galleryAccept} onChange={(event) => {
                  const file = event.currentTarget.files?.[0];
                  if (file) void replacePlan(plan.id, file);
                  event.currentTarget.value = "";
                }} />
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function AdminGeneral({ project, updateProject }: { project: Project; updateProject: (updater: (project: Project) => Project) => Promise<void> }) {
  const [logoStatus, setLogoStatus] = useState("");
  const setField = (field: "name" | "tagline" | "logoText" | "shortDescription", value: string) => updateProject((current) => ({ ...current, [field]: value }));
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
      <h2 className="section-title">Portada</h2>
      <div className="grid gap-3 md:grid-cols-2">
        <label>Frase de portada<input className="field" value={project.tagline} onChange={(event) => setField("tagline", event.target.value)} /></label>
        <label>Título<input className="field" value={project.name} onChange={(event) => setField("name", event.target.value)} /></label>
        <label>Texto alternativo del logo<input className="field" value={project.logoText} onChange={(event) => setField("logoText", event.target.value)} /></label>
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
                <input className="sr-only" type="file" accept={galleryAccept} onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void replaceLogo(file).catch(() => setLogoStatus("No se pudo leer el logo."));
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

function AdminAbout({ project, updateProject }: { project: Project; updateProject: EditProject }) {
  const [imageError, setImageError] = useState("");
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
    if (!galleryAccept.split(",").includes(file.type)) {
      setImageError("Selecciona una imagen PNG, JPG, SVG o WebP.");
      return;
    }
    setImageError("");
    const imageSrc = await fileToDataUrl(file);
    await updateSlide(id, { imageSrc });
  };
  const replaceCoverImage = async (file: File) => {
    if (!galleryAccept.split(",").includes(file.type)) {
      setImageError("Selecciona una imagen PNG, JPG, SVG o WebP.");
      return;
    }
    setImageError("");
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
    if (!galleryAccept.split(",").includes(file.type)) {
      setImageError("Selecciona una imagen PNG, JPG, SVG o WebP.");
      return;
    }
    setImageError("");
    const imageSrc = await fileToDataUrl(file);
    await updateAboutProject(id, { imageSrc });
  };
  const sortedAboutProjects = [...(project.about.projects ?? [])].sort((a, b) => a.order - b.order);
  return (
    <div className="rounded border border-ink/10 bg-porcelain p-5">
      <h2 className="section-title">Presentación de Morada</h2>
      {imageError && <p role="alert" className="mb-3 text-sm text-red-700">{imageError}</p>}
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
                <input className="sr-only" type="file" accept={galleryAccept} onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void replaceCoverImage(file).catch(() => setImageError("No se pudo leer la imagen."));
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
                  <input className="sr-only" type="file" accept={galleryAccept} onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void replaceSlideImage(slide.id, file).catch(() => setImageError("No se pudo leer la imagen."));
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
                defaultValue={slide.keywords.join(", ")}
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
                    <input className="sr-only" type="file" accept={galleryAccept} onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void replaceAboutProjectImage(item.id, file).catch(() => setImageError("No se pudo leer la imagen."));
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

const galleryAccept = "image/png,image/jpeg,image/svg+xml,image/webp";

function AdminGalleries({ project, updateProject, ids }: { project: Project; updateProject: EditProject; ids: readonly string[] }) {
  return ids.map((id) => {
    const gallery = project.galleries.find((item) => item.id === id);
    return gallery && <GalleryEditor key={id} gallery={gallery} updateProject={updateProject} />;
  });
}

function GalleryEditor({ gallery, updateProject }: { gallery: Gallery; updateProject: EditProject }) {
  const [status, setStatus] = useState("");
  const [dragging, setDragging] = useState<string>();
  const [dropTarget, setDropTarget] = useState<string>();

  const updateGallery = (updater: (current: Gallery) => Gallery) => updateProject((current) => ({
    ...current,
    galleries: current.galleries.map((item) => item.id === gallery.id ? updater(item) : item)
  }));

  const updateImage = (id: string, patch: Partial<GalleryImage>) => updateGallery((current) => ({
    ...current,
    images: current.images.map((image) => image.id === id ? { ...image, ...patch } : image)
  }));

  async function upload(files: File[], mode: "append" | "replace-all" | string) {
    if (!files.length) return;
    if (files.some((file) => !galleryAccept.split(",").includes(file.type))) {
      setStatus("Selecciona imágenes PNG, JPG, SVG o WebP.");
      return;
    }
    try {
      if (mode === "append" || mode === "replace-all") {
        const images = await Promise.all(files.map(async (file) => ({
          id: crypto.randomUUID(),
          title: file.name.replace(/\.[^.]+$/, ""),
          src: await fileToDataUrl(file),
          category: gallery.category,
          updatedAt: new Date().toISOString()
        })));
        await updateGallery((current) => ({ ...current, images: mode === "append" ? [...current.images, ...images] : images }));
        setStatus(`${images.length} imagen(es) cargada(s).`);
      } else {
        const src = await fileToDataUrl(files[0]);
        await updateImage(mode, { src, updatedAt: new Date().toISOString() });
        setStatus("Imagen reemplazada.");
      }
    } catch {
      setStatus("No se pudo cargar la imagen.");
    }
  }

  function moveImage(source: string, target: string) {
    if (source === target) return;
    void updateGallery((current) => {
      const from = current.images.findIndex((image) => image.id === source);
      const to = current.images.findIndex((image) => image.id === target);
      if (from < 0 || to < 0) return current;
      const images = [...current.images];
      const [image] = images.splice(from, 1);
      images.splice(to, 0, image);
      return { ...current, images };
    });
  }

  function resetDrag() {
    setDragging(undefined);
    setDropTarget(undefined);
  }

  return (
    <section className="admin-card">
      <div className="admin-card-heading">
        <h2>{galleryLabel(gallery.id)}</h2>
        <span className="text-sm text-ink/70">{gallery.images.length} imágenes</span>
      </div>
      <label className="mb-3 block">Título de la galería
        <input className="field" value={gallery.title} onChange={(event) => {
          const title = event.target.value;
          void updateGallery((current) => ({ ...current, title }));
        }} />
      </label>
      {galleryUsageNote(gallery.id) && <p className="mb-2 text-sm text-ink/70">{galleryUsageNote(gallery.id)}</p>}
      <label className="admin-drop admin-file-action" onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDropTarget("upload");
      }} onDragLeave={() => setDropTarget(undefined)} data-drag-over={dropTarget === "upload"} onDrop={(event) => {
        event.preventDefault();
        resetDrag();
        void upload(Array.from(event.dataTransfer.files), "append");
      }}>
        <Upload size={20} />
        <strong>Agregar imágenes o arrastrarlas aquí</strong>
        <span>{imageSizeRecommendation(gallery.id)}</span>
        <input type="file" accept={galleryAccept} multiple onChange={(event) => {
          void upload(Array.from(event.currentTarget.files ?? []), "append");
          event.currentTarget.value = "";
        }} />
      </label>
      {gallery.id === "proyecto-fachada" && (
        <label className="secondary-touch admin-file-action mt-3">
          <Upload size={16} /> Vaciar y reemplazar galería
          <input type="file" accept={galleryAccept} multiple onChange={(event) => {
            const files = Array.from(event.currentTarget.files ?? []);
            event.currentTarget.value = "";
            if (files.length && confirm("¿Reemplazar todas las imágenes de esta galería?")) void upload(files, "replace-all");
          }} />
        </label>
      )}
      {status && <p role="status" className="mt-3 text-sm text-morada">{status}</p>}
      <div className="admin-gallery-grid">
        {gallery.images.map((image, index) => (
          <article key={image.id} className="admin-image" data-drag-over={dropTarget === image.id}
            onDragOver={(event) => {
              if (!dragging && !event.dataTransfer.types.includes("Files")) return;
              event.preventDefault();
              setDropTarget(image.id);
            }}
            onDragLeave={(event) => {
              if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
              setDropTarget(undefined);
            }}
            onDrop={(event) => {
              event.preventDefault();
              const files = Array.from(event.dataTransfer.files);
              if (files.length) void upload(files, image.id);
              else if (dragging) moveImage(dragging, image.id);
              resetDrag();
            }}>
            <div className="admin-image-thumb">
              <img src={image.src} alt={image.title} draggable={false} loading="lazy" />
              <span className="admin-grip" draggable onDragStart={(event) => {
                event.dataTransfer.setData("text/plain", image.id);
                event.dataTransfer.effectAllowed = "move";
                setDragging(image.id);
              }} onDragEnd={resetDrag} title="Arrastrar para reordenar"><GripVertical size={17} /></span>
            </div>
            <div className="admin-image-fields">
              <label>Título<input className="field" value={image.title} onChange={(event) => void updateImage(image.id, { title: event.target.value })} /></label>
              <label>Descripción<textarea className="field" rows={2} value={image.description ?? ""} onChange={(event) => void updateImage(image.id, { description: event.target.value })} /></label>
              <div className="admin-image-actions">
                <button type="button" aria-label={`Subir ${image.title}`} title="Subir" disabled={index === 0} onClick={() => moveImage(image.id, gallery.images[index - 1].id)}><ArrowUp size={17} /></button>
                <button type="button" aria-label={`Bajar ${image.title}`} title="Bajar" disabled={index === gallery.images.length - 1} onClick={() => moveImage(image.id, gallery.images[index + 1].id)}><ArrowDown size={17} /></button>
                <label className="admin-file-action" title="Reemplazar">
                  <Upload size={17} /><span className="sr-only">Reemplazar {image.title}</span>
                  <input type="file" accept={galleryAccept} onChange={(event) => {
                    void upload(Array.from(event.currentTarget.files ?? []), image.id);
                    event.currentTarget.value = "";
                  }} />
                </label>
                <button type="button" aria-label={`Eliminar ${image.title}`} title="Eliminar" onClick={() => {
                  if (!confirm("¿Eliminar esta imagen?")) return;
                  void updateGallery((current) => ({ ...current, images: current.images.filter((item) => item.id !== image.id) }));
                }}><Trash2 size={17} /></button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
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
        <div className="grid gap-3 sm:grid-cols-3">
          <label>Área m²<input className="field" type="number" min="0" step="0.01" value={typology.areaM2} onChange={(event) => update({ areaM2: Number(event.target.value) || 0 })} /></label>
          <label>Dormitorios<input className="field" type="number" min="0" step="1" value={typology.bedrooms} onChange={(event) => update({ bedrooms: Number(event.target.value) || 0 })} /></label>
          <label>Baños<input className="field" type="number" min="0" step="1" value={typology.bathrooms ?? 0} onChange={(event) => update({ bathrooms: Number(event.target.value) || 0 })} /></label>
        </div>
        <label>
          Formato
          <select className="field" value={typology.format} onChange={(event) => update({ format: event.target.value as Typology["format"] })}>
            <option value="Flat">Flat</option><option value="TH">TH</option>
            <option value="Duplex">Duplex</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Garden home">Garden home</option>
            <option value="Demostrativo">Demostrativo</option>
          </select>
        </label>
        <label>Notas<textarea className="field min-h-24" value={typology.notes ?? ""} onChange={(event) => update({ notes: event.target.value })} /></label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={typology.active} onChange={(event) => update({ active: event.target.checked })} /> Tipología activa</label>
        <p className="rounded bg-white px-3 py-2 text-sm text-ink/70">
          Tamaño sugerido: {imageSizeRecommendation("plano")}
        </p>
        <label className="secondary-touch w-full cursor-pointer justify-center">
          <Upload className="size-4" /> Reemplazar plano
          <input className="sr-only" type="file" accept={galleryAccept} onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void replacePlan(file).catch(() => setFileInfo("No se pudo leer el plano."));
            event.currentTarget.value = "";
          }} />
        </label>
        <p className="text-sm text-ink/70">La imagen del plano es la única fuente de información técnica para esta tipología. La miniatura se actualiza automáticamente.</p>
        {fileInfo ? <p className="rounded bg-white p-3 text-sm text-ink/70">{fileInfo}</p> : null}
      </div>
    </div>
  );
}

function nextTypologyCode(typologies: Typology[]): string {
  const existing = new Set(typologies.map((item) => item.code.trim().toUpperCase()));
  for (let index = typologies.length + 1; index < typologies.length + 100; index += 1) {
    const code = `T-${index}`;
    if (!existing.has(code.toUpperCase())) return code;
  }
  return `T-${Date.now().toString().slice(-4)}`;
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function AdminFiles({ updateProject }: { updateProject: EditProject }) {
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
      <p className="mb-3 rounded bg-white px-3 py-2 text-sm text-ink/70">
        Tamaño sugerido: {imageSizeRecommendation("planta")}
      </p>
      <label className="field mb-3 block cursor-pointer text-center">
        <Upload className="mx-auto mb-2" /> Reemplazar planta típica
        <input className="sr-only" type="file" accept={galleryAccept} onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void replaceFloorPlan(file).catch(() => setFileInfo("No se pudo leer la planta."));
          event.currentTarget.value = "";
        }} />
      </label>
      <p className="text-sm text-ink/70">La planta típica se actualiza en el explorador, miniaturas de ubicación y herramienta de zonas clicables.</p>
      {fileInfo ? <p className="mt-3 rounded bg-white p-3 text-sm">{fileInfo}</p> : null}
    </div>
  );
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
    "proyecto-fachada": "Proyecto usa automáticamente las primeras 3 imágenes de esta galería. Arrastra las miniaturas o usa los botones de orden.",
    arquitectura: "Proyecto usa automáticamente la primera imagen de esta galería para el bloque de Arquitectos.",
    fachada: "La primera imagen se usa en Inicio y en la primera diapositiva de Proyecto.",
    interiores: "Todas las imágenes se muestran como capítulos grandes en Interiores.",
    areas: "Todas las imágenes se muestran como capítulos grandes en Áreas comunes.",
    barrio: "La primera imagen se usa como mapa de Ubicación."
  };
  return notes[id];
}

function galleryLabel(id: string) {
  const labels: Record<string, string> = {
    fachada: "Imágenes de portada",
    arquitectura: "Galería de arquitectura",
    barrio: "Mapa y galería de ubicación",
    "proyecto-fachada": "Proyecto/Fachada",
    interiores: "Interiores",
    areas: "Áreas comunes"
  };
  return labels[id] ?? id;
}

