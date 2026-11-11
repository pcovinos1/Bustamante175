import plans from "./bustamantePlans.json";
import type { Project } from "../types/project";

const revision = "bustamante-planos-2026-11-11";
const typicalFloorPlan = plans.generalPlans.find(plan => plan.id === "planta-tipica")!;
const previousDefaultFloorImage = "content/plans/bustamante/flat-x-01-location.webp";
const aliases: Record<string, string> = {
  "flat-302": "flat-202", "flat-303": "flat-203", "flat-304": "flat-204",
  "flat-1001": "flat-901", "flat-1002": "flat-902", "flat-1004": "flat-904", "flat-1005": "flat-905"
};

// Update the catalogue once, preserving the user's floor image, zones and other content.
export function migratePlans(project: Project): Project {
  if (!["bustamante-175", "pardo-664"].includes(project.id) || project.plansRevision === revision) return project;
  const { floorPlan } = project;
  const updateDefaultFloor = floorPlan.hotspots.length === 0 && floorPlan.imageSrc === previousDefaultFloorImage;
  return {
    ...project,
    ...structuredClone(plans) as Pick<Project, "typologies" | "generalPlans" | "areaRange" | "typologySummary">,
    floorPlan: {
      ...floorPlan,
      ...(updateDefaultFloor && {
        imageSrc: typicalFloorPlan.planSrc,
        title: typicalFloorPlan.title,
        updatedAt: typicalFloorPlan.updatedAt
      }),
      hotspots: floorPlan.hotspots.map(zone => ({ ...zone, typologyId: aliases[zone.typologyId] ?? zone.typologyId }))
    },
    plansRevision: revision
  };
}
