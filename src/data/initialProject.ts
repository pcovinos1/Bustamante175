import type { Apartment, Gallery, Hotspot, Project, Room, Typology } from "../types/project";
import heroFachada from "../assets/pdf-pages/hero-fachada.png";
import proyecto from "../assets/pdf-pages/proyecto.png";
import arquitecturaNomena from "../assets/pdf-pages/arquitectura-nomena.png";
import mapaBarrio from "../assets/pdf-pages/mapa-pardo664.svg";
import areasComunes from "../assets/pdf-pages/areas-comunes.png";
import interiores1 from "../assets/pdf-pages/interiores-1.png";
import interiores2 from "../assets/pdf-pages/interiores-2.png";
import interiores3 from "../assets/pdf-pages/interiores-3.png";
import fachadaDetalle from "../assets/pdf-pages/fachada-detalle.png";
import fichaProyecto from "../assets/pdf-pages/ficha-proyecto.png";
import plantaTipica from "../assets/pdf-pages/planta-tipica.png";
import planoA1 from "../assets/pdf-pages/plano-a-1.png";
import planoA2 from "../assets/pdf-pages/plano-a-2.png";
import planoA3 from "../assets/pdf-pages/plano-a-3.png";
import planoA4 from "../assets/pdf-pages/plano-a-4.png";
import planoA5 from "../assets/pdf-pages/plano-a-5.png";
import planoB1 from "../assets/pdf-pages/plano-b-1.png";
import planoB2 from "../assets/pdf-pages/plano-b-2.png";
import planoB3 from "../assets/pdf-pages/plano-b-3.png";

const today = "2026-06-02";

const apartments = (items: string[]): Apartment[] => items.map((label) => ({ id: label, label }));
const rooms = (items: Array<[string, string?]>): Room[] =>
  items.map(([name, dimensions], index) => ({ id: `${index + 1}`.padStart(2, "0"), name, dimensions }));

const galleries: Gallery[] = [
  {
    id: "fachada",
    title: "Fachada",
    category: "fachada",
    images: [
      { id: "fachada-hero", title: "Pardo 664", src: heroFachada, category: "fachada" },
      { id: "fachada-detalle", title: "Frente urbano", src: fachadaDetalle, category: "fachada" },
      { id: "ficha-proyecto", title: "Ficha visual del proyecto", src: fichaProyecto, category: "fachada" }
    ]
  },
  {
    id: "proyecto-fachada",
    title: "Fachada y proyecto",
    category: "fachada",
    images: [
      { id: "proyecto-fachada-hero", title: "Fachada principal", src: heroFachada, category: "fachada" },
      { id: "proyecto-fachada-detalle", title: "Frente urbano", src: fachadaDetalle, category: "fachada" },
      { id: "proyecto-ficha", title: "Ficha visual del proyecto", src: fichaProyecto, category: "fachada" }
    ]
  },
  {
    id: "interiores",
    title: "Interiores",
    category: "interiores",
    images: [
      { id: "interior-1", title: "Interior referencial", src: interiores1, category: "interiores" },
      { id: "interior-2", title: "Ambientes del departamento", src: interiores2, category: "interiores" },
      { id: "interior-3", title: "Sala y comedor referencial", src: interiores3, category: "interiores" }
    ]
  },
  {
    id: "areas",
    title: "Áreas comunes",
    category: "areas",
    images: [{ id: "areas-1", title: "10 ambientes compartidos", src: areasComunes, category: "areas" }]
  },
  {
    id: "barrio",
    title: "Barrio",
    category: "barrio",
    images: [{ id: "barrio-1", title: "Mapa de puntos de interés", src: mapaBarrio, category: "barrio" }]
  },
  {
    id: "arquitectura",
    title: "Arquitectura",
    category: "arquitectura",
    images: [
      { id: "arquitectura-1", title: "Nómena Arquitectura", src: arquitecturaNomena, category: "arquitectura" },
      { id: "proyecto-1", title: "Pardo 664", src: proyecto, category: "arquitectura" }
    ]
  }
];

