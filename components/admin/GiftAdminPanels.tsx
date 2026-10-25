"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { formatPrice, slugify } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { Plus, Trash } from "@/components/ui/icons";
import type { MeaningTheme, PackagingOption } from "@/types";

function uniqueId(base: string, taken: string[]): string {
  const root = slugify(base) || "opcion";
  if (!taken.includes(root)) return root;
  let i = 2;
  while (taken.includes(`${root}-${i}`)) i += 1;
  return `${root}-${i}`;
}

/** Empaques para «Arma tu regalo» + límite de caracteres de la dedicatoria. */
export function PackagingPanel() {
  const { packaging, savePackaging, deletePackaging, dedicationMax, saveDedicationMax } = useStore();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("0");
  const [error, setError] = useState("");
  const [max, setMax] = useState(String(dedicationMax));
  const [toDelete, setToDelete] = useState<PackagingOption | null>(null);

  function onAdd(event: FormEvent) {
    event.preventDefault();
    const amount = Number(price.replace(",", "."));
    if (name.trim().length < 3) return setError("El nombre debe tener al menos 3 caracteres.");
    if (Number.isNaN(amount) || amount < 0 || amount > 1000) return setError("El precio debe estar entre S/ 0 y S/ 1,000. Usa 0 si no tiene costo.");
    savePackaging({
      id: uniqueId(name, packaging.map((o) => o.id)),
      name: name.trim(),
      description: description.trim(),
      price: Math.round(amount * 100) / 100,
      active: true,
      sortOrder: packaging.length + 1,
    });
    setName("");
    setDescription("");
    setPrice("0");
    setError("");
    showToast("Empaque agregado.");
  }

  function onSaveMax(event: FormEvent) {
    event.preventDefault();
    const value = Number(max);
    if (!Number.isInteger(value) || value < 20 || value > 500) {
      showToast("El límite debe ser un número entero entre 20 y 500.", { tone: "error" });
      return;
    }
    saveDedicationMax(value);
    showToast("Límite de dedicatoria actualizado.");
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <form onSubmit={onAdd} noValidate className="rounded-2xl border border-line bg-white p-5 xl:self-start">
          <h3 className="font-serif text-[1.5rem] font-semibold">Nuevo empaque</h3>
          <p className="mt-1 text-[12.5px] text-muted">No se cobra nada extra hasta que definas un precio mayor que 0.</p>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="pk-name" className="field-label">Nombre</label>
              <input id="pk-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pk-desc" className="field-label">Descripción</label>
              <textarea id="pk-desc" rows={2} className="field resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div>
              <label htmlFor="pk-price" className="field-label">Costo adicional por regalo (S/)</label>
              <input id="pk-price" inputMode="decimal" className="field" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            {error && <p role="alert" className="field-error">{error}</p>}
            <button type="submit" className="btn btn-primary w-full">
              <Plus size={17} /> Agregar empaque
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {packaging.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">Aún no hay empaques. Agrega el primero.</p>
          )}
          {packaging.map((o) => (
            <PackagingRow key={o.id} option={o} onSave={savePackaging} onDelete={() => setToDelete(o)} />
          ))}
        </div>
      </div>

      <form onSubmit={onSaveMax} className="max-w-md rounded-2xl border border-line bg-white p-5">
        <h3 className="font-serif text-[1.5rem] font-semibold">Dedicatoria</h3>
        <label htmlFor="ded-max" className="field-label mt-3">Máximo de caracteres</label>
        <div className="flex gap-2">
          <input id="ded-max" inputMode="numeric" className="field" value={max} onChange={(e) => setMax(e.target.value)} />
          <button type="submit" className="btn btn-secondary">Guardar</button>
        </div>
      </form>

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deletePackaging(toDelete.id);
          setToDelete(null);
        }}
        title="¿Eliminar este empaque?"
        message="Los pedidos ya hechos conservan su copia del nombre y el precio. Si solo quieres ocultarlo, desactívalo en su lugar."
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}

