import { openDB } from "idb";
import type { Project } from "../types/project";
import { initialProject } from "../data/initialProject";
import { fetchRemoteProject } from "./files";
import { migrateLocation } from "../data/locationContent";
import { migratePlans } from "../data/migratePlans";

const DB_NAME = "bustamante-175-local";
const STORE = "project";
const PROJECT_KEY = "active";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE);
  }
});

export async function getProject(): Promise<Project> {
  const db = await safeDb();
  if (!db) return fetchRemoteProject().catch(() => null).then((project) => prepareProject(project ?? initialProject));

  const saved = await db.get(STORE, PROJECT_KEY).catch(() => undefined);
  if (saved) return prepareProject(saved as Project);
  const published = await fetchRemoteProject().catch(() => null);
  const project = prepareProject(published ?? initialProject);
  await db.put(STORE, project, PROJECT_KEY).catch(() => undefined);
  return project;
}

export async function saveProject(project: Project): Promise<void> {
  const db = await safeDb();
  if (!db) throw new Error("El almacenamiento local no está disponible.");
  await db.put(STORE, project, PROJECT_KEY);
}

async function safeDb() {
  if (!("indexedDB" in window)) return null;
  return dbPromise.catch(() => null);
}

export function prepareProject(project: Project): Project {
  const logoSrc = typeof project.logoSrc === "string" ? project.logoSrc : initialProject.logoSrc;
  const about = project.about
    ? {
        ...initialProject.about,
        ...project.about,
        slides: project.about.slides ?? initialProject.about.slides,
        projects: project.about.projects
          ? project.about.projects.map((item, index) => ({
              ...item,
              year: typeof item.year === "string" ? item.year : "2020",
              order: typeof item.order === "number" ? item.order : index + 1
            }))
          : initialProject.about.projects
      }
    : initialProject.about;
  const galleries = [...project.galleries];
  for (const gallery of initialProject.galleries) {
    if (!galleries.some((item) => item.id === gallery.id)) {
      galleries.push(gallery);
    }
  }
  const sections = [...project.sections];
  for (const section of initialProject.sections) {
    if (!sections.some((item) => item.id === section.id)) {
      sections.push(section);
    }
  }

  const pointsOfInterest = (project.pointsOfInterest ?? initialProject.pointsOfInterest)
    .map((point, index) => {
      const rawCategory = String(point.category);
      return {
        ...point,
        category: rawCategory === "Cafés" ? "Gastronomía" : point.category,
        visible: typeof point.visible === "boolean" ? point.visible : true,
        order: typeof point.order === "number" ? point.order : index + 1
      };
    })
    .sort((a, b) => a.order - b.order);

  return migrateLocation(migratePlans({ ...project, logoSrc, about, galleries, sections, pointsOfInterest }));
}
