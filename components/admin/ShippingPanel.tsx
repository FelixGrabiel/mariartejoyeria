"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { formatPrice, slugify } from "@/lib/format";
import { Badge } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { Plus, Trash } from "@/components/ui/icons";
import type { ShippingZone } from "@/types";

function parseMoney(text: string, max = 1000): number | null | "invalid" {
  const clean = text.trim().replace(",", ".");
  if (clean === "") return null;
  const n = Number(clean);
  if (Number.isNaN(n) || n < 0 || n > max) return "invalid";
  return Math.round(n * 100) / 100;
}

function uniqueId(base: string, taken: string[]): string {
  const root = slugify(base) || "zona";
  if (!taken.includes(root)) return root;
  let i = 2;
  while (taken.includes(`${root}-${i}`)) i += 1;
  return `${root}-${i}`;
}

/** Zonas de envío: nombre, costo en soles, envío gratis desde un monto, plazo y recojo en tienda. */
export function ShippingPanel() {
  const { shippingZones, saveShippingZone, deleteShippingZone } = useStore();
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [toConfirm, setToConfirm] = useState(false);
  const [freeFrom, setFreeFrom] = useState("");
  const [eta, setEta] = useState("");
  const [pickup, setPickup] = useState(false);
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<ShippingZone | null>(null);

  function onAdd(event: FormEvent) {
    event.preventDefault();
    if (name.trim().length < 2) return setError("El nombre debe tener al menos 2 caracteres.");
    const cost = toConfirm ? null : parseMoney(price);
    if (!toConfirm && (cost === null || cost === "invalid")) return setError("Escribe el costo de envío en soles (usa 0 si es gratis).");
    const free = parseMoney(freeFrom, 100000);
    if (free === "invalid" || free === 0) return setError("«Gratis desde» debe ser un monto mayor que 0, o déjalo vacío.");
    saveShippingZone({
      id: uniqueId(name, shippingZones.map((z) => z.id)),
      name: name.trim(),
      price: cost === "invalid" ? null : cost,
      freeFrom: toConfirm || pickup ? null : free,
      eta: eta.trim().slice(0, 60),
      pickup,
      active: true,
      sortOrder: shippingZones.length + 1,
    });
    setName("");
    setPrice("");
    setToConfirm(false);
    setFreeFrom("");
    setEta("");
    setPickup(false);
    setError("");
    showToast("Zona de envío agregada.");
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-white p-5 text-[13.5px] leading-relaxed text-muted">
        <p className="font-semibold text-ink">Cómo funciona</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>El cliente elige su zona en el carrito y ve el costo sumado al total. El servidor vuelve a calcularlo, así que no se puede alterar.</li>
          <li>«Por confirmar» sirve para provincias o agencias: el pedido llega marcado y tú fijas el costo final en <strong>Pedidos</strong>.</li>
          <li>Si no hay ninguna zona activa, el carrito muestra «Envío por confirmar», como antes.</li>
        </ul>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={onAdd} noValidate className="rounded-2xl border border-line bg-white p-5 xl:self-start">
          <h3 className="font-serif text-[1.5rem] font-semibold">Nueva zona</h3>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="sz-name" className="field-label">Nombre de la zona</label>
              <input id="sz-name" className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej.: Lima Metropolitana" />
            </div>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" checked={pickup} onChange={(e) => setPickup(e.target.checked)} /> Es recojo en tienda
            </label>
            <label className="flex items-center gap-2 text-[13.5px]">
              <input type="checkbox" checked={toConfirm} onChange={(e) => setToConfirm(e.target.checked)} /> El costo se confirma por WhatsApp
            </label>
            {!toConfirm && (
              <div>
                <label htmlFor="sz-price" className="field-label">Costo de envío (S/)</label>
                <input id="sz-price" inputMode="decimal" className="field" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0.00" />
              </div>
            )}
            {!toConfirm && !pickup && (
              <div>
                <label htmlFor="sz-free" className="field-label">Envío gratis desde (S/) · opcional</label>
                <input id="sz-free" inputMode="decimal" className="field" value={freeFrom} onChange={(e) => setFreeFrom(e.target.value)} placeholder="Ej.: 150" />
              </div>
            )}
            <div>
              <label htmlFor="sz-eta" className="field-label">Plazo estimado · opcional</label>
              <input id="sz-eta" className="field" value={eta} onChange={(e) => setEta(e.target.value)} placeholder="Ej.: 1 a 2 días hábiles" maxLength={60} />
            </div>
            {error && <p role="alert" className="field-error">{error}</p>}
            <button type="submit" className="btn btn-primary w-full">
              <Plus size={17} /> Agregar zona
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {shippingZones.length === 0 && (
            <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
              Aún no hay zonas. Mientras no agregues ninguna, el envío se coordina por WhatsApp.
            </p>
          )}
          {shippingZones.map((z) => (
            <ZoneRow key={z.id} zone={z} onSave={saveShippingZone} onDelete={() => setToDelete(z)} />
          ))}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) deleteShippingZone(toDelete.id);
          setToDelete(null);
        }}
        title="¿Eliminar esta zona?"
        message="Los pedidos ya hechos conservan el nombre y el costo que tenían. Si solo quieres dejar de ofrecerla, ocúltala."
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}