function PackagingRow({ option, onSave, onDelete }: { option: PackagingOption; onSave: (o: PackagingOption) => void; onDelete: () => void }) {
  const { showToast } = useToast();
  const [price, setPrice] = useState(option.price.toFixed(2));
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-white p-4">
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-ink">{option.name}</p>
        {option.description && <p className="text-[12.5px] text-muted">{option.description}</p>}
        <p className="mt-1 text-[12px] text-muted">Costo actual: {option.price > 0 ? formatPrice(option.price) : "sin costo"}</p>
      </div>
      <Badge tone={option.active ? "success" : "neutral"}>{option.active ? "Activo" : "Oculto"}</Badge>
      <label className="sr-only" htmlFor={`pk-price-${option.id}`}>Precio de {option.name}</label>
      <input
        id={`pk-price-${option.id}`}
        inputMode="decimal"
        className="field w-24"
        value={price}
        onChange={(e) => setPrice(e.target.value)}
        onBlur={() => {
          const amount = Number(price.replace(",", "."));
          if (Number.isNaN(amount) || amount < 0 || amount > 1000) {
            setPrice(option.price.toFixed(2));
            showToast("Precio no válido.", { tone: "error" });
            return;
          }
          if (amount !== option.price) onSave({ ...option, price: Math.round(amount * 100) / 100 });
        }}
      />
      <button type="button" className="btn btn-secondary btn-sm" onClick={() => onSave({ ...option, active: !option.active })}>
        {option.active ? "Ocultar" : "Mostrar"}
      </button>
      <button type="button" className="icon-btn text-muted hover:text-danger" aria-label={`Eliminar ${option.name}`} onClick={onDelete}>
        <Trash size={18} />
      </button>
    </div>
  );
}

/** Temas de «Joyas con significado»: nombre, texto editable y visibilidad. */
export function ThemesPanel() {
  const { themes, saveTheme, deleteTheme, products } = useStore();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<MeaningTheme | null>(null);

  function onAdd(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 3) return setError("El nombre debe tener al menos 3 caracteres.");
    saveTheme({
      id: uniqueId(name, themes.map((t) => t.id)),
      name: name.trim(),
      description: description.trim(),
      active: true,
      sortOrder: themes.length + 1,
    });
    setName("");
    setDescription("");
    setError("");
    showToast("Tema agregado. Asígnalo a productos desde «Productos → Editar».");
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <form onSubmit={onAdd} noValidate className="rounded-2xl border border-line bg-white p-5 xl:self-start">
        <h3 className="font-serif text-[1.5rem] font-semibold">Nuevo tema</h3>
        <p className="mt-1 text-[12.5px] text-muted">Redacta el significado como tradición o símbolo, sin prometer efectos reales.</p>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="th-name" className="field-label">Nombre</label>
            <input id="th-name" className="field" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <label htmlFor="th-desc" className="field-label">Significado (se muestra al cliente)</label>
            <textarea id="th-desc" rows={4} className="field resize-none" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          {error && <p role="alert" className="field-error">{error}</p>}
          <button type="submit" className="btn btn-primary w-full">
            <Plus size={17} /> Agregar tema
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {themes.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">Aún no hay temas.</p>}
        {themes.map((t) => (
          <ThemeRow
            key={t.id}
            theme={t}
            count={products.filter((p) => p.themeIds?.includes(t.id)).length}
            onSave={saveTheme}
            onDelete={() => setToDelete(t)}
          />
        ))}
      </div>

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteTheme(toDelete.id);
          setToDelete(null);
        }}
        title="¿Eliminar este tema?"
        message="Se quitará de todas las joyas que lo tengan asignado. Si solo quieres ocultarlo en la tienda, desactívalo."
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}

function ThemeRow({ theme, count, onSave, onDelete }: { theme: MeaningTheme; count: number; onSave: (t: MeaningTheme) => void; onDelete: () => void }) {
  const [text, setText] = useState(theme.description);
  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <p className="min-w-0 flex-1 font-semibold text-ink">
          {theme.name} <span className="text-[12px] font-normal text-muted">· {count} {count === 1 ? "joya" : "joyas"}</span>
        </p>
        <Badge tone={theme.active ? "success" : "neutral"}>{theme.active ? "Visible" : "Oculto"}</Badge>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => onSave({ ...theme, active: !theme.active })}>
          {theme.active ? "Ocultar" : "Mostrar"}
        </button>
        <button type="button" className="icon-btn text-muted hover:text-danger" aria-label={`Eliminar ${theme.name}`} onClick={onDelete}>
          <Trash size={18} />
        </button>
      </div>
      <label htmlFor={`th-text-${theme.id}`} className="sr-only">Significado de {theme.name}</label>
      <textarea
        id={`th-text-${theme.id}`}
        rows={3}
        className="field mt-3 resize-none text-[13.5px]"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => text !== theme.description && onSave({ ...theme, description: text.trim() })}
      />
    </div>
  );
}
