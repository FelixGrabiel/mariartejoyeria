"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { isSoldOut } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/format";
import { cleanDedication, dedicationError, occasions, unitsForSku } from "@/lib/gift";
import { QuantitySelector } from "@/components/product/QuantitySelector";
import { VariantSelector } from "@/components/product/VariantSelector";
import { EmptyState } from "@/components/ui/EmptyState";
import { ArrowLeft, Check, Gift, ShoppingBag } from "@/components/ui/icons";
import { DemoNotice, Skeleton } from "@/components/ui/misc";
import { ProductImage } from "@/components/ui/ProductImage";

const steps = ["Joya", "Ocasión", "Empaque", "Dedicatoria", "Resumen"] as const;

export function GiftBuilder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams?.get("producto") ?? null;
  const { hydrated, storeProducts, activePackaging, themes, dedicationMax, addToCart, cart } = useStore();
  const { showToast } = useToast();

  const [step, setStep] = useState(0);
  const [productId, setProductId] = useState<string | undefined>();
  const [sku, setSku] = useState<string | undefined>();
  const [occasion, setOccasion] = useState<string>("");
  const [packagingId, setPackagingId] = useState<string>("");
  const [dedication, setDedication] = useState("");
  const [meaningCard, setMeaningCard] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const giftProducts = useMemo(() => storeProducts.filter((p) => p.giftEnabled && !isSoldOut(p)), [storeProducts]);

  // Si llegan desde una ficha (?producto=slug), arrancamos con esa joya.
  useEffect(() => {
    if (!preselect || productId) return;
    const found = giftProducts.find((p) => p.slug === preselect);
    if (found) {
      setProductId(found.id);
      setSku(found.variants.find((v) => v.stock > 0)?.sku);
    }
  }, [preselect, giftProducts, productId]);

  const product = giftProducts.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.sku === sku);
  const packaging = activePackaging.find((o) => o.id === packagingId);
  const stock = variant?.stock ?? 0;
  const maxAddable = Math.max(0, stock - (sku ? unitsForSku(cart, sku) : 0));
  const qty = Math.min(quantity, Math.max(1, maxAddable));
  const unit = (product?.price ?? 0) + (packaging?.price ?? 0);
  const dedicationProblem = dedicationError(dedication, dedicationMax);
  const productThemes = themes.filter((t) => product?.themeIds?.includes(t.id));

  const stepValid = [
    Boolean(product && variant && variant.stock > 0),
    Boolean(occasion),
    true,
    !dedicationProblem,
    Boolean(product && variant && maxAddable > 0),
  ];

  function selectProduct(id: string) {
    const p = giftProducts.find((x) => x.id === id);
    setProductId(id);
    setSku(p?.variants.find((v) => v.stock > 0)?.sku);
    setQuantity(1);
  }

  function handleAdd() {
    if (!product || !variant) return;
    const result = addToCart(product.id, variant.sku, qty, {
      occasion,
      packagingId: packaging?.id,
      dedication: cleanDedication(dedication, dedicationMax),
      meaningCard,
    });
    showToast(result.message, {
      tone: result.ok ? "success" : "error",
      action: result.ok ? { label: "Ver carrito", href: "/carrito" } : undefined,
    });
    if (result.ok) router.push("/carrito");
  }

  if (!hydrated) {
    return (
      <div className="container-page grid gap-6 py-10" aria-busy="true">
        <Skeleton className="h-10 w-1/2" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (giftProducts.length === 0) {
    return (
      <div className="container-page">
        <EmptyState
          title="Aún no hay joyas para regalo personalizado"
          description="La tienda todavía no activó la personalización en sus productos. Mientras tanto puedes explorar el catálogo y dejar una dedicatoria desde el carrito."
          action={
            <Link href="/catalogo" className="btn btn-primary">
              Ir al catálogo
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page pt-8 sm:pt-10">
      <header className="mb-8">
        <p className="eyebrow mb-3">Regalos que cuentan historias</p>
        <h1 className="font-serif text-[2.6rem] font-semibold leading-none sm:text-[3.4rem]">Arma tu regalo</h1>
        <p className="mt-3 max-w-xl text-[15px] text-muted">
          Elige la joya, la ocasión, el empaque y escribe tu dedicatoria. Lo agregamos a tu carrito y lo confirmas por WhatsApp.
        </p>
      </header>

      <ol className="mb-8 flex flex-wrap gap-2" aria-label="Pasos">
        {steps.map((label, i) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => i <= step && setStep(i)}
              disabled={i > step}
              aria-current={i === step ? "step" : undefined}
              className={cn(
                "inline-flex h-9 items-center gap-2 rounded-full px-4 text-[13px] font-medium transition",
                i === step ? "bg-ink text-ivory" : i < step ? "bg-blush-soft text-rose-deep" : "border border-line bg-white text-muted",
              )}
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/20 text-[11px]">
                {i < step ? <Check size={12} /> : i + 1}
              </span>
              {label}
            </button>
          </li>
        ))}
      </ol>

      <div className="grid gap-8 lg:grid-cols-[1fr_340px] lg:gap-12">
        <section aria-live="polite" className="min-w-0">
          {step === 0 && (
            <div>
              <h2 className="font-serif text-[1.7rem] font-semibold">1. ¿Qué joya vas a regalar?</h2>
              <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {giftProducts.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => selectProduct(p.id)}
                      aria-pressed={p.id === productId}
                      className={cn(
                        "block w-full overflow-hidden rounded-2xl border text-left transition",
                        p.id === productId ? "border-rose ring-2 ring-rose" : "border-line hover:border-rose/60",
                      )}
                    >
                      <span className="relative block aspect-[4/5] bg-blush-soft">
                        <ProductImage src={p.images[0]} alt={p.name} sizes="(min-width: 640px) 220px, 45vw" compact />
                      </span>
                      <span className="block px-3 py-2.5">
                        <span className="block text-[14px] font-semibold leading-tight text-ink">{p.name}</span>
                        <span className="text-[13px] text-muted">{formatPrice(p.price)}</span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              {product && (product.variants.length > 1 || product.variantName) && (
                <div className="mt-6">
                  <VariantSelector
                    name={product.variantName ?? "Opción"}
                    variants={product.variants}
                    value={sku}
                    onChange={(next) => {
                      setSku(next);
                      setQuantity(1);
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="font-serif text-[1.7rem] font-semibold">2. ¿Para qué ocasión es?</h2>
              <div role="radiogroup" aria-label="Ocasión" className="mt-5 flex flex-wrap gap-2">
                {occasions.map((o) => (
                  <button
                    key={o}
                    type="button"
                    role="radio"
                    aria-checked={occasion === o}
                    onClick={() => setOccasion(o)}
                    className={cn(
                      "min-h-11 rounded-full border px-5 text-[14px] transition",
                      occasion === o ? "border-rose bg-blush-soft font-semibold text-rose-deep" : "border-line bg-white text-ink hover:border-rose/60",
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="font-serif text-[1.7rem] font-semibold">3. Elige el empaque</h2>
              <div role="radiogroup" aria-label="Empaque" className="mt-5 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  role="radio"
                  aria-checked={!packagingId}
                  onClick={() => setPackagingId("")}
                  className={cn("rounded-2xl border p-4 text-left transition", !packagingId ? "border-rose bg-blush-soft" : "border-line bg-white hover:border-rose/60")}
                >
                  <p className="font-semibold text-ink">Sin empaque especial</p>
                  <p className="mt-1 text-[13px] text-muted">La pieza se entrega con la presentación habitual.</p>
                </button>
                {activePackaging.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    role="radio"
                    aria-checked={packagingId === o.id}
                    onClick={() => setPackagingId(o.id)}
                    className={cn("rounded-2xl border p-4 text-left transition", packagingId === o.id ? "border-rose bg-blush-soft" : "border-line bg-white hover:border-rose/60")}
                  >
                    <p className="font-semibold text-ink">{o.name}</p>
                    {o.description && <p className="mt-1 text-[13px] text-muted">{o.description}</p>}
                    <p className="mt-2 text-[13px] font-semibold text-rose-deep">{o.price > 0 ? `+ ${formatPrice(o.price)} por regalo` : "Sin costo adicional"}</p>
                  </button>
                ))}
              </div>
              {activePackaging.length === 0 && (
                <p className="mt-4 text-[13px] text-muted">La tienda aún no configuró empaques. Puedes continuar sin empaque especial.</p>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="font-serif text-[1.7rem] font-semibold">4. Escribe tu dedicatoria</h2>
              <p className="mt-1 text-[13px] text-muted">Opcional. Se imprime o escribe en una tarjeta que acompaña tu regalo.</p>
              <label htmlFor="gift-dedication" className="field-label mt-5">Dedicatoria</label>
              <textarea
                id="gift-dedication"
                rows={4}
                value={dedication}
                onChange={(e) => setDedication(e.target.value)}
                className="field resize-none"
                placeholder="Ej.: «Para mamá, con todo mi cariño»"
                aria-invalid={Boolean(dedicationProblem)}
                aria-describedby="gift-dedication-count"
              />
              <p id="gift-dedication-count" className={cn("mt-1 text-right text-[12px]", dedicationProblem ? "font-semibold text-danger" : "text-muted")}>
                {dedication.trim().length}/{dedicationMax}
              </p>
              {dedicationProblem && (
                <p role="alert" className="field-error">
                  {dedicationProblem}
                </p>
              )}

              <div className="mt-4 rounded-3xl bg-blush-soft/70 p-6 text-center" aria-label="Vista previa de la tarjeta">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose">Vista previa{occasion ? ` · ${occasion}` : ""}</p>
                <p className="mt-3 whitespace-pre-wrap break-words font-serif text-[1.35rem] italic leading-snug text-ink">
                  {dedication.trim() ? `«${dedication.trim()}»` : "Tu dedicatoria aparecerá aquí"}
                </p>
              </div>

              <label className="mt-5 flex cursor-pointer items-start gap-3 text-[14px]">
                <input type="checkbox" checked={meaningCard} onChange={(e) => setMeaningCard(e.target.checked)} className="mt-1 h-4 w-4 accent-rose" />
                <span>
                  <span className="font-semibold text-ink">Agregar la tarjeta «El significado de tu joya»</span>
                  <span className="block text-[13px] text-muted">
                    {product?.meaning
                      ? product.meaning
                      : productThemes.length > 0
                        ? productThemes.map((t) => t.description).filter(Boolean).join(" ")
                        : "Una breve explicación simbólica de la joya que regalas."}
                  </span>
                </span>
              </label>
              <p className="mt-2 text-[12px] text-muted">Es un significado simbólico; no promete protección ni otros efectos.</p>
            </div>
          )}

          {step === 4 && product && variant && (
            <div>
              <h2 className="font-serif text-[1.7rem] font-semibold">5. Revisa tu regalo</h2>
              <dl className="mt-5 divide-y divide-line rounded-2xl border border-line bg-white text-[14px]">
                <Row label="Joya" value={product.name} />
                {product.variantName && <Row label={product.variantName} value={variant.label} />}
                <Row label="Ocasión" value={occasion} />
                <Row label="Empaque" value={packaging ? `${packaging.name}${packaging.price > 0 ? ` (+${formatPrice(packaging.price)})` : ""}` : "Sin empaque especial"} />
                <Row label="Dedicatoria" value={dedication.trim() ? `«${dedication.trim()}»` : "Sin dedicatoria"} />
                <Row label="Tarjeta de significado" value={meaningCard ? "Sí" : "No"} />
              </dl>
              <div className="mt-5 flex flex-wrap items-center gap-4">
                <QuantitySelector value={qty} max={Math.max(1, maxAddable)} onChange={setQuantity} disabled={maxAddable === 0} label="Cantidad de regalos" />
                <p className="text-[13px] text-muted">
                  {maxAddable === 0
                    ? "No quedan unidades disponibles de esta opción."
                    : `Disponibles: ${maxAddable} ${maxAddable === 1 ? "unidad" : "unidades"}.`}
                </p>
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between gap-3">
            <button type="button" className="btn btn-ghost -ml-4" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
              <ArrowLeft size={17} /> Atrás
            </button>
            {step < steps.length - 1 ? (
              <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)} disabled={!stepValid[step]}>
                Continuar
              </button>
            ) : (
              <button type="button" className="btn btn-primary" onClick={handleAdd} disabled={!stepValid[step]}>
                <ShoppingBag size={18} /> Agregar regalo al carrito
              </button>
            )}
          </div>
        </section>

        <aside aria-label="Resumen del regalo" className="card h-fit p-6 lg:sticky lg:top-28">
          <p className="flex items-center gap-2 font-serif text-[1.5rem] font-semibold">
            <Gift size={20} className="text-rose" /> Tu regalo
          </p>
          {product ? (
            <div className="mt-4 text-[14px]">
              <p className="font-semibold text-ink">{product.name}</p>
              {variant && product.variantName && <p className="text-muted">{product.variantName}: {variant.label}</p>}
              <dl className="mt-4 space-y-2">
                <div className="flex justify-between"><dt className="text-muted">Joya</dt><dd className="tabular-nums">{formatPrice(product.price)}</dd></div>
                <div className="flex justify-between"><dt className="text-muted">Empaque</dt><dd className="tabular-nums">{packaging ? (packaging.price > 0 ? formatPrice(packaging.price) : "Sin costo") : "—"}</dd></div>
                <div className="flex justify-between border-t border-line pt-3 font-semibold"><dt>Total ({qty})</dt><dd className="tabular-nums">{formatPrice(unit * qty)}</dd></div>
              </dl>
              <p className="mt-2 text-[12px] text-muted">Precio referencial, sin envío.</p>
            </div>
          ) : (
            <p className="mt-3 text-[13px] text-muted">Elige una joya para empezar.</p>
          )}
        </aside>
      </div>

      <DemoNotice className="mt-10">
        Enviar el pedido por WhatsApp es una solicitud: la tienda confirma disponibilidad, precio final, pago y envío. Esta web no realiza cobros.
      </DemoNotice>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[130px_1fr] gap-3 px-4 py-3 sm:grid-cols-[180px_1fr]">
      <dt className="text-muted">{label}</dt>
      <dd className="min-w-0 break-words text-ink">{value}</dd>
    </div>
  );
}
