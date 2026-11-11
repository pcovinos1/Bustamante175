export type ViewKey =
  | "home"
  | "menu"
  | "about"
  | "project"
  | "architecture"
  | "location"
  | "amenities"
  | "interiors"
  | "departments"
  | "floor"
  | "compare"
  | "contact"
  | "admin";

export interface ProjectSection {
  id: string;
  title: string;
  summary: string;
  order: number;
  enabled: boolean;
}

export interface GalleryImage {
  id: string;
  title: string;
  description?: string;
  src: string;
  category: "fachada" | "interiores" | "areas" | "barrio" | "arquitectura";
  updatedAt?: string;
}

export interface Gallery {
  id: string;
  title: string;
  category: GalleryImage["category"];
  images: GalleryImage[];
}

export interface Room {
  id: string;
  name: string;
  dimensions?: string;
}

export interface Apartment {
  id: string;
  label: string;
}

export interface Hotspot {
  id: string;
  typologyId: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FloorPlan {
  id: string;
  title: string;
  imageSrc: string;
  hotspots: Hotspot[];
  updatedAt: string;
}

export interface Typology {
  id: string;
  code: string;
  areaM2: number;
  bedrooms: number;
  bathrooms?: number;
  format: "TH" | "Flat" | "Duplex" | "Penthouse" | "Garden home" | "Demostrativo";
  active: boolean;
  planSrc: string;
  thumbnailSrc: string;
  floorThumbnailSrc: string;
  rooms: Room[];
  apartments: Apartment[];
  features: {
    terrace?: boolean;
    study?: boolean;
    walkInCloset?: boolean;
  };
  updatedAt: string;
  notes?: string;
}

export interface PointOfInterest {
  id: string;
  name: string;
  category: "Gastronomía" | "Parques" | "Educación" | "Tiendas" | "Entretenimiento" | "Arte y cultura" | "Espacios abiertos" | "Markets" | "Otros";
  x: number;
  y: number;
  visible: boolean;
  order: number;
  featured?: boolean;
  positioned?: boolean;
  photoSrc?: string;
  photoCredit?: Pick<LocationPhoto, "credit" | "sourceUrl" | "licenseUrl">;
  walkingMinutes?: number;
  walkingSource?: string;
  walkingVerified?: boolean;
}

export interface ChangeLog {
  id: string;
  date: string;
  text: string;
}

export interface ProjectVersion {
  version: string;
  publishedAt: string;
  previousVersion?: string;
  changes: ChangeLog[];
}

export interface AboutSlide {
  id: string;
  number: string;
  text: string;
  keywords: string[];
  imageSrc?: string;
}

export interface AboutProject {
  id: string;
  name: string;
  year: string;
  architect?: string;
  district: "Miraflores" | "San Isidro" | "Barranco" | "Surco" | string;
  imageSrc: string;
  order: number;
}

export interface AboutContent {
  eyebrow: string;
  title: string;
  subtitle: string;
  coverImageSrc?: string;
  slides: AboutSlide[];
  projects: AboutProject[];
}

export interface GeneralPlan {
  id: string;
  title: string;
  planSrc: string;
  thumbnailSrc: string;
  updatedAt: string;
}

export interface Project {
  location?: LocationContent;
  generalPlans?: GeneralPlan[];
  plansRevision?: string;
  id: string;
  name: string;
  developer: string;
  logoText: string;
  logoSrc?: string;
  tagline: string;
  shortDescription: string;
  district: string;
  address: string;
  architect: string;
  certification: string;
  status: string;
  areaRange: string;
  typologySummary: string;
  sharedAreas: string[];
  leedAttributes: string[];
  about: AboutContent;
  sections: ProjectSection[];
  galleries: Gallery[];
  floorPlan: FloorPlan;
  typologies: Typology[];
  pointsOfInterest: PointOfInterest[];
  version: ProjectVersion;
  adminPin: string;
  lastPublishedSnapshot?: Project;
  localDraft?: boolean;
}

export interface MapPosition {
  x: number;
  y: number;
}

export interface MapView extends MapPosition {
  zoom: number;
}

export interface LocationPhoto {
  id: string;
  title: string;
  description: string;
  src: string;
  active: boolean;
  credit?: string;
  sourceUrl?: string;
  licenseUrl?: string;
}

export interface LocationContent {
  storytelling: {
    eyebrow: string;
    title: string;
    description: string;
    mainImageId?: string;
    images: LocationPhoto[];
  };
  map: {
    eyebrow: string;
    title: string;
    description: string;
    imageSrc: string;
    crop?: { x: number; y: number; width: number; height: number };
    projectPosition?: MapPosition;
    initialView: MapView;
  };
  archivedPoints?: PointOfInterest[];
}
