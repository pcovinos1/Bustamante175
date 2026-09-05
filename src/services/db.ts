import { openDB } from "idb";
import type { Project } from "../types/project";
import { initialProject } from "../data/initialProject";

const DB_NAME = "pardo-664-local";
const STORE = "project";
const PROJECT_KEY = "active";

const dbPromise = openDB(DB_NAME, 1, {
  upgrade(db) {
    db.createObjectStore(STORE);
  }
});

export async function getProject(): Promise<Project> {
  const db = await dbPromise;
  const saved = await db.get(STORE, PROJECT_KEY);
  if (saved) {
    const normalized = normalizeProject(saved as Project);
    await db.put(STORE, normalized, PROJECT_KEY);
    return normalized;
  }
  await db.put(STORE, initialProject, PROJECT_KEY);
  return initialProject;
}

export async function saveProject(project: Project): Promise<void> {
  const db = await dbPromise;
  await db.put(STORE, project, PROJECT_KEY);
}

export async function resetProject(): Promise<Project> {
  const db = await dbPromise;
  await db.put(STORE, initialProject, PROJECT_KEY);
  return initialProject;
}

function normalizeProject(project: Project): Project {
  const logoSrc = typeof project.logoSrc === "string" ? project.logoSrc : initialProject.logoSrc;
  const about = project.about
    ? {
        ...initialProject.about,
        ...project.about,
        slides: project.about.slides?.length ? project.about.slides : initialProject.about.slides,
        projects: project.about.projects?.length
          ? project.about.projects.map((item, index) => ({
              ...item,
              year: typeof item.year === "string" && item.year ? item.year : "2020",
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
  const initialBarrio = initialProject.galleries.find((gallery) => gallery.id === "barrio");
  const normalizedGalleries = galleries.map((gallery) => {
    if (gallery.id !== "barrio" || !initialBarrio?.images[0]) return gallery;
    const firstImage = gallery.images[0];
    if (!firstImage || firstImage.src.startsWith("data:")) return gallery;
    return {
      ...gallery,
      images: [{ ...firstImage, src: initialBarrio.images[0].src, title: initialBarrio.images[0].title }, ...gallery.images.slice(1)]
    };
  });

  const sections = [...project.sections];
  for (const section of initialProject.sections) {
    if (!sections.some((item) => item.id === section.id)) {
      sections.push(section);
    }
  }

  const mergedPoints = [...project.pointsOfInterest];
  for (const point of initialProject.pointsOfInterest) {
    if (!mergedPoints.some((item) => item.id === point.id)) {
      mergedPoints.push(point);
    }
  }

  const initialPointsById = new Map(initialProject.pointsOfInterest.map((point) => [point.id, point]));
  const pointsOfInterest = mergedPoints
    .map((point, index) => {
      const initialPoint = initialPointsById.get(point.id);
      const rawCategory = String(point.category);
      return {
        ...point,
        category: rawCategory === "Cafés" ? "Gastronomía" : (initialPoint?.category ?? point.category),
        visible: typeof point.visible === "boolean" ? point.visible : true,
        order: typeof point.order === "number" ? point.order : index + 1
      };
    })
    .sort((a, b) => a.order - b.order);

  return { ...project, logoSrc, about, galleries: normalizedGalleries, sections, pointsOfInterest };
}
