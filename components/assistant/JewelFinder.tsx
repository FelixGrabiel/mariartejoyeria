"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { materialTypes } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/format";
import { recommend, recipients, recommendOccasions, styleOptions, type Answers } from "@/lib/recommend";
import { ProductCard } from "@/components/product/ProductCard";
import { Skeleton } from "@/components/ui/misc";

const budgets: { value: number | null; label: string }[] = [
  { value: 35, label: "Hasta S/ 35" },
  { value: 50, label: "Hasta S/ 50" },
  { value: 80, label: "Hasta S/ 80" },
  { value: null, label: "Sin límite" },
];

const initial: Answers = { recipient: "mi", occasion: "ninguna", material: "cualquiera", budget: null, style: "cualquiera" };

function Choice<T extends string | number | null>({
  legend,
  value,
  options,
  onChange,
}: {
  legend: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-3 font-serif text-[1.4rem] font-semibold">{legend}</legend>
      <div role="radiogroup" aria-label={legend} className="flex flex-wrap gap-2">
        {options.map((o) => (
          <button
            key={String(o.value)}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            onClick={() => onChange(o.value)}
            className={cn(
              "min-h-11 rounded-full border px-5 text-[14px] transition",
              value === o.value ? "border-rose bg-blush-soft font-semibold text-rose-deep" : "border-line bg-white text-ink hover:border-rose/60",
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

export function JewelFinder() {
  const { hydrated, storeProducts } = useStore();
  const [answers, setAnswers] = useState<Answers>(initial);
  const [submitted, setSubmitted] = useState(false);

  const set = <K extends keyof Answers>(key: K, value: Answers[K]) => {
    setAnswers((a) => ({ ...a, [key]: value }));
    setSubmitted(false);
  };

  const result = useMemo(() => recommend(storeProducts, answers), [storeProducts, answers]);
  // El estilo solo se pregunta si al menos un producto lo tiene configurado.
  const hasStyles = storeProducts.some((p) => (p.styles?.length ?? 0) > 0);

  return (
    <div className="container-page pt-8 sm:pt-10">
      <header className="mb-8">
        <p className="eyebrow mb-3">Te ayudamos a elegir</p>
        <h1 className="font-serif text-[2.6rem] font-semibold leading-none sm:text-[3.4rem]">Encuentra tu joya ideal</h1>
        <p className="mt-3 max-w-xl text-[15px] text-muted">
          Cuéntanos para quién es y cuánto quieres invertir. Te mostramos hasta 6 joyas disponibles que encajan con tus respuestas.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[420px_1fr] lg:gap-14">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          className="space-y-7 lg:sticky lg:top-28 lg:self-start"
        >
          <Choice legend="¿Para quién es?" value={answers.recipient} options={[...recipients]} onChange={(v) => set("recipient", v)} />
          <Choice legend="¿Cuál es la ocasión?" value={answers.occasion} options={[...recommendOccasions]} onChange={(v) => set("occasion", v)} />
          <Choice
            legend="¿Qué material prefieres?"
            value={answers.material}
            options={[{ value: "cualquiera" as const, label: "Cualquiera" }, ...materialTypes.map((m) => ({ value: m, label: m }))]}
            onChange={(v) => set("material", v)}
          />
          <Choice legend="¿Cuál es tu presupuesto?" value={answers.budget} options={budgets} onChange={(v) => set("budget", v)} />
          {hasStyles && (
            <Choice
              legend="¿Qué estilo te gusta?"
              value={answers.style}
              options={[{ value: "cualquiera" as const, label: "Me da igual" }, ...styleOptions]}
              onChange={(v) => set("style", v)}
            />
          )}
          <button type="submit" className="btn btn-primary w-full">
            Ver mis recomendaciones
          </button>
        </form>

        <section aria-live="polite" aria-labelledby="finder-results" className="min-w-0">
          <h2 id="finder-results" className="font-serif text-[1.7rem] font-semibold">
            {submitted ? "Tus recomendaciones" : "Así van tus resultados"}
          </h2>
          {!hydrated ? (
            <div className="mt-5 grid grid-cols-2 gap-4" aria-busy="true">
              <Skeleton className="aspect-[4/5]" />
              <Skeleton className="aspect-[4/5]" />
            </div>
          ) : result.results.length === 0 ? (
            <div className="mt-5 rounded-3xl border border-dashed border-line p-7">
              <p className="font-semibold text-ink">No encontramos joyas con todas estas condiciones.</p>
              <p className="mt-1 text-[14px] text-muted">Puedes ampliar la búsqueda:</p>
              <ul className="mt-3 space-y-2 text-[14px]">
                {answers.material !== "cualquiera" && (
                  <li>
                    <button type="button" className="link-underline text-rose-deep" onClick={() => set("material", "cualquiera")}>
                      Aceptar cualquier material
                    </button>{" "}
                    <span className="text-muted">({result.relax?.withoutMaterial ?? 0} joyas)</span>
                  </li>
                )}
                {answers.budget !== null && (
                  <li>
                    <button type="button" className="link-underline text-rose-deep" onClick={() => set("budget", null)}>
                      Quitar el límite de presupuesto
                    </button>{" "}
                    <span className="text-muted">({result.relax?.withoutBudget ?? 0} joyas)</span>
                  </li>
                )}
                {(result.relax?.withoutBoth ?? 0) === 0 && <li className="text-muted">Por ahora no hay joyas disponibles. Vuelve pronto o escríbenos por WhatsApp.</li>}
              </ul>
              <Link href="/catalogo" className="btn btn-secondary mt-5">
                Ver todo el catálogo
              </Link>
            </div>
          ) : (
            <ul className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {result.results.map(({ product, reasons }) => (
                <li key={product.id} className="flex flex-col">
                  <ProductCard product={product} />
                  {reasons.length > 0 && (
                    <ul className="mt-3 space-y-1 text-[12.5px] text-muted">
                      {reasons.map((r) => (
                        <li key={r}>· {r}</li>
                      ))}
                    </ul>
                  )}
                  <p className="mt-1 text-[12px] text-muted">{formatPrice(product.price)} · precio referencial</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
