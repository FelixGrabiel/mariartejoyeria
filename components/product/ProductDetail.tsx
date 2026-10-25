"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { getCategory } from "@/data/categories";
import { site } from "@/data/site";
import { firstAvailableVariant, isSoldOut } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/format";
import { buildProductMessage, whatsappUrl } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SearchIllustration } from "@/components/ui/EmptyState";
import { ChevronDown, ChevronRight, Gift, Heart, MessageCircle, Package, ShoppingBag, Truck } from "@/components/ui/icons";
import { DemoNotice, SectionHeading, Skeleton } from "@/components/ui/misc";
import { ProductGallery } from "./ProductGallery";
import { ProductGrid } from "./ProductGrid";
import { QuantitySelector } from "./QuantitySelector";
import { StockStatus } from "./StockStatus";
import { VariantSelector } from "./VariantSelector";

function InfoAccordion({ title, icon, children, defaultOpen = false }: { title: string; icon: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  return (
    <details className="group border-b border-line py-1" open={defaultOpen}>
      <summary className="flex min-h-14 cursor-pointer list-none items-center gap-3 text-[15px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
        <span className="text-rose">{icon}</span>
        <span className="flex-1">{title}</span>
        <ChevronDown size={18} className="text-muted transition group-open:rotate-180" />
      </summary>
      <div className="pb-5 pl-8 text-sm leading-relaxed text-muted">{children}</div>
    </details>
  );
}

export function ProductDetail({ slug }: { slug: string }) {
  const { hydrated, getProductBySlug, storeProducts, addToCart, isFavorite, toggleFavorite, cart } = useStore();
  const { showToast } = useToast();
  const product = getProductBySlug(slug);

  const [sku, setSku] = useState<string | undefined>(undefined);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (product) {
      setSku((current) => {
        const stillValid = product.variants.find((v) => v.sku === current && v.stock > 0);
        return stillValid ? current : firstAvailableVariant(product)?.sku ?? product.variants[0]?.sku;
      });
    }
  }, [product]);

  const related = useMemo(() => {
    if (!product) return [];
    const same = storeProducts.filter((p) => p.id !== product.id && p.categoryId === product.categoryId);
    const others = storeProducts.filter((p) => p.id !== product.id && p.categoryId !== product.categoryId && p.featured);
    return [...same, ...others].slice(0, 4);
  }, [product, storeProducts]);

  if (!hydrated) {
    return (
      <div className="container-page grid gap-10 py-10 lg:grid-cols-2" aria-busy="true">
        <Skeleton className="aspect-[4/5] w-full rounded-[2rem]" />
        <div className="space-y-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-12 w-3/4" />
          <Skeleton className="h-6 w-1/5" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!product || !product.active) {
    return (
      <div className="container-page">
        <EmptyState
          illustration={<SearchIllustration />}
          title="No encontramos esta joya"
          description="Puede que ya no esté disponible o que el enlace haya cambiado."
          action={
            <Link href="/catalogo" className="btn btn-primary">
              Ver catálogo
            </Link>
          }
        />
      </div>
    );
  }

  const category = getCategory(product.categoryId);
  const variant = product.variants.find((v) => v.sku === sku);
  const stock = variant?.stock ?? 0;
  const inCart = cart.find((i) => i.productId === product.id && i.sku === sku)?.quantity ?? 0;
  const maxAddable = Math.max(0, stock - inCart);
  const soldOutAll = isSoldOut(product);
  const favorite = isFavorite(product.id);
  const qty = Math.min(quantity, Math.max(1, maxAddable));

  function handleAdd() {
    if (!variant || !product) return;
    const result = addToCart(product.id, variant.sku, qty);
    showToast(result.message, {
      tone: result.ok ? "success" : "error",
      action: result.ok ? { label: "Ver carrito", href: "/carrito" } : undefined,
    });
    if (result.ok) setQuantity(1);
  }

  return (
    <>
      <div className="container-page pt-6 sm:pt-8">
        <nav aria-label="Ruta de navegación" className="mb-6 text-[13px] text-muted">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-ink">Inicio</Link>
            </li>
            <li aria-hidden="true"><ChevronRight size={13} /></li>
            <li>
              <Link href={`/catalogo?categoria=${product.categoryId}`} className="hover:text-ink">{category?.name}</Link>
            </li>
            <li aria-hidden="true"><ChevronRight size={13} /></li>
            <li aria-current="page" className="text-ink">{product.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr] lg:gap-14">
          <ProductGallery images={product.images} name={product.name} />

          <div className="lg:pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="blush">{category?.name}</Badge>
              {product.isNew && <Badge tone="champagne">Nuevo</Badge>}
              <Badge tone="neutral">Producto de ejemplo</Badge>
            </div>

            <h1 className="mt-4 font-serif text-[2.4rem] font-semibold leading-[1.02] text-ink sm:text-[3.1rem]">{product.name}</h1>
            <p className="mt-3 text-2xl font-semibold text-ink">
              {formatPrice(product.price)}
              <span className="ml-2 align-middle text-xs font-medium text-muted">precio referencial</span>
            </p>

            <p className="mt-5 max-w-prose text-[15px] leading-relaxed text-muted">{product.description}</p>

            <dl className="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-[13px]">
              <dt className="font-semibold text-ink">Material</dt>
              <dd className="text-muted">{product.material}</dd>
              <dt className="font-semibold text-ink">SKU</dt>
              <dd className="text-muted">{variant?.sku ?? "—"} <span className="text-muted/70">(ficticio)</span></dd>
            </dl>

            <div className="mt-7 space-y-6 border-t border-line pt-7">
              {(product.variants.length > 1 || product.variantName) && (
                <VariantSelector
                  name={product.variantName ?? "Opción"}
                  variants={product.variants}
                  value={sku}
                  onChange={(next) => {
                    setSku(next);
                    setQuantity(1);
                  }}
                />
              )}

              <div>
                <StockStatus stock={stock} />
                {inCart > 0 && (
                  <p className="mt-1 text-[13px] text-muted">
                    Ya tienes {inCart} en tu carrito{maxAddable === 0 ? " (máximo disponible)." : "."}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex gap-3">
                  <QuantitySelector value={qty} max={Math.max(1, maxAddable)} onChange={setQuantity} disabled={maxAddable === 0} />
                  <button type="button" className="btn btn-primary flex-1 whitespace-nowrap px-4" onClick={handleAdd} disabled={!variant || maxAddable === 0}>
                    <ShoppingBag size={18} />
                    {soldOutAll ? "Agotado" : stock === 0 ? "Opción agotada" : "Agregar al carrito"}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(product.id)}
                    aria-pressed={favorite}
                    aria-label={favorite ? "Quitar de favoritos" : "Guardar en favoritos"}
                    className={cn("btn btn-secondary hidden w-12 shrink-0 px-0 sm:inline-flex", favorite && "text-rose")}
                  >
                    <Heart size={19} fill={favorite ? "currentColor" : "none"} />
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  aria-pressed={favorite}
                  className={cn("btn btn-secondary w-full sm:hidden", favorite && "text-rose")}
                >
                  <Heart size={19} fill={favorite ? "currentColor" : "none"} />
                  {favorite ? "En favoritos" : "Guardar en favoritos"}
                </button>
              </div>

              <a
                href={whatsappUrl(buildProductMessage(product, variant, qty))}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-whatsapp w-full"
              >
                <MessageCircle size={18} /> Comprar por WhatsApp
              </a>
              <p className="-mt-3 text-center text-[12px] text-muted">
                Se abre WhatsApp ({site.whatsappDisplay}) con tu consulta lista. Tú decides cuándo enviarla.
              </p>
            </div>

            <div className="mt-8">
              <InfoAccordion title="Cuidados" icon={<Heart size={17} />} defaultOpen>
                {product.care ??
                  "Evita el contacto con agua, perfumes y cremas. Guárdala seca en su bolsita cuando no la uses. (Texto de muestra.)"}
              </InfoAccordion>
              <InfoAccordion title="Empaque y regalo" icon={<Gift size={17} />}>
                Texto de muestra: cada pieza se entrega en bolsita de tela. Puedes dejar una dedicatoria desde el carrito; la disponibilidad de tarjetas se confirma por WhatsApp.
              </InfoAccordion>
              <InfoAccordion title="Entrega" icon={<Truck size={17} />}>
                Texto de muestra: envíos a todo el Perú. El costo, la empresa de envío y el plazo se coordinan por WhatsApp según tu ciudad. No se garantizan tiempos hasta que la tienda los confirme.
              </InfoAccordion>
              <InfoAccordion title="Cambios" icon={<Package size={17} />}>
                Texto de muestra pendiente de la política oficial de MariArte.{" "}
                <Link href="/politicas#cambios" className="link-underline text-rose-deep">Ver información provisional</Link>.
              </InfoAccordion>
            </div>
          </div>
        </div>

        <DemoNotice className="mt-10">{site.demoNotice}</DemoNotice>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-title" className="container-page mt-20">
          <SectionHeading id="related-title" eyebrow="Combínalo con" title="También te puede gustar" />
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