const aboutProjects = Array.from({ length: 13 }, (_, index) => {
  const districts = ["Miraflores", "San Isidro", "Barranco", "Surco"];
  const images = [heroFachada, fachadaDetalle, proyecto, arquitecturaNomena, fichaProyecto];
  return {
    id: `morada-project-${String(index + 1).padStart(2, "0")}`,
    name: `Proyecto ${String(index + 1).padStart(2, "0")}`,
    year: String(2020 + (index % 6)),
    district: districts[index % districts.length],
    imageSrc: images[index % images.length],
    order: index + 1
  };
});

const hotspotSeed: Array<[string, number, number, number, number]> = [
  ["a-1", 24, 47, 10, 20],
  ["a-2", 34, 45, 11, 22],
  ["a-3", 45, 45, 10, 22],
  ["a-4", 56, 43, 11, 25],
  ["a-5", 66, 43, 11, 25],
  ["b-1", 25, 21, 13, 20],
  ["b-2", 40, 21, 14, 20],
  ["b-3", 55, 22, 13, 19]
];

const hotspots: Hotspot[] = hotspotSeed.map(([typologyId, x, y, width, height]) => ({
  id: `hotspot-${typologyId}`,
  typologyId,
  x,
  y,
  width,
  height
}));

const typologies: Typology[] = [
  {
    id: "a-1",
    code: "A-1",
    areaM2: 61,
    bedrooms: 1,
    bathrooms: 2,
    format: "Flat",
    active: true,
    planSrc: planoA1,
    thumbnailSrc: planoA1,
    floorThumbnailSrc: plantaTipica,
    rooms: rooms([
      ["Sala comedor", "3.55 x 2.90"],
      ["Terraza 01"],
      ["Kitchenette", "3.40 x 2.90"],
      ["Centro de lavado"],
      ["Baño de visita"],
      ["Dormitorio 01", "3.35 x 2.90"],
      ["Baño 01"],
      ["Terraza 02"]
    ]),
    apartments: apartments(["401", "501", "601", "701", "801", "901", "1001", "1101", "1201", "1301", "1401", "1501", "1601", "1701", "1801", "1901", "2001", "2101"]),
    features: { terrace: true },
    updatedAt: today
  },
  {
    id: "a-2",
    code: "A-2",
    areaM2: 63,
    bedrooms: 1,
    bathrooms: 2,
    format: "Flat",
    active: true,
    planSrc: planoA2,
    thumbnailSrc: planoA2,
    floorThumbnailSrc: plantaTipica,
    rooms: rooms([
      ["Sala comedor", "4.10 x 3.45"],
      ["Terraza"],
      ["Kitchenette"],
      ["Centro de lavado"],
      ["Estudio", "3.75 x 2.35"],
      ["Dormitorio 01", "3.15 x 2.40"],
      ["Baño 01"],
      ["Baño 02"]
    ]),
    apartments: apartments(["201", "302", "402", "502", "602", "702", "802", "902", "1002", "1102", "1202", "1302", "1402", "1502", "1602", "1702", "1802"]),
    features: { terrace: true, study: true },
    updatedAt: today
  },
  {
    id: "a-3",
    code: "A-3",
    areaM2: 60,
    bedrooms: 1,
    bathrooms: 2,
    format: "Flat",
    active: true,
    planSrc: planoA3,
    thumbnailSrc: planoA3,
    floorThumbnailSrc: plantaTipica,
    rooms: rooms([
      ["Sala comedor", "3.00 x 2.85"],
      ["Terraza"],
      ["Kitchenette", "2.50 x 2.80"],
      ["Centro de lavado"],
      ["Estudio"],
      ["Dormitorio 01", "2.90 x 3.60"],
      ["Baño 01"],
      ["Baño 02"]
    ]),
    apartments: apartments(["403", "503", "603", "703", "803", "903", "1003", "1103", "1203", "1303", "1403", "1503", "1603", "1703", "1803"]),
    features: { terrace: true, study: true },
    updatedAt: today
  },
  {
    id: "a-4",
    code: "A-4",
    areaM2: 75,
    bedrooms: 2,
    bathrooms: 2,
    format: "Flat",
    active: true,
    planSrc: planoA4,
    thumbnailSrc: planoA4,
    floorThumbnailSrc: plantaTipica,
    rooms: rooms([
      ["Sala comedor", "2.70 x 5.30"],
      ["Kitchenette", "2.90 x 3.25"],
      ["Terraza"],
      ["Hall"],
      ["Centro de lavado"],
      ["Dormitorio 01", "2.95 x 3.50"],
      ["Dormitorio 02", "2.25 x 2.30"],
      ["Baño 01"],
      ["Walk-in closet"],
      ["Baño 02"]
    ]),
    apartments: apartments(["304", "404", "504", "604", "704", "805", "904", "1004", "1104", "1204"]),
    features: { terrace: true, walkInCloset: true },
    updatedAt: today
  },
  {
    id: "a-5",
    code: "A-5",
    areaM2: 74,
    bedrooms: 3,
    bathrooms: 2,
    format: "Flat",
    active: true,
    planSrc: planoA5,
    thumbnailSrc: planoA5,
    floorThumbnailSrc: plantaTipica,
    rooms: rooms([
      ["Sala comedor", "3.10 x 5.15"],
      ["Terraza"],
      ["Kitchenette", "2.95 x 3.30"],
      ["Centro de lavado"],
      ["Estudio"],
      ["Dormitorio 01", "2.55 x 3.70"],
      ["Baño 01"],
      ["Dormitorio 02", "1.75 x 2.70"],
      ["Baño 02"]
    ]),
    apartments: apartments(["405", "505", "605", "705", "805", "905", "1005", "1105", "1205", "1305", "1405", "1505", "1605"]),
    features: { terrace: true, study: true },
    updatedAt: today
  },
  {
    id: "b-1",
    code: "B-1",
    areaM2: 74,
    bedrooms: 2,
    bathrooms: 2,
    format: "Flat",
    active: true,
    planSrc: planoB1,
    thumbnailSrc: planoB1,
    floorThumbnailSrc: plantaTipica,
    rooms: rooms([
      ["Sala comedor", "3.60 x 3.70"],
      ["Terraza"],
      ["Kitchenette", "3.15 x 3.05"],
      ["Centro de lavado"],
      ["Dormitorio 01", "4.35 x 2.75"],
      ["Walk-in closet"],
      ["Baño 01"],
      ["Dormitorio 02", "3.95 x 2.65"],
      ["Baño 02"]
    ]),
    apartments: apartments(["201", "301", "401", "501", "601", "701", "801", "901", "1001", "1101", "1201", "1301", "1401", "1501", "1601", "1701", "1801", "1901", "2001", "2101"]),
    features: { terrace: true, walkInCloset: true },
    updatedAt: today
  },
  {
    id: "b-2",
    code: "B-2",
    areaM2: 75,
    bedrooms: 2,
    bathrooms: 2,
    format: "Flat",
    active: true,
    planSrc: planoB2,
    thumbnailSrc: planoB2,
    floorThumbnailSrc: plantaTipica,
    rooms: rooms([
      ["Sala comedor", "3.95 x 3.55"],
      ["Terraza"],
      ["Kitchenette", "3.20 x 3.15"],
      ["Centro de lavado"],
      ["Dormitorio 01", "2.80 x 3.45"],
      ["Walk-in closet"],
      ["Baño 01"],
      ["Dormitorio 02", "2.85 x 3.45"],
      ["Baño 02"]
    ]),
    apartments: apartments(["202", "302", "402", "502", "602", "702", "802", "902", "1002", "1102", "1202", "1302", "1402", "1502", "1602", "1702", "1802", "1902", "2002", "2102"]),
    features: { terrace: true, walkInCloset: true },
    updatedAt: today
  },
  {
    id: "b-3",
    code: "B-3",
    areaM2: 62,
    bedrooms: 2,
    bathrooms: 2,
    format: "Flat",
    active: true,
    planSrc: planoB3,
    thumbnailSrc: planoB3,
    floorThumbnailSrc: plantaTipica,
    rooms: rooms([
      ["Sala comedor", "3.05 x 3.45"],
      ["Terraza"],
      ["Kitchenette", "2.80 x 2.20"],
      ["Centro de lavado"],
      ["Estudio"],
      ["Dormitorio 01", "3.70 x 2.40"],
      ["Baño 01"],
      ["Baño 02"]
    ]),
    apartments: apartments(["203", "303", "403", "503", "603", "703", "803", "903", "1003", "1103", "1203", "1303", "1403", "1503", "1603", "1703", "1803", "1903", "2003", "2103", "2203"]),
    features: { terrace: true, study: true },
    updatedAt: today
  }
];

