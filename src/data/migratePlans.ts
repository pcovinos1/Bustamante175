import plans from "./bustamantePlans.json";
import type { Project } from "../types/project";

const revision = "bustamante-planos-2026-11-08";
const aliases: Record<string, string> = {
  "flat-302": "flat-202", "flat-303": "flat-203", "flat-304": "flat-204",
  "flat-1001": "flat-901", "flat-1002": "flat-902", "flat-1004": "flat-904", "flat-1005": "flat-905"
};

// Update the catalogue once, preserving the user's floor image, zones and other content.
export function migratePlans(project: Project): Project {
  if (!["bustamante-175", "pardo-664"].includes(project.id) || project.plansRevision === revision) return project;
  return {
    ...project,
    ...structuredClone(plans) as Pick<Project, "typologies" | "generalPlans" | "areaRange" | "typologySummary">,
    floorPlan: {
      ...project.floorPlan,
      hotspots: project.floorPlan.hotspots.map(zone => ({ ...zone, typologyId: aliases[zone.typologyId] ?? zone.typologyId }))
    },
    plansRevision: revision
  };
}
