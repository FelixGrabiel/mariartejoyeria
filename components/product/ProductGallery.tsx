"use client";

import { useState } from "react";
import { cn } from "@/lib/format";
import { ProductImage } from "@/components/ui/ProductImage";
import { ChevronLeft, ChevronRight } from "@/components/ui/icons";

export function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = useState(0);
  const list = images.length ? images : [""];
  const current = list[Math.min(index, list.length - 1)];
  const multiple = list.length > 1;

  const go = (delta: number) => setIndex((i) => (i + delta + list.length) % list.length);

  return (
    <div className={cn("grid gap-3 lg:gap-4", multiple && "lg:grid-cols-[80px_1fr]")}>
      <div className={cn("relative aspect-[4/5] w-full overflow-hidden rounded-[2rem] bg-blush-soft", multiple && "lg:col-start-2 lg:row-start-1")}>
        <ProductImage
          key={current}
          src={current || undefined}
          alt={`${name}, foto ${index + 1} de ${list.length}`}
          sizes="(min-width: 1024px) 560px, 100vw"
          priority
          className="fade-in"
        />
        {multiple && (
          <>
            <button type="button" onClick={() => go(-1)} aria-label="Foto anterior" className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm lg:hidden">
              <ChevronLeft size={20} />
            </button>
            <button type="button" onClick={() => go(1)} aria-label="Foto siguiente" className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-sm lg:hidden">
              <ChevronRight size={20} />
            </button>
            <p className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink lg:hidden">
              {index + 1} / {list.length}
            </p>
          </>
        )}
        {images.length > 0 && (
          <p className="absolute bottom-3 right-3 hidden rounded-full bg-white/85 px-3 py-1 text-[11px] text-muted lg:block">
            Foto referencial de Instagram
          </p>
        )}
      </div>

      {multiple && (
        <div className="flex gap-3 lg:col-start-1 lg:row-start-1 lg:flex-col" role="tablist" aria-label="Miniaturas">
          {list.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Ver foto ${i + 1}`}
              onClick={() => setIndex(i)}
              className={cn(
                "relative aspect-square w-20 overflow-hidden rounded-2xl bg-blush-soft ring-offset-2 ring-offset-ivory transition",
                i === index ? "ring-2 ring-rose" : "opacity-70 hover:opacity-100",
              )}
            >
              <ProductImage src={src || undefined} alt="" sizes="80px" compact />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
