"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import { useStore } from "@/context/StoreContext";
import { categories } from "@/data/categories";
import { demoImageLibrary } from "@/data/site";
import { materialTypes } from "@/lib/catalog";
import { styleOptions } from "@/lib/recommend";
import { cn, slugify, todayISO } from "@/lib/format";
import { compressImage } from "@/lib/image";
import { deleteStoredImage, isStoredImage, supabase, uploadProductImage } from "@/lib/supabase";
import type { CategoryId, MaterialType, Product, ProductVariant } from "@/types";
import { Modal } from "@/components/ui/Modal";
import { AlertCircle, Check, Plus, Trash } from "@/components/ui/icons";

interface Draft {
  name: string;
  slug: string;
  slugTouched: boolean;
  description: string;
  categoryId: CategoryId;
  material: string;
  materialType: MaterialType;
  price: string;
  images: string[];
  variantName: string;
  variants: { sku: string; label: string; stock: string; minStock: string }[];
  featured: boolean;
  active: boolean;
  isNew: boolean;
  giftEnabled: boolean;
  meaning: string;
  themeIds: string[];
  styles: string[];
}

type Errors = Record<string, string>;

function toDraft(product?: Product): Draft {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    slugTouched: Boolean(product),
    description: product?.description ?? "",
    categoryId: product?.categoryId ?? "pulseras",
    material: product?.material ?? "",
    materialType: product?.materialType ?? "Hilo tejido",
    price: product ? product.price.toFixed(2) : "",
    images: product?.images ?? [],
    variantName: product?.variantName ?? "",
    variants: product?.variants.map((v) => ({ sku: v.sku, label: v.label, stock: String(v.stock), minStock: String(v.minStock ?? 2) })) ?? [
      { sku: "", label: "Única", stock: "0", minStock: "2" },
    ],
    featured: product?.featured ?? false,
    active: product?.active ?? true,
    isNew: product?.isNew ?? true,
    giftEnabled: product?.giftEnabled ?? false,
    meaning: product?.meaning ?? "",
    themeIds: product?.themeIds ?? [],
    styles: product?.styles ?? [],
  };
}

function ErrorText({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="field-error">
      <AlertCircle size={14} /> {message}
    </p>
  );
}

