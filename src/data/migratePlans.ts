import plans from "./bustamantePlans.json";
import type { Project } from "../types/project";

const revision = "bustamante-bus-38-v1";

// Migrate the catalogue independently of locally published project versions.
// Preserve the user's other content and subsequent catalogue edits.
export function migratePlans(project: Project): Project {
  if (project.id !== "bustamante-175" || project.plansRevision === revision) return project;
  return {
    ...project,
    ...structuredClone(plans) as Pick<Project, "typologies" | "floorPlan" | "areaRange" | "typologySummary">,
    plansRevision: revision
  };
}
