"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { categories, getCategory } from "@/data/categories";
import { totalStock } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/format";
import type { Product } from "@/types";
import { ConfirmModal } from "@/components/ui/Modal";
import { ExternalLink, Pencil, Plus, Search, Trash } from "@/components/ui/icons";
import { ProductImage } from "@/components/ui/ProductImage";
import { ProductForm } from "./ProductForm";

export function ProductsTable() {
  const { products, toggleProductActive, deleteProduct } = useStore();
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("todas");
  const [status, setStatus] = useState<"todos" | "activos" | "inactivos" | "agotados">("todos");
  const [editing, setEditing] = useState<Product | undefined>(undefined);
  const [formOpen, setFormOpen] = useState(false);
  const [toDelete, setToDelete] = useState<Product | undefined>(undefined);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      if (q && !`${p.name} ${p.slug} ${p.variants.map((v) => v.sku).join(" ")}`.toLowerCase().includes(q)) return false;
      if (category !== "todas" && p.categoryId !== category) return false;
      if (status === "activos" && !p.active) return false;
      if (status === "inactivos" && p.active) return false;
      if (status === "agotados" && totalStock(p) > 0) return false;
      return true;
    });
  }, [products, query, category, status]);

  return (
    <div>
      <div className="mb-4 flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <label htmlFor="admin-search" className="sr-only">Buscar productos</label>
          <Search size={17} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
          <input
            id="admin-search"
            type="search"
            className="field rounded-full pl-11"
            placeholder="Buscar por nombre, slug o SKU"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <label htmlFor="admin-cat" className="sr-only">Filtrar por categoría</label>
          <select id="admin-cat" className="field rounded-full sm:w-44" value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="todas">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <label htmlFor="admin-status" className="sr-only">Filtrar por estado</label>
          <select id="admin-status" className="field rounded-full sm:w-40" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="todos">Todos</option>
            <option value="activos">Publicados</option>
            <option value="inactivos">Ocultos</option>
            <option value="agotados">Agotados</option>
          </select>
          <button
            type="button"
            className="btn btn-primary col-span-2 sm:col-span-1"
            onClick={() => {
              setEditing(undefined);
              setFormOpen(true);
            }}
          >
            <Plus size={17} /> Nuevo producto
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line bg-white">
        <table className="w-full min-w-[820px] text-left text-[13.5px]">
          <caption className="sr-only">Productos del catálogo demo</caption>
          <thead className="bg-ivory text-[11px] uppercase tracking-[0.12em] text-muted">
            <tr>
              <th scope="col" className="px-4 py-3 font-semibold">Producto</th>
              <th scope="col" className="px-4 py-3 font-semibold">Categoría</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Precio</th>
              <th scope="col" className="px-4 py-3 font-semibold">Stock por variante</th>
              <th scope="col" className="px-4 py-3 font-semibold">Publicado</th>
              <th scope="col" className="px-4 py-3 text-right font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {list.map((p) => {
              const stock = totalStock(p);
              return (
                <tr key={p.id} className={cn(!p.active && "bg-ivory/60")}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-blush-soft">
                        <ProductImage src={p.images[0]} alt="" sizes="48px" compact />
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-ink">{p.name}</p>
                        <p className="truncate font-mono text-[11.5px] text-muted">/{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted">{getCategory(p.categoryId)?.name}</td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums">{formatPrice(p.price)}</td>
                  <td className="px-4 py-3">
                    <ul className="space-y-0.5 text-[12.5px]">
                      {p.variants.map((v) => (
                        <li key={v.sku} className={cn(v.stock === 0 ? "text-danger" : v.stock <= 2 ? "text-warning" : "text-muted")}>
                          {v.label}: <strong className="tabular-nums">{v.stock}</strong>
                          {v.stock === 0 && " (agotado)"}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-1 text-[11px] text-muted">Total: {stock}</p>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.active}
                      aria-label={`${p.active ? "Ocultar" : "Publicar"} ${p.name}`}
                      onClick={() => {
                        toggleProductActive(p.id);
                        showToast(p.active ? `«${p.name}» se ocultó de la tienda.` : `«${p.name}» ya está publicado.`, { tone: "info" });
                      }}
                      className={cn("relative inline-flex h-7 w-12 items-center rounded-full transition", p.active ? "bg-success" : "bg-line")}
                    >
                      <span className={cn("inline-block h-5 w-5 rounded-full bg-white shadow transition", p.active ? "translate-x-6" : "translate-x-1")} />
                    </button>
                    <span className="ml-2 text-[12px] text-muted">{p.active ? "Sí" : "No"}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      {p.active && (
                        <Link href={`/producto/${p.slug}`} className="icon-btn h-10 w-10" aria-label={`Ver ${p.name} en la tienda`} target="_blank">
                          <ExternalLink size={16} />
                        </Link>
                      )}
                      <button
                        type="button"
                        className="icon-btn h-10 w-10"
                        aria-label={`Editar ${p.name}`}
                        onClick={() => {
                          setEditing(p);
                          setFormOpen(true);
                        }}
                      >
                        <Pencil size={16} />
                      </button>
                      <button type="button" className="icon-btn h-10 w-10 hover:text-danger" aria-label={`Eliminar ${p.name}`} onClick={() => setToDelete(p)}>
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {list.length === 0 && <p className="p-8 text-center text-sm text-muted">No hay productos con estos filtros.</p>}
      </div>

      <ProductForm open={formOpen} onClose={() => setFormOpen(false)} product={editing} onSaved={(msg) => showToast(msg)} />

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(undefined)}
        onConfirm={() => {
          if (!toDelete) return;
          deleteProduct(toDelete.id);
          showToast(`«${toDelete.name}» se eliminó del catálogo demo.`, { tone: "info" });
        }}
        title="¿Eliminar este producto?"
        message={`Se eliminará «${toDelete?.name ?? ""}» del catálogo demo y de los carritos de este navegador. Puedes recuperarlo con «Restablecer datos de demo».`}
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