export const initialProject: Project = {
  id: "pardo-664",
  name: "Pardo 664",
  developer: "Morada",
  logoText: "morada",
  logoSrc: "",
  tagline: "Un nuevo color llegó a Pardo.",
  shortDescription:
    "Proyecto diseñado por Nómena Arquitectura para Morada en la avenida José Pardo, Miraflores. Primer proyecto de Morada con certificación LEED.",
  district: "Miraflores",
  address: "Av. José Pardo 664",
  architect: "Nómena Arquitectura",
  certification: "LEED",
  status: "Lanzamiento",
  areaRange: "Desde 60 m² hasta 112 m²",
  typologySummary: "Flats y dúplex de 1, 2 y 3 dormitorios",
  sharedAreas: ["Lobby", "Sala de espera", "Coworking", "Gimnasio", "SUM", "Zona de parrillas", "Piscina", "Pet-wash", "Laundry-room", "Jardín"],
  leedAttributes: ["Paneles solares", "Luces con sensores de movimiento", "Estacionamientos para bicicletas", "Tratamiento y reutilización de aguas residuales"],
  about: {
    eyebrow: "Morada",
    title: "No hay lugar como tu Morada",
    subtitle: "Alta arquitectura peruana",
    coverImageSrc: "",
    slides: [
      {
        id: "about-01",
        number: "01",
        text: "Nacimos en el 2013 como una inmobiliaria boutique, comprometida con ofrecer el más alto estándar de arquitectura y servicio del sector inmobiliario en Lima.",
        keywords: ["boutique", "el más alto estándar de arquitectura y servicio del sector inmobiliario"],
        imageSrc: ""
      },
      {
        id: "about-02",
        number: "02",
        text: "Trabajamos con talentosos arquitectos, artistas urbanos, paisajistas y diseñadores para crear proyectos que transforman la ciudad. Hemos publicado un libro de arquitectura, renovado parques y veredas, y ganado dos premios nacionales de arquitectura.",
        keywords: ["arquitectos, artistas urbanos, paisajistas y diseñadores", "dos premios nacionales"],
        imageSrc: ""
      },
      {
        id: "about-03",
        number: "03",
        text: "El Perú, su gente, su historia, su legado y su arquitectura son nuestra continua fuente de inspiración.",
        keywords: ["arquitectura son nuestra continua fuente de inspiración"],
        imageSrc: ""
      }
    ],
    projects: aboutProjects
  },
  sections: [
    { id: "project", title: "El proyecto", summary: "Síntesis comercial del edificio y sus atributos.", order: 1, enabled: true },
    { id: "architecture", title: "Arquitectura", summary: "Diseño por Nómena Arquitectura.", order: 2, enabled: true },
    { id: "location", title: "Ubicación", summary: "Mapa ilustrado offline y puntos de interés.", order: 3, enabled: true },
    { id: "amenities", title: "Áreas comunes", summary: "Diez espacios compartidos.", order: 4, enabled: true },
    { id: "interiors", title: "Interiores", summary: "Renders y propuesta interior.", order: 5, enabled: true },
    { id: "departments", title: "Departamentos", summary: "Explorador, planta típica y planos.", order: 6, enabled: true },
    { id: "contact", title: "Contacto", summary: "Datos comerciales.", order: 7, enabled: true }
  ],
  galleries,
  floorPlan: {
    id: "typical-floor",
    title: "Planta típica",
    imageSrc: plantaTipica,
    hotspots,
    updatedAt: today
  },
  typologies,
  pointsOfInterest: [
    { id: "poi-1", name: "Dolce Capriccio", category: "Gastronomía", x: 22, y: 43, visible: true, order: 1 },
    { id: "poi-2", name: "Xoma", category: "Gastronomía", x: 31, y: 38, visible: true, order: 2 },
    { id: "poi-3", name: "Cervecería del Valle", category: "Gastronomía", x: 58, y: 31, visible: true, order: 3 },
    { id: "poi-4", name: "Panchita", category: "Gastronomía", x: 72, y: 39, visible: true, order: 4 },
    { id: "poi-5", name: "Matsuei", category: "Gastronomía", x: 72, y: 46, visible: true, order: 5 },
    { id: "poi-6", name: "La Gloria", category: "Gastronomía", x: 76, y: 39, visible: true, order: 6 },
    { id: "poi-7", name: "La Cabrera", category: "Gastronomía", x: 80, y: 39, visible: true, order: 7 },
    { id: "poi-8", name: "La Lucha Sanguchería", category: "Gastronomía", x: 40, y: 35, visible: true, order: 8 },
    { id: "poi-9", name: "Tori", category: "Gastronomía", x: 22, y: 27, visible: true, order: 9 },
    { id: "poi-10", name: "Tomo Cocina Nikkei", category: "Gastronomía", x: 86, y: 41, visible: true, order: 10 },
    { id: "poi-11", name: "La Cantina di Epicuro", category: "Gastronomía", x: 50, y: 47, visible: true, order: 11 },
    { id: "poi-12", name: "La Mora", category: "Gastronomía", x: 67, y: 72, visible: true, order: 12 },
    { id: "poi-13", name: "Rutina Café", category: "Gastronomía", x: 76, y: 69, visible: true, order: 13 },
    { id: "poi-14", name: "Edo", category: "Gastronomía", x: 44, y: 52, visible: true, order: 14 },
    { id: "poi-15", name: "Punto Azul", category: "Gastronomía", x: 42, y: 58, visible: true, order: 15 },
    { id: "poi-16", name: "Mariaté", category: "Gastronomía", x: 55, y: 13, visible: true, order: 16 },
    { id: "poi-17", name: "La Porteña", category: "Gastronomía", x: 40, y: 29, visible: true, order: 17 },
    { id: "poi-18", name: "Latte Bakery", category: "Gastronomía", x: 42, y: 27, visible: true, order: 18 },
    { id: "poi-19", name: "Panadería Cultivo", category: "Gastronomía", x: 42, y: 34, visible: true, order: 19 },
    { id: "poi-20", name: "Mattoni", category: "Gastronomía", x: 16, y: 25, visible: true, order: 20 },
    { id: "poi-21", name: "Punto Café", category: "Gastronomía", x: 18, y: 25, visible: true, order: 21 },
    { id: "poi-22", name: "La Negra Panadería de Barrio", category: "Gastronomía", x: 16, y: 28, visible: true, order: 22 },
    { id: "poi-23", name: "La Caffetteria di Lonato", category: "Gastronomía", x: 17, y: 21, visible: true, order: 23 },
    { id: "poi-24", name: "Café de Lima", category: "Gastronomía", x: 27, y: 9, visible: true, order: 24 },
    { id: "poi-25", name: "Raw Café", category: "Gastronomía", x: 68, y: 9, visible: true, order: 25 },
    { id: "poi-26", name: "Colegio San Silvestre", category: "Educación", x: 18, y: 20, visible: true, order: 26 },
    { id: "poi-27", name: "Colegio Inmaculado Corazón", category: "Educación", x: 28, y: 9, visible: true, order: 27 },
    { id: "poi-28", name: "Colegio Mater Purissima", category: "Educación", x: 24, y: 55, visible: true, order: 28 },
    { id: "poi-29", name: "Universidad de Piura", category: "Educación", x: 73, y: 48, visible: true, order: 29 },
    { id: "poi-30", name: "Falabella", category: "Tiendas", x: 81, y: 43, visible: true, order: 30 },
    { id: "poi-31", name: "Wong", category: "Tiendas", x: 67, y: 55, visible: true, order: 31 },
    { id: "poi-32", name: "Metro", category: "Tiendas", x: 68, y: 55, visible: true, order: 32 },
    { id: "poi-33", name: "Kennedy", category: "Parques", x: 78, y: 55, visible: true, order: 33 },
    { id: "poi-34", name: "Malecón de Miraflores", category: "Parques", x: 41, y: 75, visible: true, order: 34 },
    { id: "poi-35", name: "El Principito", category: "Parques", x: 12, y: 67, visible: true, order: 35 },
    { id: "poi-36", name: "Manuel Solari Swayne", category: "Parques", x: 67, y: 14, visible: true, order: 36 }
  ],
  version: {
    version: "1.0",
    publishedAt: today,
    changes: [
      { id: "c1", date: today, text: "Se cargó contenido inicial desde PARDO-SMART-JUNIO2026-v2.pdf." },
      { id: "c2", date: today, text: "Se configuraron hotspots demostrativos editables en la planta típica." }
    ]
  },
  adminPin: "6640"
};
