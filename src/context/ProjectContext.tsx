import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getProject, prepareProject, saveProject } from "../services/db";
import { compareProjectVersions, fetchRemoteProject } from "../services/files";
import type { Project } from "../types/project";

type SaveStatus = "idle" | "saving" | "saved" | "error";
type ProjectUpdate = Project | ((project: Project) => Project);
type SaveMode = "edit" | "publish" | "replace";

interface ProjectContextValue {
  project: Project | null;
  loading: boolean;
  saveStatus: SaveStatus;
  updateProject: (updater: ProjectUpdate, mode?: SaveMode) => Promise<void>;
  syncFromRemote: (replaceDraft?: boolean) => Promise<Project | null>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const current = useRef<Project | null>(null);
  const writes = useRef(Promise.resolve());

  const updateProject = useCallback(async (updater: ProjectUpdate, mode: SaveMode = "edit") => {
    const previous = current.current;
    if (!previous) return;
    const updated = typeof updater === "function" ? updater(previous) : updater;
    const next = mode === "replace"
      ? prepareProject({ ...updated, localDraft: false })
      : { ...updated, localDraft: mode === "edit" };
    current.current = next;
    setProject(next);
    setSaveStatus("saving");
    if (mode === "edit") {
      // The project includes large images. Batch rapid input changes into one IndexedDB write.
      await new Promise<void>((resolve) => window.setTimeout(resolve, 350));
      if (current.current !== next) return;
    }
    const write = writes.current.then(() => saveProject(next));
    writes.current = write.catch(() => undefined);
    try {
      await write;
      if (current.current === next) setSaveStatus("saved");
    } catch (error) {
      if (current.current === next) {
        if (mode !== "edit") {
          current.current = previous;
          setProject(previous);
        }
        setSaveStatus("error");
      }
      throw error;
    }
  }, []);

  const syncFromRemote = useCallback(async (replaceDraft = false) => {
    const before = current.current;
    if (!before || (before.localDraft && !replaceDraft)) return null;
    const remote = await fetchRemoteProject(before);
    const latest = current.current;
    if (!remote || latest !== before || compareProjectVersions(remote, latest) <= 0) return null;
    await updateProject(remote, "replace");
    return remote;
  }, [updateProject]);

  useEffect(() => {
    let active = true;
    void getProject().then((next) => {
      if (!active) return;
      current.current = next;
      setProject(next);
      setLoading(false);
      if (navigator.onLine) void syncFromRemote().catch(() => undefined);
    });
    return () => { active = false; };
  }, [syncFromRemote]);

  useEffect(() => {
    const syncWhenOnline = () => {
      if (navigator.onLine) void syncFromRemote().catch(() => undefined);
    };
    const syncWhenVisible = () => {
      if (document.visibilityState === "visible") syncWhenOnline();
    };
    const interval = window.setInterval(syncWhenOnline, 60_000);
    window.addEventListener("online", syncWhenOnline);
    window.addEventListener("focus", syncWhenOnline);
    document.addEventListener("visibilitychange", syncWhenVisible);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener("online", syncWhenOnline);
      window.removeEventListener("focus", syncWhenOnline);
      document.removeEventListener("visibilitychange", syncWhenVisible);
    };
  }, [syncFromRemote]);

  useEffect(() => {
    if (saveStatus !== "saving" && saveStatus !== "error") return;
    const preventLoss = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", preventLoss);
    return () => window.removeEventListener("beforeunload", preventLoss);
  }, [saveStatus]);

  const value = useMemo(() => ({ project, loading, saveStatus, updateProject, syncFromRemote }), [project, loading, saveStatus, updateProject, syncFromRemote]);
  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
}

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject debe usarse dentro de ProjectProvider");
  return ctx;
}
