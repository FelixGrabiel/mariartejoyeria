"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { comboTotals, isComboLive } from "@/lib/combo";
import { formatPrice, slugify } from "@/lib/format";
import type { Combo, ComboItem } from "@/types";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { Plus, Trash } from "@/components/ui/icons";

function statusOf(c: Combo): { label: string; tone: BadgeTone } {
  const now = Date.now();
  if (!c.active) return { label: "Pausado", tone: "neutral" };
  if (c.startsAt && new Date(c.startsAt).getTime() > now) return { label: "Programado", tone: "champagne" };
  if (c.endsAt && new Date(c.endsAt).getTime() <= now) return { label: "Vencido", tone: "danger" };
  return { label: "Vigente", tone: "success" };
}

/** ISO → valor de <input type="datetime-local"> en hora local. */
function toLocalInput(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): string | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

function summary(c: Combo, names: Record<string, string>): string {
  return c.items.map((i) => `${i.quantity}× ${names[i.productId] ?? "producto eliminado"}`).join(" + ");
}

export function CombosPanel() {
  const { combos, products, saveCombo, deleteCombo } = useStore();
  const { showToast } = useToast();
  const [editing, setEditing] = useState<Combo | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Combo | null>(null);
  const names = Object.fromEntries(products.map((p) => [p.id, p.name]));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-[13px] text-muted">
          Un combo agrupa productos reales. El descuento solo se aplica si le pones un porcentaje mayor que 0 y el combo está vigente; el servidor valida el stock de cada pieza.
        </p>
        <button type="button" className="btn btn-primary" onClick={() => setEditing("new")}>
          <Plus size={17} /> Nuevo combo
        </button>
      </div>

      {combos.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">Aún no hay combos. Crea el primero.</p>}

      {combos.map((c) => {
        const st = statusOf(c);
        return (
          <div key={c.id} className="rounded-2xl border border-line bg-white p-4 sm:p-5">
            <div className="flex flex-wrap items-center gap-3">
              <p className="min-w-0 flex-1 font-semibold text-ink">{c.name}</p>
              <Badge tone={st.tone}>{st.label}</Badge>
              {c.discountPercent > 0 && <Badge tone="blush">{c.discountPercent}% menos</Badge>}
            </div>
            <p className="mt-1 text-[13px] text-muted">{summary(c, names)}</p>
            <p className="mt-1 text-[12px] text-muted">
              {c.startsAt ? `Desde ${new Date(c.startsAt).toLocaleString("es-PE")}` : "Sin fecha de inicio"} ·{" "}
              {c.endsAt ? `hasta ${new Date(c.endsAt).toLocaleString("es-PE")}` : "sin fecha de fin"} · máx. {c.maxPerOrder} por pedido
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setEditing(c)}>Editar</button>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => {
                  saveCombo({ ...c, active: !c.active });
                  showToast(c.active ? "Combo pausado." : "Combo activado.", { tone: "info" });
                }}
              >
                {c.active ? "Pausar" : "Activar"}
              </button>
              <button type="button" className="icon-btn text-muted hover:text-danger" aria-label={`Eliminar ${c.name}`} onClick={() => setToDelete(c)}>
                <Trash size={18} />
              </button>
            </div>
          </div>
        );
      })}

      {editing && (
        <ComboForm
          combo={editing === "new" ? undefined : editing}
          onClose={() => setEditing(null)}
          onSaved={(message) => showToast(message)}
        />
      )}

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteCombo(toDelete.id);
          setToDelete(null);
        }}
        title="¿Eliminar este combo?"
        message="Los pedidos ya hechos conservan su copia de la composición y los precios. Si solo quieres ocultarlo, pausa el combo."
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}

