"use client";

import Link from "next/link";
import { useStore } from "@/context/StoreContext";
import { ComboCard } from "@/components/combo/ComboCard";
import { ArrowRight } from "@/components/ui/icons";
import { SectionHeading } from "@/components/ui/misc";

/** «Combina y ahorra»: solo aparece cuando la administración tiene combos vigentes. */
export function ComboSection() {
  const { liveCombos } = useStore();
  if (liveCombos.length === 0) return null;
  return (
    <section aria-labelledby="combos-home-title" className="container-page mt-24 sm:mt-32">
      <SectionHeading
        id="combos-home-title"
        eyebrow="Para compartir"
        title="Combina y ahorra"
        action={
          <Link href="/combos" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-deep hover:underline">
            Ver todos <ArrowRight size={15} />
          </Link>
        }
      />
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {liveCombos.slice(0, 3).map((c) => (
          <ComboCard key={c.id} combo={c} />
        ))}
      </div>
    </section>
  );
}
