import Link from "next/link";
import { ArrowRight } from "@/components/ui/icons";

/** Invitación al asistente de recomendaciones (no depende de datos: siempre disponible). */
export function FinderCta() {
  return (
    <section aria-labelledby="finder-cta-title" className="container-page mt-24 sm:mt-32">
      <div className="rounded-[2rem] bg-blush-soft px-6 py-10 text-center sm:px-12 sm:py-14">
        <p className="eyebrow mb-3">¿No sabes cuál elegir?</p>
        <h2 id="finder-cta-title" className="font-serif text-[2.2rem] font-semibold leading-tight sm:text-[2.8rem]">
          Encuentra tu joya ideal
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-[15px] text-muted">
          Cinco preguntas rápidas: para quién es, la ocasión, el material y tu presupuesto. Te mostramos joyas disponibles que encajan.
        </p>
        <Link href="/asistente" className="btn btn-primary mt-6">
          Empezar <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
