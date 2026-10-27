"use client";

import { useEffect, useState, type FormEvent } from "react";
import { emptyCustomer, normalizePhone, type Customer } from "@/lib/customer";
import { readStorage } from "@/lib/storage";
import { dbRequestRestock, supabase } from "@/lib/supabase";
import { availabilityMessage, whatsappUrl } from "@/lib/whatsapp";
import type { Product, ProductVariant } from "@/types";
import { Check, MessageCircle } from "@/components/ui/icons";

/**
 * Se muestra cuando una joya (o la opción elegida) está agotada: el cliente puede preguntar por WhatsApp
 * o dejar su contacto para que la tienda le escriba si vuelve. Es un aviso manual, no automático.
 */
export function RestockNotice({ product, variant }: { product: Product; variant?: ProductVariant }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  // Si ya escribió sus datos en el carrito, los reutilizamos.
  useEffect(() => {
    const saved = readStorage<Customer>("mariarte.v1.customer", emptyCustomer);
    setName((n) => n || saved.name);
    setPhone((p) => p || saved.phone);
  }, []);

  // Al cambiar de opción se reinicia el aviso.
  useEffect(() => {
    setDone(false);
    setError("");
  }, [variant?.sku]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError("Escribe tu nombre.");
    if (!/^9\d{8}$/.test(normalizePhone(phone))) return setError("Escribe un celular de 9 dígitos que empiece con 9.");
    if (!consent) return setError("Marca la casilla para que podamos escribirte.");
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setError("Escribe un correo válido o déjalo vacío.");
    setBusy(true);
    const result = await dbRequestRestock({ productId: product.id, sku: variant?.sku, name, phone, email, note, consent });
    setBusy(false);
    if ("error" in result) setError(result.error);
    else setDone(true);
  }

  const label = variant && product.variants.length > 1 ? `${product.name} (${variant.label})` : product.name;

  return (
    <section aria-labelledby="restock-title" className="rounded-2xl border border-dashed border-rose/40 bg-blush-soft/50 p-4 sm:p-5">
      <h2 id="restock-title" className="font-serif text-[1.3rem] font-semibold text-ink">
        Agotado por ahora
      </h2>
      <p className="mt-1 text-[13.5px] text-muted">
        Pregúntale a MariArte si volverá a estar disponible. No podemos asegurar una fecha hasta que la tienda lo confirme.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <a href={whatsappUrl(availabilityMessage(label))} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp flex-1">
          <MessageCircle size={17} /> Consultar por WhatsApp
        </a>
        {supabase && !done && (
          <button type="button" className="btn btn-secondary flex-1" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
            Avísame cuando vuelva
          </button>
        )}
      </div>

      {done && (
        <p role="status" className="mt-4 flex items-start gap-2 text-[13.5px] text-ink">
          <Check size={16} className="mt-0.5 shrink-0 text-success" />
          Listo, dejamos tu aviso. Si el producto vuelve, MariArte te escribirá al número que indicaste{email.trim() ? " y te enviará un correo" : ""}. No podemos reservarlo ni asegurar una fecha.
        </p>
      )}

      {open && !done && (
        <form onSubmit={onSubmit} noValidate className="mt-4 space-y-3">
          <div>
            <label htmlFor="rs-name" className="field-label">Nombre</label>
            <input id="rs-name" className="field" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          </div>
          <div>
            <label htmlFor="rs-phone" className="field-label">Celular</label>
            <input id="rs-phone" className="field" inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder="987 654 321" />
          </div>
          <div>
            <label htmlFor="rs-email" className="field-label">Correo (opcional, para avisarte automáticamente)</label>
            <input id="rs-email" type="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="tucorreo@ejemplo.com" />
          </div>
          <div>
            <label htmlFor="rs-note" className="field-label">Nota (opcional)</label>
            <input id="rs-note" className="field" value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Ej.: lo necesito para un regalo" />
          </div>
          <label className="flex cursor-pointer items-start gap-3 text-[13px] leading-snug">
            <input type="checkbox" className="mt-0.5 h-4 w-4 accent-rose" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>Acepto que MariArte me avise de {label} por WhatsApp a este número{email.trim() ? " y por correo" : ""}. Usarán mis datos solo para eso.</span>
          </label>
          {error && (
            <p role="alert" className="field-error">
              {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full" disabled={busy}>
            {busy ? "Enviando…" : "Dejar mi aviso"}
          </button>
        </form>
      )}
    </section>
  );
}
