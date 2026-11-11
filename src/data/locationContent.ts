import referenceMap from "../assets/location/barranco-reference.png";
import architecture from "../assets/location/arquitectura.jpg";
import culture from "../assets/location/cultura.jpg";
import dining from "../assets/location/gastronomia.jpg";
import outdoors from "../assets/location/espacios.jpg";
import credits from "../assets/location/credits.json";
import type { LocationContent, LocationPhoto, PointOfInterest, Project } from "../types/project";

// Positions transcribed from the numbered markers in the supplied Barranco reference.
// The crop is the map area in that original 1478 × 1036 screenshot.
const crop = { x: 541 / 1478, y: 25 / 1036, width: 916 / 1478, height: 1001 / 1036 };
const locations: Array<[string, PointOfInterest["category"], number, number]> = [
  ["La 73", "Gastronomía", 754, 704],
  ["Florencia Vegan Kitchen", "Gastronomía", 969, 396],
  ["Sofá Café", "Gastronomía", 910, 687],
  ["La Cuadra de Salvador", "Gastronomía", 922, 602],
  ["Hotel B", "Gastronomía", 1050, 734],
  ["Caleta Dolsa", "Gastronomía", 1139, 709],
  ["Santa Madre", "Gastronomía", 934, 384],
  ["Cosmo Café", "Gastronomía", 786, 638],
  ["Monotono Coffee", "Gastronomía", 791, 544],
  ["The Coffee", "Gastronomía", 780, 581],
  ["Crudo Cocina", "Gastronomía", 1133, 502],
  ["Canta Rana", "Gastronomía", 1371, 604],
  ["Colonia & Co", "Gastronomía", 1423, 630],
  ["Delifrance", "Gastronomía", 1208, 603],
  ["La Linterna", "Gastronomía", 1228, 572],
  ["Vecino Pizzas", "Gastronomía", 943, 427],
  ["Vicio Marino", "Gastronomía", 978, 244],
  ["Creamer", "Gastronomía", 934, 194],
  ["La Esquina de Chicho", "Gastronomía", 696, 304],
  ["Puna", "Tiendas", 1313, 632],
  ["Monoblock", "Tiendas", 1360, 669],
  ["Espacio Encuentro", "Tiendas", 1125, 538],
  ["El Clóset de mi Hermana", "Tiendas", 900, 631],
  ["Zaniti Tea Shop", "Tiendas", 1273, 539],
  ["Galería Wu", "Arte y cultura", 1082, 658],
  ["Dédalo", "Arte y cultura", 1108, 768],
  ["MAC", "Arte y cultura", 581, 678],
  ["Casa Rocaverde", "Arte y cultura", 999, 750],
  ["Teatro Barranco", "Arte y cultura", 1163, 580],
  ["Museo Jade Rivera", "Arte y cultura", 1104, 732],
  ["Revolver Galería", "Arte y cultura", 862, 629],
  ["Feria ecológica", "Markets", 680, 691],
  ["La Sanahoria", "Markets", 928, 655],
  ["Metro Grau", "Markets", 1358, 553],
  ["Metro Óvalo Balta", "Markets", 833, 103],
  ["Plaza San Francisco", "Espacios abiertos", 1215, 410],
  ["Smart Fit Barranco", "Otros", 855, 574],
  ["Gimnasio b2 Barranco", "Otros", 1119, 586],
  ["Be Move", "Otros", 697, 268]
];
// Hide the numbered symbols printed in the reference so only the selected filter's
// interactive markers are visible. The original image and its street geometry are retained.
const printedSymbols = locations.map(([, , x, y]) => `<circle cx="${x}" cy="${y}" r="21" fill="black"/>`).join("");
const mask = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="541 25 916 1001" preserveAspectRatio="none"><mask id="markers"><rect x="541" y="25" width="916" height="1001" fill="white"/>${printedSymbols}<path d="M 864,178 C 901,178 929,207 929,244 C 929,264 924,276 914,293 L 864,371 L 814,293 C 804,276 799,264 799,244 C 799,207 827,178 864,178 Z" fill="black"/></mask><rect x="541" y="25" width="916" height="1001" fill="white" mask="url(#markers)"/></svg>`;
export const referenceMapMask = `url("data:image/svg+xml,${encodeURIComponent(mask)}")`;
const featuredNumbers = new Set([1, 5, 12, 25, 26, 27, 32, 36]);

function photo(id: string, title: string, description: string, src: string, file: string): LocationPhoto {
  const credit = credits.find((item) => item.file === file);
  return {
    id, title, description, src, active: true,
    credit: credit ? `${credit.author} · ${credit.license}` : undefined,
    sourceUrl: credit?.source,
    licenseUrl: credit?.licenseUrl
  };
}

export const locationDefaults: LocationContent = {
  storytelling: {
    eyebrow: "BUSTAMANTE 175 / EL BARRIO",
    title: "Barranco es parte de nuestra esencia.",
    description: "Entre calles llenas de historia, propuestas gastronómicas y espacios culturales, descubre un barrio que siempre tiene algo nuevo por contar.",
    mainImageId: "barranco-architecture",
    images: [
      photo("barranco-dining", "Gastronomía", "Canta Rana, Barranco.", dining, "gastronomia.jpg"),
      photo("barranco-culture", "Arte y cultura", "Arte urbano en las calles de Barranco.", culture, "cultura.jpg"),
      photo("barranco-architecture", "Arquitectura", "Casona del Hotel B, Barranco.", architecture, "arquitectura.jpg"),
      photo("barranco-outdoors", "Espacios abiertos", "Malecón de Barranco y Miraflores.", outdoors, "espacios.jpg")
    ]
  },
  map: {
    eyebrow: "BUSTAMANTE 175 / UBICACIÓN",
    title: "Todo cerca de tu morada.",
    description: "Explora los lugares de Barranco en el mapa del barrio.",
    imageSrc: referenceMap,
    crop,
    // The pin tip in the supplied reference identifies this position.
    projectPosition: { x: (864 - 541) / 916 * 100, y: (369 - 25) / 1001 * 100 },
    initialView: { x: (864 - 541) / 916 * 100, y: (369 - 25) / 1001 * 100, zoom: 1.12 }
  }
};

export function migrateLocation(project: Project): Project {
  if (project.location) return project;
  const previousImages = project.galleries.find((gallery) => gallery.id === "barrio")?.images.slice(1) ?? [];
  const images = previousImages.length
    ? previousImages.map((image) => ({ ...image, description: image.description ?? "", active: true }))
    : locationDefaults.storytelling.images;
  const [diningCredit, , architectureCredit] = locationDefaults.storytelling.images;
  const photoCredits = new Map([[5, architectureCredit], [12, diningCredit]]);
  const pointsOfInterest = locations.map(([name, category, x, y], index): PointOfInterest => {
    const order = index + 1;
    const photo = photoCredits.get(order);
    return {
      id: `barranco-${order}`, name, category,
      x: (x - 541) / 916 * 100,
      y: (y - 25) / 1001 * 100,
      visible: true, order, featured: featuredNumbers.has(order),
      photoSrc: photo?.src,
      photoCredit: photo ? { credit: photo.credit, sourceUrl: photo.sourceUrl, licenseUrl: photo.licenseUrl } : undefined
    };
  });
  return {
    ...project,
    location: {
      storytelling: { ...locationDefaults.storytelling, images, mainImageId: previousImages[0]?.id ?? locationDefaults.storytelling.mainImageId },
      map: { ...locationDefaults.map },
      archivedPoints: (project.pointsOfInterest ?? []).map((point) => ({ ...point }))
    },
    pointsOfInterest
  };
}
