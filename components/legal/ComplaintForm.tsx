"use client";

import { useState, type FormEvent } from "react";
import { dbSubmitComplaint, supabase, type ComplaintInput } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
import { Check } from "@/components/ui/icons";

const empty: ComplaintInput = {
  name: "",
  docType: "DNI",
  docNumber: "",
  address: "",
  phone: "",
  email: "",
  guardian: "",
  itemType: "producto",
  itemDescription: "",
  amount: "",
  kind: "reclamo",
  detail: "",
  request: "",
  orderCode: "",
  consent: false,
};

/** Valida igual que el servidor para dar mensajes claros antes de enviar. */
export function validateComplaint(c: ComplaintInput): Partial<Record<keyof ComplaintInput, string>> {
  const e: Partial<Record<keyof ComplaintInput, string>> = {};
  const doc = c.docNumber.replace(/\s/g, "").toUpperCase();
  if (c.name.trim().length < 3) e.name = "Escribe tu nombre completo.";
  if (c.docType === "DNI" && !/^\d{8}$/.test(doc)) e.docNumber = "El DNI tiene 8 dígitos.";
  else if (c.docType === "RUC" && !/^\d{11}$/.test(doc)) e.docNumber = "El RUC tiene 11 dígitos.";
  else if ((c.docType === "CE" || c.docType === "Pasaporte") && !/^[A-Z0-9]{6,12}$/.test(doc)) e.docNumber = "Escribe entre 6 y 12 letras o números.";
  if (c.address.trim().length < 5) e.address = "Escribe tu domicilio.";
  if (!/^\+?\d{7,15}$/.test(c.phone.replace(/[^\d+]/g, ""))) e.phone = "Escribe un teléfono válido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c.email.trim())) e.email = "Escribe un correo válido.";
  if (c.itemDescription.trim().length < 3) e.itemDescription = "Describe el producto o servicio.";
  if (c.amount.trim() && (Number.isNaN(Number(c.amount.replace(",", "."))) || Number(c.amount.replace(",", ".")) < 0)) e.amount = "Escribe un monto válido en soles.";
  if (c.detail.trim().length < 10) e.detail = "Cuéntanos qué ocurrió (mínimo 10 caracteres).";
  if (c.request.trim().length < 5) e.request = "Indica qué solicitas (mínimo 5 caracteres).";
  if (!c.consent) e.consent = "Debes aceptar el tratamiento de tus datos.";
  return e;
}

