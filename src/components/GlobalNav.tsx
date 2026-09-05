import { Armchair, Home, Info, MapPin, PenTool, Sparkles, Trees, Settings } from "lucide-react";
import type { ComponentType } from "react";
import type { ViewKey } from "../types/project";

interface Props {
  current: ViewKey;
  onNavigate: (view: ViewKey) => void;
}

const items: Array<{ view: ViewKey; label: string; icon: ComponentType<{ className?: string }> }> = [
  { view: "home", label: "Inicio", icon: Home },
  { view: "about", label: "About us", icon: Info },
  { view: "project", label: "Proyecto", icon: Sparkles },
  { view: "location", label: "Ubicación", icon: MapPin },
  { view: "amenities", label: "Áreas comunes", icon: Trees },
  { view: "interiors", label: "Interiores", icon: Armchair },
  { view: "departments", label: "Departamentos", icon: PenTool }
];

export function GlobalNav({ current, onNavigate }: Props) {
  return (
    <nav className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-1.5rem)] max-w-6xl -translate-x-1/2 items-center justify-between gap-1 rounded-full border border-ink/10 bg-paper/90 p-2 shadow-soft backdrop-blur-xl">
      {items.map((item) => {
        const Icon = item.icon;
        const active = current === item.view || (item.view === "departments" && ["floor", "typology", "compare"].includes(current));
        return (
          <button
            key={item.view}
            className={`flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-3 text-xs font-semibold transition active:scale-95 md:text-sm ${
              active ? "bg-morada text-white" : "text-ink/70 hover:bg-white/70"
            }`}
            onClick={() => onNavigate(item.view)}
            type="button"
          >
            <Icon className="size-5" />
            <span className="hidden sm:inline">{item.label}</span>
          </button>
        );
      })}
      <button className="grid min-h-12 min-w-12 place-items-center rounded-full text-ink/50 transition hover:bg-white/70 active:scale-95" onClick={() => onNavigate("admin")} type="button" aria-label="Administrador">
        <Settings className="size-5" />
      </button>
      <span className="sr-only">Vista actual: {current}</span>
    </nav>
  );
}