function ComboForm({ combo, onClose, onSaved }: { combo?: Combo; onClose: () => void; onSaved: (message: string) => void }) {
  const { products, combos, saveCombo } = useStore();
  const [name, setName] = useState(combo?.name ?? "");
  const [description, setDescription] = useState(combo?.description ?? "");
  const [percent, setPercent] = useState(String(combo?.discountPercent ?? 0));
  const [maxPerOrder, setMaxPerOrder] = useState(String(combo?.maxPerOrder ?? 5));
  const [startsAt, setStartsAt] = useState(toLocalInput(combo?.startsAt));
  const [endsAt, setEndsAt] = useState(toLocalInput(combo?.endsAt));
  const [active, setActive] = useState(combo?.active ?? true);
  const [items, setItems] = useState<ComboItem[]>(combo?.items.length ? combo.items : [{ productId: "", quantity: 1 }, { productId: "", quantity: 1 }]);
  const [error, setError] = useState("");

  const pct = Number(percent);
  const totals = comboTotals(
    items.flatMap((i) => {
      const p = products.find((x) => x.id === i.productId);
      return p ? [{ price: p.price, quantity: i.quantity }] : [];
    }),
    Number.isInteger(pct) && pct >= 0 && pct <= 90 ? pct : 0,
  );

  const setItem = (idx: number, patch: Partial<ComboItem>) => setItems((list) => list.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const max = Number(maxPerOrder);
    const start = fromLocalInput(startsAt);
    const end = fromLocalInput(endsAt);
    if (name.trim().length < 3) return setError("El nombre debe tener al menos 3 caracteres.");
    if (!Number.isInteger(pct) || pct < 0 || pct > 90) return setError("El descuento es un número entero entre 0 y 90 (0 = sin promoción).");
    if (!Number.isInteger(max) || max < 1 || max > 99) return setError("El máximo por pedido debe estar entre 1 y 99.");
    if (start && end && end <= start) return setError("La fecha de fin debe ser posterior a la de inicio.");
    if (items.length < 2) return setError("Un combo necesita al menos 2 productos.");
    if (items.some((i) => !i.productId)) return setError("Elige un producto en cada fila.");
    if (items.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 10)) return setError("Cada cantidad debe estar entre 1 y 10.");

    const taken = combos.filter((c) => c.id !== combo?.id).map((c) => c.id);
    let id = combo?.id ?? (slugify(name) || "combo");
    if (!combo) {
      let n = 2;
      const root = id;
      while (taken.includes(id)) id = `${root}-${n++}`;
    }
    saveCombo({
      id,
      name: name.trim(),
      description: description.trim(),
      discountPercent: pct,
      active,
      startsAt: start,
      endsAt: end,
      maxPerOrder: max,
      sortOrder: combo?.sortOrder ?? combos.length + 1,
      items: items.map((i) => ({ productId: i.productId, sku: i.sku || undefined, quantity: i.quantity })),
    });
    onSaved(combo ? "Combo actualizado." : "Combo creado.");
    onClose();
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={combo ? "Editar combo" : "Nuevo combo"}
      description="Combina productos reales. La promoción solo se aplica si le pones un porcentaje."
      size="lg"
      variant="sheet"
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button type="submit" form="combo-form" className="btn btn-primary">Guardar combo</button>
        </div>
      }
    >
      <form id="combo-form" noValidate onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="cb-name" className="field-label">Nombre</label>
          <input id="cb-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <label htmlFor="cb-desc" className="field-label">Descripción (opcional)</label>
          <textarea id="cb-desc" rows={2} className="field resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>

        <fieldset className="rounded-2xl border border-line p-4">
          <legend className="px-1 text-[13px] font-semibold">Productos del combo</legend>
          <div className="space-y-3">
            {items.map((it, idx) => {
              const p = products.find((x) => x.id === it.productId);
              return (
                <div key={idx} className="grid gap-2 sm:grid-cols-[1.4fr_1fr_80px_auto]">
                  <select aria-label={`Producto ${idx + 1}`} className="field" value={it.productId} onChange={(e) => setItem(idx, { productId: e.target.value, sku: undefined })}>
                    <option value="">Elige un producto</option>
                    {products.map((x) => (
                      <option key={x.id} value={x.id}>{x.name}{x.active ? "" : " (oculto)"}</option>
                    ))}
                  </select>
                  <select aria-label={`Variante del producto ${idx + 1}`} className="field" value={it.sku ?? ""} onChange={(e) => setItem(idx, { sku: e.target.value || undefined })} disabled={!p}>
                    <option value="">El cliente elige</option>
                    {p?.variants.map((v) => (
                      <option key={v.sku} value={v.sku}>{v.label} (stock {v.stock})</option>
                    ))}
                  </select>
                  <input aria-label={`Cantidad del producto ${idx + 1}`} inputMode="numeric" className="field" value={it.quantity} onChange={(e) => setItem(idx, { quantity: Number(e.target.value) || 0 })} />
                  <button type="button" className="icon-btn text-muted hover:text-danger" aria-label={`Quitar producto ${idx + 1}`} onClick={() => setItems((list) => list.filter((_, i) => i !== idx))} disabled={items.length <= 2}>
                    <Trash size={18} />
                  </button>
                </div>
              );
            })}
          </div>
          <button type="button" className="btn btn-secondary btn-sm mt-3" onClick={() => setItems((list) => [...list, { productId: "", quantity: 1 }])}>
            <Plus size={15} /> Agregar producto
          </button>
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="cb-pct" className="field-label">Descuento (%)</label>
            <input id="cb-pct" inputMode="numeric" className="field" value={percent} onChange={(e) => setPercent(e.target.value)} />
          </div>
          <div>
            <label htmlFor="cb-max" className="field-label">Máximo por pedido</label>
            <input id="cb-max" inputMode="numeric" className="field" value={maxPerOrder} onChange={(e) => setMaxPerOrder(e.target.value)} />
          </div>
          <label className="mt-7 flex items-center gap-2 text-[14px]">
            <input type="checkbox" className="h-4 w-4 accent-rose" checked={active} onChange={(e) => setActive(e.target.checked)} /> Activo
          </label>
          <div>
            <label htmlFor="cb-start" className="field-label">Inicio (opcional)</label>
            <input id="cb-start" type="datetime-local" className="field" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
          </div>
          <div>
            <label htmlFor="cb-end" className="field-label">Fin (opcional)</label>
            <input id="cb-end" type="datetime-local" className="field" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
          </div>
        </div>

        <p className="rounded-2xl bg-blush-soft/70 px-4 py-3 text-[13.5px]">
          Precio al cliente: <strong>{formatPrice(totals.total)}</strong>
          {totals.savings > 0 ? <> · ahorro {formatPrice(totals.savings)} (normal {formatPrice(totals.regular)})</> : <> · sin promoción</>}
          {combo && !isComboLive(combo) && <span className="ml-2 text-muted">(ahora no está vigente)</span>}
        </p>
        {error && <p role="alert" className="field-error">{error}</p>}
      </form>
    </Modal>
  );
}