export function ComplaintForm() {
  const [form, setForm] = useState<ComplaintInput>(empty);
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState<{ number: string; createdAt: string; kind: string } | null>(null);
  const errors = validateComplaint(form);
  const set = (patch: Partial<ComplaintInput>) => setForm((f) => ({ ...f, ...patch }));
  const err = (k: keyof ComplaintInput) => (touched ? errors[k] : undefined);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setTouched(true);
    if (Object.keys(errors).length > 0) return;
    setBusy(true);
    const result = await dbSubmitComplaint(form);
    setBusy(false);
    if ("error" in result) return setError(result.error);
    setDone({ number: result.number, createdAt: result.createdAt, kind: form.kind });
    setForm(empty);
    setTouched(false);
  }

  if (done) {
    return (
      <div role="status" className="rounded-3xl border border-line bg-white p-6 sm:p-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-success-soft text-success"><Check size={20} /></span>
        <h2 className="mt-4 font-serif text-[1.8rem] font-semibold">Registramos tu {done.kind}</h2>
        <p className="mt-2 text-[15px] text-muted">
          Tu número de hoja es <strong className="text-ink">{done.number}</strong> ({formatDate(done.createdAt)}). Guárdalo: lo necesitarás para cualquier consulta.
          Te responderemos al correo y al teléfono que indicaste dentro del plazo legal.
        </p>
        <button type="button" className="btn btn-secondary mt-6" onClick={() => setDone(null)}>Registrar otro</button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-8 rounded-3xl border border-line bg-white p-6 sm:p-8">
      {!supabase && <p className="rounded-xl bg-warning-soft px-4 py-3 text-sm text-warning">El Libro de Reclamaciones virtual no está disponible en este momento.</p>}

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-serif text-[1.35rem] font-semibold">1. Tus datos</legend>
        <Field id="lr-name" label="Nombre completo" value={form.name} onChange={(v) => set({ name: v })} error={err("name")} autoComplete="name" className="sm:col-span-2" />
        <div>
          <label htmlFor="lr-doctype" className="field-label">Documento</label>
          <select id="lr-doctype" className="field" value={form.docType} onChange={(e) => set({ docType: e.target.value })}>
            <option>DNI</option>
            <option>CE</option>
            <option>Pasaporte</option>
            <option>RUC</option>
          </select>
        </div>
        <Field id="lr-doc" label="Número de documento" value={form.docNumber} onChange={(v) => set({ docNumber: v })} error={err("docNumber")} inputMode="text" />
        <Field id="lr-address" label="Domicilio" value={form.address} onChange={(v) => set({ address: v })} error={err("address")} autoComplete="street-address" className="sm:col-span-2" />
        <Field id="lr-phone" label="Teléfono" value={form.phone} onChange={(v) => set({ phone: v })} error={err("phone")} autoComplete="tel" inputMode="tel" />
        <Field id="lr-email" label="Correo electrónico" value={form.email} onChange={(v) => set({ email: v })} error={err("email")} autoComplete="email" inputMode="email" />
        <Field id="lr-guardian" label="Padre, madre o tutor (solo si eres menor de edad)" value={form.guardian} onChange={(v) => set({ guardian: v })} className="sm:col-span-2" />
      </fieldset>

      <fieldset className="grid gap-4 sm:grid-cols-2">
        <legend className="mb-3 font-serif text-[1.35rem] font-semibold">2. Producto o servicio</legend>
        <div>
          <label htmlFor="lr-itemtype" className="field-label">Tipo</label>
          <select id="lr-itemtype" className="field" value={form.itemType} onChange={(e) => set({ itemType: e.target.value as ComplaintInput["itemType"] })}>
            <option value="producto">Producto</option>
            <option value="servicio">Servicio</option>
          </select>
        </div>
        <Field id="lr-amount" label="Monto reclamado en S/ (opcional)" value={form.amount} onChange={(v) => set({ amount: v })} error={err("amount")} inputMode="decimal" />
        <Field id="lr-item" label="Descripción" value={form.itemDescription} onChange={(v) => set({ itemDescription: v })} error={err("itemDescription")} className="sm:col-span-2" />
        <Field id="lr-order" label="Código de pedido (opcional)" value={form.orderCode} onChange={(v) => set({ orderCode: v })} placeholder="MA-2005" className="sm:col-span-2" />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="mb-3 font-serif text-[1.35rem] font-semibold">3. Detalle</legend>
        <div role="radiogroup" aria-label="Tipo de registro" className="grid gap-3 sm:grid-cols-2">
          {([
            ["reclamo", "Reclamo", "Disconformidad con un producto o servicio."],
            ["queja", "Queja", "Malestar por la atención recibida, sin que sea un reclamo del producto."],
          ] as const).map(([value, label, hint]) => (
            <label key={value} className={`cursor-pointer rounded-2xl border p-4 text-[14px] ${form.kind === value ? "border-rose bg-blush/20" : "border-line"}`}>
              <input type="radio" name="kind" className="mr-2" checked={form.kind === value} onChange={() => set({ kind: value })} />
              <strong>{label}</strong>
              <span className="mt-1 block text-[12.5px] text-muted">{hint}</span>
            </label>
          ))}
        </div>
        <div>
          <label htmlFor="lr-detail" className="field-label">¿Qué ocurrió?</label>
          <textarea id="lr-detail" rows={5} maxLength={1500} className="field resize-y" value={form.detail} onChange={(e) => set({ detail: e.target.value })} aria-invalid={Boolean(err("detail"))} />
          {err("detail") && <p className="field-error">{err("detail")}</p>}
        </div>
        <div>
          <label htmlFor="lr-request" className="field-label">¿Qué solicitas?</label>
          <textarea id="lr-request" rows={3} maxLength={800} className="field resize-y" value={form.request} onChange={(e) => set({ request: e.target.value })} aria-invalid={Boolean(err("request"))} />
          {err("request") && <p className="field-error">{err("request")}</p>}
        </div>
      </fieldset>

      <div>
        <label className="flex items-start gap-3 text-[13.5px] leading-snug text-muted">
          <input type="checkbox" className="mt-1" checked={form.consent} onChange={(e) => set({ consent: e.target.checked })} />
          <span>
            Acepto que MariArte trate mis datos para atender este reclamo o queja, según la{" "}
            <a href="/politicas#privacidad" className="link-underline text-rose-deep">política de privacidad</a>.
          </span>
        </label>
        {err("consent") && <p className="field-error mt-1">{err("consent")}</p>}
      </div>

      <p className="text-[12.5px] leading-snug text-muted">
        La formulación del reclamo no impide acudir a otras vías de solución de controversias ni es requisito previo para interponer una denuncia ante el INDECOPI.
      </p>

      {error && <p role="alert" className="field-error">{error}</p>}
      <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={busy || !supabase}>
        {busy ? "Enviando…" : "Enviar al Libro de Reclamaciones"}
      </button>
    </form>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  className,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id" | "className">) {
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...rest} />
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}