function ZoneRow({ zone, onSave, onDelete }: { zone: ShippingZone; onSave: (z: ShippingZone) => void; onDelete: () => void }) {
  const { showToast } = useToast();
  const [name, setName] = useState(zone.name);
  const [price, setPrice] = useState(zone.price === null ? "" : zone.price.toFixed(2));
  const [freeFrom, setFreeFrom] = useState(zone.freeFrom === null ? "" : zone.freeFrom.toFixed(2));
  const [eta, setEta] = useState(zone.eta);

  function commit(patch: Partial<ShippingZone>) {
    onSave({ ...zone, ...patch });
  }
  function bad(message: string) {
    showToast(message, { tone: "error" });
    setName(zone.name);
    setPrice(zone.price === null ? "" : zone.price.toFixed(2));
    setFreeFrom(zone.freeFrom === null ? "" : zone.freeFrom.toFixed(2));
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <label htmlFor={`zn-${zone.id}`} className="sr-only">Nombre de la zona</label>
          <input
            id={`zn-${zone.id}`}
            className="field font-semibold"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => {
              const v = name.trim();
              if (v.length < 2) return bad("El nombre debe tener al menos 2 caracteres.");
              if (v !== zone.name) commit({ name: v });
            }}
          />
        </div>
        {zone.pickup && <Badge tone="blush">Recojo</Badge>}
        <Badge tone={zone.active ? "success" : "neutral"}>{zone.active ? "Visible" : "Oculta"}</Badge>
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => commit({ active: !zone.active })}>
          {zone.active ? "Ocultar" : "Mostrar"}
        </button>
        <button type="button" className="icon-btn text-muted hover:text-danger" aria-label={`Eliminar ${zone.name}`} onClick={onDelete}>
          <Trash size={18} />
        </button>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <label htmlFor={`zp-${zone.id}`} className="field-label">Costo (S/)</label>
          <input
            id={`zp-${zone.id}`}
            inputMode="decimal"
            className="field"
            value={price}
            placeholder="Por confirmar"
            onChange={(e) => setPrice(e.target.value)}
            onBlur={() => {
              const v = parseMoney(price);
              if (v === "invalid") return bad("Costo no válido (0 a 1,000). Déjalo vacío para «por confirmar».");
              if (v !== zone.price) commit({ price: v, freeFrom: v === null ? null : zone.freeFrom });
            }}
          />
        </div>
        <div>
          <label htmlFor={`zf-${zone.id}`} className="field-label">Gratis desde (S/)</label>
          <input
            id={`zf-${zone.id}`}
            inputMode="decimal"
            className="field"
            value={freeFrom}
            placeholder="Sin envío gratis"
            disabled={zone.price === null}
            onChange={(e) => setFreeFrom(e.target.value)}
            onBlur={() => {
              const v = parseMoney(freeFrom, 100000);
              if (v === "invalid" || v === 0) return bad("«Gratis desde» debe ser mayor que 0, o vacío.");
              if (v !== zone.freeFrom) commit({ freeFrom: v });
            }}
          />
        </div>
        <div>
          <label htmlFor={`ze-${zone.id}`} className="field-label">Plazo estimado</label>
          <input
            id={`ze-${zone.id}`}
            className="field"
            value={eta}
            maxLength={60}
            onChange={(e) => setEta(e.target.value)}
            onBlur={() => eta.trim() !== zone.eta && commit({ eta: eta.trim() })}
          />
        </div>
      </div>
      <p className="mt-2 text-[12px] text-muted">
        {zone.price === null ? "Costo por confirmar con el cliente." : zone.price === 0 ? "Sin costo para el cliente." : `Cuesta ${formatPrice(zone.price)}.`}
        {zone.freeFrom !== null && zone.price !== null ? ` Gratis desde ${formatPrice(zone.freeFrom)}.` : ""}
      </p>
    </div>
  );
}
