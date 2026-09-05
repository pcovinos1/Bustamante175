import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { GalleryImage } from "../types/project";

interface Props {
  images: GalleryImage[];
  initialIndex: number;
  onClose: () => void;
}

export function GalleryModal({ images, initialIndex, onClose }: Props) {
  const [index, setIndex] = useState(initialIndex);
  const image = images[index];
  const go = (direction: number) => setIndex((current) => (current + direction + images.length) % images.length);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") go(-1);
      if (event.key === "ArrowRight") go(1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  return (
    <div className="fixed inset-0 z-50 bg-ink/95 text-white" role="dialog" aria-modal="true">
      <button className="absolute right-5 top-5 z-10 grid min-h-12 min-w-12 place-items-center rounded-full bg-white/10" onClick={onClose} type="button" aria-label="Cerrar galería">
        <X />
      </button>
      <button className="absolute left-5 top-1/2 z-10 grid min-h-14 min-w-14 -translate-y-1/2 place-items-center rounded-full bg-white/10" onClick={() => go(-1)} type="button" aria-label="Imagen anterior">
        <ChevronLeft />
      </button>
      <img className="h-full w-full object-contain p-6 md:p-12" src={image.src} alt={image.title} />
      <button className="absolute right-5 top-1/2 z-10 grid min-h-14 min-w-14 -translate-y-1/2 place-items-center rounded-full bg-white/10" onClick={() => go(1)} type="button" aria-label="Imagen siguiente">
        <ChevronRight />
      </button>
      <div className="absolute bottom-6 left-6 max-w-xl">
        <p className="font-display text-3xl">{image.title}</p>
        {image.description ? <p className="mt-1 text-white/70">{image.description}</p> : null}
      </div>
    </div>
  );
}
