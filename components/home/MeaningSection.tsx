"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ArrowRight } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/misc";

/** «Joyas con significado»: solo se muestra cuando la administración tiene temas activos con productos. */
export function MeaningSection() {
  const { activeThemes, storeProducts } = useStore();
  const themes = activeThemes.filter((t) => storeProducts.some((p) => p.themeIds?.includes(t.id)));
  if (themes.length === 0) return null;

  return (
    <section aria-labelledby="meaning-home-title" className="container-page mt-24 sm:mt-32">
      <SectionHeading
        id="meaning-home-title"
        eyebrow="Joyas con significado"
        title="Elige según lo que quieres expresar"
        description="Los significados son simbólicos y culturales: una forma de dedicar la joya, no una promesa de efectos."
      />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {themes.map((t) => (
          <li key={t.id}>
            <Link
              href={`/catalogo?tema=${t.id}`}
              className="group flex h-full flex-col rounded-3xl border border-line bg-white p-6 transition hover:border-rose/50 hover:shadow-sm"
            >
              <h3 className="font-serif text-[1.5rem] font-semibold text-ink">{t.name}</h3>
              {t.description && <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed text-muted">{t.description}</p>}
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[13px] font-semibold text-rose-deep">
                Ver joyas <ArrowRight size={15} className="transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
