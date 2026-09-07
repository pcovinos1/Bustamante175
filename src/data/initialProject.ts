import type { Project } from "../types/project";

const today = "2026-09-05";
const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1600 1000'%3E%3Crect width='1600' height='1000' fill='%23f5efe7'/%3E%3Ctext x='800' y='500' dominant-baseline='middle' text-anchor='middle' fill='%231d1b18' font-family='Arial' font-size='72'%3EBustamante 175%3C/text%3E%3C/svg%3E";

export const initialProject: Project = {
  id: "bustamante-175",
  name: "Bustamante 175",
  developer: "Morada",
  logoText: "morada",
  tagline: "Una nueva joya arquitectónica en Barranco",
  shortDescription: "Proyecto residencial de Morada en Barranco.",
  district: "Barranco",
  address: "Bustamante 175, Barranco",
  architect: "Morada",
  certification: "LEED",
  status: "En venta",
  areaRange: "Consulta disponibilidad",
  typologySummary: "Departamentos disponibles segun inventario comercial.",
  sharedAreas: [],
  leedAttributes: [],
  about: {
    eyebrow: "Morada",
    title: "Bustamante 175",
    subtitle: "Proyecto residencial en Barranco.",
    coverImageSrc: fallbackImage,
    slides: [],
    projects: []
  },
  sections: [
    { id: "project", title: "El proyecto", summary: "Bustamante 175 por Morada.", order: 1, enabled: true },
    { id: "architecture", title: "Arquitectura", summary: "Arquitectura residencial en Barranco.", order: 2, enabled: true },
    { id: "location", title: "Ubicación", summary: "Barranco.", order: 3, enabled: true },
    { id: "amenities", title: "Areas comunes", summary: "Espacios compartidos.", order: 4, enabled: true },
    { id: "interiors", title: "Interiores", summary: "Interiores del proyecto.", order: 5, enabled: true },
    { id: "departments", title: "Departamentos", summary: "Tipologias disponibles.", order: 6, enabled: true },
    { id: "contact", title: "Contacto", summary: "Informacion comercial.", order: 7, enabled: true }
  ],
  galleries: [
    {
      id: "fachada",
      title: "Fachada",
      category: "fachada",
      images: [{ id: "fachada-fallback", title: "Bustamante 175", src: fallbackImage, category: "fachada" }]
    }
  ],
  floorPlan: {
    id: "planta-fallback",
    title: "Planta",
    imageSrc: fallbackImage,
    hotspots: [],
    updatedAt: today
  },
  typologies: [],
  pointsOfInterest: [],
  version: {
    version: "1.0",
    publishedAt: today,
    changes: [{ id: "fallback", date: today, text: "Contenido base de Bustamante 175." }]
  },
  adminPin: "6640"
};