export function ProductForm({
  open,
  onClose,
  product,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  product?: Product;
  onSaved: (message: string) => void;
}) {
  const { products, saveProduct, themes, setProductImages, authRequired } = useStore();
  const isNew = !product;
  const [draft, setDraft] = useState<Draft>(() => toDraft(product));
  const [errors, setErrors] = useState<Errors>({});

  useEffect(() => {
    if (open) {
      setDraft(toDraft(product));
      setErrors({});
    }
  }, [open, product]);

  const set = (patch: Partial<Draft>) => setDraft((d) => ({ ...d, ...patch }));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  // Biblioteca del sitio + todas las fotos subidas (de este y de otros productos) para poder reutilizarlas.
  const uploadedUrls = Array.from(new Set([...products.flatMap((p) => p.images), ...draft.images].filter((src) => !demoImageLibrary.some((i) => i.src === src))));
  const gallery = [...demoImageLibrary, ...uploadedUrls.map((src) => ({ src, label: "Foto subida" }))];

  /** Cambia las fotos del borrador; en un producto que ya existe se guardan al instante. */
  function changeImages(next: string[]) {
    setDraft((d) => ({ ...d, images: next }));
    if (product) setProductImages(product.id, next);
  }

  async function removeFile(src: string) {
    const usedElsewhere = products.some((p) => p.id !== product?.id && p.images.includes(src));
    if (usedElsewhere) {
      setUploadError("Esa foto la usa otro producto: solo se quitó de este.");
      changeImages(draft.images.filter((s) => s !== src));
      return;
    }
    if (!window.confirm("¿Borrar esta foto definitivamente del almacenamiento?")) return;
    const error = await deleteStoredImage(src);
    if (error) setUploadError(`No se pudo borrar el archivo: ${error}`);
    changeImages(draft.images.filter((s) => s !== src));
  }

  function moveImage(index: number, delta: number) {
    const next = [...draft.images];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    changeImages(next);
  }

  async function onUpload(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    setUploadError(null);
    const added: string[] = [];
    for (const original of Array.from(files)) {
      if (original.size > 25 * 1024 * 1024) {
        setUploadError(`${original.name} pesa más de 25 MB.`);
        continue;
      }
      const file = await compressImage(original);
      if (file.size > 5 * 1024 * 1024) {
        setUploadError(`${original.name} sigue pesando más de 5 MB tras reducirla.`);
        continue;
      }
      const result = await uploadProductImage(file);
      if ("error" in result) setUploadError(result.error);
      else added.push(result.url);
    }
    if (added.length) changeImages([...draft.images, ...added]);
    setUploading(false);
  }

  function validate(d: Draft): Errors {
    const e: Errors = {};
    if (d.name.trim().length < 3) e.name = "El nombre debe tener al menos 3 caracteres.";
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug)) e.slug = "Usa solo minúsculas, números y guiones (ej. pulsera-luna).";
    else if (products.some((p) => p.slug === d.slug && p.id !== product?.id)) e.slug = "Ya existe otro producto con este slug.";
    if (d.description.trim().length < 10) e.description = "Agrega una descripción de al menos 10 caracteres.";
    if (d.material.trim().length < 3) e.material = "Indica el material (o «por confirmar»).";
    const price = Number(d.price.replace(",", "."));
    if (!d.price.trim() || Number.isNaN(price)) e.price = "Ingresa un precio numérico.";
    else if (price <= 0 || price > 10000) e.price = "El precio debe estar entre S/ 0.01 y S/ 10,000.";
    if (d.variants.length === 0) e.variants = "Agrega al menos una variante.";
    const skus = new Set<string>();
    const otherSkus = new Set(products.filter((p) => p.id !== product?.id).flatMap((p) => p.variants.map((v) => v.sku)));
    d.variants.forEach((v, i) => {
      const sku = v.sku.trim().toUpperCase();
      if (!sku) e[`variant-${i}-sku`] = "SKU requerido.";
      else if (skus.has(sku) || otherSkus.has(sku)) e[`variant-${i}-sku`] = "SKU repetido.";
      skus.add(sku);
      if (!v.label.trim()) e[`variant-${i}-label`] = "Nombre requerido.";
      const stock = Number(v.stock);
      if (v.stock.trim() === "" || !Number.isInteger(stock) || stock < 0) e[`variant-${i}-stock`] = "Entero ≥ 0.";
      const min = Number(v.minStock);
      if (v.minStock.trim() === "" || !Number.isInteger(min) || min < 0) e[`variant-${i}-min`] = "Entero ≥ 0.";
    });
    if (d.variants.length > 1 && !d.variantName.trim()) e.variantName = "Si hay varias opciones, indica cómo se llaman (ej. Color).";
    return e;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const result = validate(draft);
    setErrors(result);
    if (Object.keys(result).length) {
      const first = Object.keys(result)[0];
      document.getElementById(`pf-${first}`)?.focus();
      return;
    }
    const variants: ProductVariant[] = draft.variants.map((v) => ({
      sku: v.sku.trim().toUpperCase(),
      label: v.label.trim(),
      stock: Number(v.stock),
      minStock: Number(v.minStock),
    }));
    const saved: Product = {
      id: product?.id ?? `p-${Date.now().toString(36)}`,
      slug: draft.slug,
      name: draft.name.trim(),
      description: draft.description.trim(),
      categoryId: draft.categoryId,
      material: draft.material.trim(),
      materialType: draft.materialType,
      price: Math.round(Number(draft.price.replace(",", ".")) * 100) / 100,
      images: draft.images,
      featured: draft.featured,
      active: draft.active,
      variantName: draft.variantName.trim() || undefined,
      variants,
      isNew: draft.isNew,
      createdAt: product?.createdAt ?? todayISO(),
      care: product?.care,
      giftEnabled: draft.giftEnabled,
      meaning: draft.meaning.trim() || undefined,
      themeIds: draft.themeIds,
      styles: draft.styles,
    };
    saveProduct(saved, isNew);
    onSaved(isNew ? authRequired ? `«${saved.name}» se creó en el catálogo.` : `«${saved.name}» se creó en el catálogo demo.` : `Cambios guardados en «${saved.name}».`);
    onClose();
  }

  const errorCount = Object.keys(errors).length;
  const describedBy = (key: string) => (errors[key] ? `pf-${key}-error` : undefined);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isNew ? "Nuevo producto" : "Editar producto"}
      description={authRequired ? "Los cambios se guardan en la base de datos de la tienda." : "Datos de demostración: se guardan solo en este navegador."}
      size="lg"
      variant="sheet"
      footer={
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[12px] text-muted">
            {errorCount > 0 ? <span className="text-danger">Revisa {errorCount} campo(s) marcados.</span> : (authRequired ? "Los cambios se reflejan de inmediato en la tienda." : "Los cambios se reflejan de inmediato en la tienda demo.")}
          </p>
          <div className="flex gap-2">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" form="product-form" className="btn btn-primary">
              <Check size={17} /> {isNew ? "Crear producto" : "Guardar cambios"}
            </button>
          </div>
        </div>
      }
    >
      <form id="product-form" noValidate onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="pf-name" className="field-label">Nombre</label>
            <input
              id="pf-name"
              className="field"
              value={draft.name}
              onChange={(e) => set({ name: e.target.value, slug: draft.slugTouched ? draft.slug : slugify(e.target.value) })}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={describedBy("name")}
            />
            <ErrorText id="pf-name-error" message={errors.name} />
          </div>
          <div>
            <label htmlFor="pf-slug" className="field-label">Slug (URL)</label>
            <input
              id="pf-slug"
              className="field font-mono text-[13px]"
              value={draft.slug}
              onChange={(e) => set({ slug: slugify(e.target.value), slugTouched: true })}
              aria-invalid={Boolean(errors.slug)}
              aria-describedby={describedBy("slug")}
            />
            <ErrorText id="pf-slug-error" message={errors.slug} />
          </div>
          <div>
            <label htmlFor="pf-price" className="field-label">Precio (S/)</label>
            <input
              id="pf-price"
              className="field"
              inputMode="decimal"
              placeholder="0.00"
              value={draft.price}
              onChange={(e) => set({ price: e.target.value })}
              aria-invalid={Boolean(errors.price)}
              aria-describedby={describedBy("price")}
            />
            <ErrorText id="pf-price-error" message={errors.price} />
          </div>
          <div>
            <label htmlFor="pf-category" className="field-label">Categoría</label>
            <select id="pf-category" className="field" value={draft.categoryId} onChange={(e) => set({ categoryId: e.target.value as CategoryId })}>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="pf-materialType" className="field-label">Tipo de material (filtro)</label>
            <select id="pf-materialType" className="field" value={draft.materialType} onChange={(e) => set({ materialType: e.target.value as MaterialType })}>
              {materialTypes.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-material" className="field-label">Material (texto visible)</label>
            <input
              id="pf-material"
              className="field"
              placeholder="Ej.: Hilo rojo con dije de acero quirúrgico"
              value={draft.material}
              onChange={(e) => set({ material: e.target.value })}
              aria-invalid={Boolean(errors.material)}
              aria-describedby={describedBy("material")}
            />
            <ErrorText id="pf-material-error" message={errors.material} />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pf-description" className="field-label">Descripción</label>
            <textarea
              id="pf-description"
              rows={3}
              className="field resize-none"
              value={draft.description}
              onChange={(e) => set({ description: e.target.value })}
              aria-invalid={Boolean(errors.description)}
              aria-describedby={describedBy("description")}
            />
            <ErrorText id="pf-description-error" message={errors.description} />
          </div>
        </div>

        <fieldset className="rounded-2xl border border-line bg-white p-4 sm:p-5">
          <legend className="px-1 text-[13px] font-semibold text-ink">Regalo y significado</legend>
          <label className="flex cursor-pointer items-start gap-3 text-[14px]">
            <input type="checkbox" checked={draft.giftEnabled} onChange={(e) => set({ giftEnabled: e.target.checked })} className="mt-1 h-4 w-4 accent-rose" />
            <span>
              <span className="font-semibold text-ink">Permitir «Arma tu regalo»</span>
              <span className="block text-[12.5px] text-muted">El cliente podrá elegir ocasión, empaque y dedicatoria para esta joya.</span>
            </span>
          </label>
          {themes.length > 0 && (
            <div className="mt-4">
              <p className="field-label">Joyas con significado</p>
              <div className="flex flex-wrap gap-2">
                {themes.map((t) => {
                  const on = draft.themeIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={cn(
                        "cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-rose",
                        on ? "border-rose bg-blush-soft font-semibold text-rose-deep" : "border-line bg-white text-ink",
                      )}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={on}
                        onChange={() => set({ themeIds: on ? draft.themeIds.filter((x) => x !== t.id) : [...draft.themeIds, t.id] })}
                      />
                      {t.name}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
          <div className="mt-4">
            <p className="field-label">Estilo (para «Encuentra tu joya ideal»)</p>
            <div className="flex flex-wrap gap-2">
              {styleOptions.map((s) => {
                const on = draft.styles.includes(s.value);
                return (
                  <label
                    key={s.value}
                    className={cn(
                      "cursor-pointer rounded-full border px-3 py-1.5 text-[13px] transition has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-rose",
                      on ? "border-rose bg-blush-soft font-semibold text-rose-deep" : "border-line bg-white text-ink",
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={on}
                      onChange={() => set({ styles: on ? draft.styles.filter((x) => x !== s.value) : [...draft.styles, s.value] })}
                    />
                    {s.label}
                  </label>
                );
              })}
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="pf-meaning" className="field-label">Significado propio de esta joya (opcional)</label>
            <textarea
              id="pf-meaning"
              rows={3}
              className="field resize-none"
              value={draft.meaning}
              onChange={(e) => set({ meaning: e.target.value })}
              placeholder="Si lo dejas vacío se usa el texto del tema. Describe el símbolo, sin prometer efectos reales."
            />
          </div>
        </fieldset>

        <fieldset>
          <legend className="field-label">Fotografías</legend>
          <p className="mb-3 text-[12px] text-muted">
            Elige de la biblioteca o sube tus fotos. La primera es la foto principal.
            {product ? " En un producto que ya existe, las fotos se guardan al instante." : " Se guardarán al crear el producto."}
          </p>
          {supabase && (
            <div className="mb-3">
              <label className="btn btn-secondary btn-sm cursor-pointer">
                {uploading ? "Subiendo…" : "Subir fotos"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  multiple
                  className="sr-only"
                  disabled={uploading}
                  onChange={(e) => {
                    onUpload(e.target.files);
                    e.target.value = "";
                  }}
                />
              </label>
              <span className="ml-3 text-[12px] text-muted">JPG, PNG o WebP · se reducen solas a 1600 px · ideal proporción 4:5</span>
              {uploadError && <p role="alert" className="mt-2 text-[12px] font-medium text-danger">{uploadError}</p>}
            </div>
          )}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {gallery.map((img) => {
              const position = draft.images.indexOf(img.src);
              const selected = position >= 0;
              return (
                <label
                  key={img.src}
                  className={cn(
                    "relative aspect-square cursor-pointer overflow-hidden rounded-xl ring-offset-2 ring-offset-ivory has-[input:focus-visible]:ring-2 has-[input:focus-visible]:ring-rose",
                    selected ? "ring-2 ring-rose" : "opacity-70 hover:opacity-100",
                  )}
                >
                  <input
                    type="checkbox"
                    className="sr-only"
                    checked={selected}
                    onChange={() => changeImages(selected ? draft.images.filter((s) => s !== img.src) : [...draft.images, img.src])}
                  />
                  <Image src={img.src} alt={img.label} fill sizes="90px" className="object-cover" />
                  {selected && (
                    <span className="absolute left-1 top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold text-white">
                      {position + 1}
                    </span>
                  )}
                </label>
              );
            })}
          </div>
          {draft.images.length === 0 && <p className="mt-2 text-[12px] text-muted">Sin foto: la tienda mostrará «Foto pendiente».</p>}
          {draft.images.length > 0 && (
            <ol className="mt-4 space-y-2" aria-label="Orden de las fotos">
              {draft.images.map((src, i) => (
                <li key={src} className="flex items-center gap-3 rounded-xl border border-line bg-white p-2">
                  <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-blush-soft">
                    <Image src={src} alt="" fill sizes="48px" className="object-cover" />
                  </span>
                  <span className="min-w-0 flex-1 text-[13px] text-ink">
                    {i === 0 ? <strong className="text-rose-deep">Foto principal</strong> : `Foto ${i + 1}`}
                    {isStoredImage(src) && <span className="ml-2 text-[11px] text-muted">subida desde el panel</span>}
                  </span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label={`Subir la foto ${i + 1}`}>↑</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => moveImage(i, 1)} disabled={i === draft.images.length - 1} aria-label={`Bajar la foto ${i + 1}`}>↓</button>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => changeImages(draft.images.filter((s) => s !== src))}>Quitar</button>
                  {isStoredImage(src) && (
                    <button type="button" className="icon-btn text-muted hover:text-danger" aria-label={`Borrar la foto ${i + 1} del almacenamiento`} onClick={() => removeFile(src)}>
                      <Trash size={17} />
                    </button>
                  )}
                </li>
              ))}
            </ol>
          )}
        </fieldset>

        <fieldset className="rounded-2xl border border-line bg-white p-4 sm:p-5">
          <legend className="px-1 text-[13px] font-semibold text-ink">Variantes y stock</legend>
          <div className="mb-4">
            <label htmlFor="pf-variantName" className="field-label">Nombre del selector</label>
            <input
              id="pf-variantName"
              className="field"
              placeholder="Ej.: Color de hilo, Talla, Dije"
              value={draft.variantName}
              onChange={(e) => set({ variantName: e.target.value })}
              aria-invalid={Boolean(errors.variantName)}
              aria-describedby={describedBy("variantName")}
            />
            <ErrorText id="pf-variantName-error" message={errors.variantName} />
          </div>
          <div className="space-y-3">
            {draft.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_72px_72px_auto] items-start gap-2">
                <div>
                  <label htmlFor={`pf-variant-${i}-sku`} className="sr-only">SKU variante {i + 1}</label>
                  <input
                    id={`pf-variant-${i}-sku`}
                    className="field min-h-11 px-3 font-mono text-[12.5px] uppercase"
                    placeholder="SKU"
                    value={v.sku}
                    onChange={(e) => set({ variants: draft.variants.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)) })}
                    aria-invalid={Boolean(errors[`variant-${i}-sku`])}
                  />
                  <ErrorText id={`pf-variant-${i}-sku-error`} message={errors[`variant-${i}-sku`]} />
                </div>
                <div>
                  <label htmlFor={`pf-variant-${i}-label`} className="sr-only">Nombre variante {i + 1}</label>
                  <input
                    id={`pf-variant-${i}-label`}
                    className="field min-h-11 px-3 text-[14px]"
                    placeholder="Opción"
                    value={v.label}
                    onChange={(e) => set({ variants: draft.variants.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)) })}
                    aria-invalid={Boolean(errors[`variant-${i}-label`])}
                  />
                  <ErrorText id={`pf-variant-${i}-label-error`} message={errors[`variant-${i}-label`]} />
                </div>
                <div>
                  <label htmlFor={`pf-variant-${i}-stock`} className="sr-only">Stock variante {i + 1}</label>
                  <input
                    id={`pf-variant-${i}-stock`}
                    className="field min-h-11 px-3 text-[14px]"
                    inputMode="numeric"
                    placeholder="Stock"
                    value={v.stock}
                    onChange={(e) => set({ variants: draft.variants.map((x, j) => (j === i ? { ...x, stock: e.target.value } : x)) })}
                    aria-invalid={Boolean(errors[`variant-${i}-stock`])}
                  />
                  <ErrorText id={`pf-variant-${i}-stock-error`} message={errors[`variant-${i}-stock`]} />
                </div>
                <div>
                  <label htmlFor={`pf-variant-${i}-min`} className="sr-only">Stock mínimo variante {i + 1}</label>
                  <input
                    id={`pf-variant-${i}-min`}
                    className="field min-h-11 px-3 text-[14px]"
                    inputMode="numeric"
                    placeholder="Mín."
                    title="Stock mínimo: avisa cuando el stock llega a este número"
                    value={v.minStock}
                    onChange={(e) => set({ variants: draft.variants.map((x, j) => (j === i ? { ...x, minStock: e.target.value } : x)) })}
                    aria-invalid={Boolean(errors[`variant-${i}-min`])}
                  />
                  <ErrorText id={`pf-variant-${i}-min-error`} message={errors[`variant-${i}-min`]} />
                </div>
                <button
                  type="button"
                  className="icon-btn h-11 w-11 text-muted hover:text-danger disabled:opacity-30"
                  onClick={() => set({ variants: draft.variants.filter((_, j) => j !== i) })}
                  disabled={draft.variants.length === 1}
                  aria-label={`Eliminar variante ${i + 1}`}
                >
                  <Trash size={17} />
                </button>
              </div>
            ))}
          </div>
          <ErrorText id="pf-variants-error" message={errors.variants} />
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-3 -ml-2"
            onClick={() => set({ variants: [...draft.variants, { sku: "", label: "", stock: "0", minStock: "2" }] })}
          >
            <Plus size={16} /> Agregar variante
          </button>
        </fieldset>

        <fieldset className="flex flex-wrap gap-x-8 gap-y-3">
          <legend className="sr-only">Estado</legend>
          {(
            [
              ["active", "Publicado en la tienda"],
              ["featured", "Destacado en inicio"],
              ["isNew", "Marcar como nuevo"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex min-h-10 cursor-pointer items-center gap-3 text-[14px]">
              <input
                type="checkbox"
                checked={draft[key]}
                onChange={(e) => set({ [key]: e.target.checked } as Partial<Draft>)}
                className="h-[18px] w-[18px] accent-rose"
              />
              {label}
            </label>
          ))}
        </fieldset>
      </form>
    </Modal>
  );
}
