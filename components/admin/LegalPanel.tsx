"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useToast } from "@/context/ToastContext";
import { fillLegal, legalValues, missingBusinessFields } from "@/lib/legal";
import {
  dbSaveBusinessInfo,
  dbSaveLegalSection,
  emptyBusiness,
  fetchBusinessInfo,
  fetchLegalSections,
  type BusinessInfo,
  type BusinessKey,
} from "@/lib/supabase";
import { LegalText } from "@/components/legal/LegalText";
import { Badge } from "@/components/ui/Badge";
import type { LegalSection } from "@/types";

const fields: { key: BusinessKey; label: string; hint?: string }[] = [
  { key: "biz_legal_name", label: "Razón social o nombre del titular", hint: "Tal como figura en tu RUC." },
  { key: "biz_ruc", label: "RUC", hint: "11 dígitos." },
  { key: "biz_address", label: "Domicilio", hint: "Dirección fiscal o del local. Aparece en los términos y en el Libro de Reclamaciones." },
  { key: "biz_email", label: "Correo de contacto", hint: "Para derechos sobre datos personales y reclamos." },
  { key: "biz_city", label: "Ciudad para controversias", hint: "Ej.: Lima." },
  { key: "biz_payment_methods", label: "Medios de pago aceptados" },
  { key: "change_days", label: "Días para solicitar un cambio", hint: "Número de días calendario desde la recepción." },
];

/** Datos del titular y textos legales editables. Las {{llaves}} del texto se reemplazan con estos datos. */
export function LegalPanel() {
  const { showToast } = useToast();
  const [info, setInfo] = useState<BusinessInfo>(emptyBusiness);
  const [sections, setSections] = useState<LegalSection[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([fetchBusinessInfo(), fetchLegalSections()]).then(([b, s]) => {
      if (b) setInfo(b);
      if (s) setSections(s);
      setLoaded(true);
    });
  }, []);

  async function onSaveInfo(event: FormEvent) {
    event.preventDefault();
    if (info.biz_ruc.trim() && !/^\d{11}$/.test(info.biz_ruc.trim())) return showToast("El RUC debe tener 11 dígitos.", { tone: "error" });
    if (info.biz_email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(info.biz_email.trim())) return showToast("El correo no es válido.", { tone: "error" });
    const days = Number(info.change_days);
    if (!Number.isInteger(days) || days < 1 || days > 90) return showToast("Los días de cambio deben ser un número entre 1 y 90.", { tone: "error" });
    setSaving(true);
    const error = await dbSaveBusinessInfo(info);
    setSaving(false);
    if (error) return showToast(`No se pudo guardar: ${error}`, { tone: "error" });
    showToast("Datos del negocio guardados. Las políticas se actualizan en unos minutos.");
  }

  if (!loaded) return <p className="text-sm text-muted" aria-busy="true">Cargando…</p>;
  const missing = missingBusinessFields(info);

  return (
    <div className="space-y-8">
      {missing.length > 0 && (
        <div role="note" className="rounded-2xl bg-warning-soft px-5 py-4 text-[13.5px] text-warning">
          <p className="font-semibold">Para publicar la tienda, completa estos datos del titular:</p>
          <p className="mt-1">{missing.join(" · ")}</p>
          <p className="mt-1 text-[12.5px]">Mientras falten, las políticas muestran «[por completar]» en su lugar.</p>
        </div>
      )}

      <form onSubmit={onSaveInfo} className="grid gap-4 rounded-2xl border border-line bg-white p-5 sm:grid-cols-2">
        <h3 className="font-serif text-[1.5rem] font-semibold sm:col-span-2">Datos del negocio</h3>
        {fields.map((f) => (
          <div key={f.key} className={f.key === "biz_address" || f.key === "biz_payment_methods" ? "sm:col-span-2" : undefined}>
            <label htmlFor={`bz-${f.key}`} className="field-label">{f.label}</label>
            <input id={`bz-${f.key}`} className="field" value={info[f.key]} onChange={(e) => setInfo((i) => ({ ...i, [f.key]: e.target.value }))} maxLength={200} />
            {f.hint && <p className="mt-1 text-[12px] text-muted">{f.hint}</p>}
          </div>
        ))}
        <div className="sm:col-span-2">
          <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? "Guardando…" : "Guardar datos"}</button>
        </div>
      </form>

      <div className="space-y-4">
        <h3 className="font-serif text-[1.5rem] font-semibold">Textos legales</h3>
        <p className="max-w-2xl text-[13px] text-muted">
          Son borradores basados en la normativa peruana de consumo y protección de datos; conviene que un abogado los revise antes de lanzar. Puedes escribir con «## Título»,
          «- viñeta» y párrafos. Los datos entre llaves, como {"{{razon_social}}"}, {"{{ruc}}"}, {"{{domicilio}}"}, {"{{correo}}"}, {"{{whatsapp}}"}, {"{{dias_cambio}}"}, {"{{medios_pago}}"}, {"{{ciudad}}"} y {"{{sitio}}"}, se completan solos.
        </p>
        {sections.map((s) => (
          <SectionEditor key={s.id} section={s} info={info} onSaved={(next) => setSections((list) => list.map((x) => (x.id === next.id ? next : x)))} />
        ))}
      </div>
    </div>
  );
}

function SectionEditor({ section, info, onSaved }: { section: LegalSection; info: BusinessInfo; onSaved: (s: LegalSection) => void }) {
  const { showToast } = useToast();
  const [title, setTitle] = useState(section.title);
  const [body, setBody] = useState(section.body);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const dirty = title !== section.title || body !== section.body;

  async function save() {
    if (title.trim().length < 3 || body.trim().length < 20) return showToast("Escribe un título y un texto más completos.", { tone: "error" });
    setSaving(true);
    const next = { ...section, title: title.trim(), body: body.trim() };
    const error = await dbSaveLegalSection(next);
    setSaving(false);
    if (error) return showToast(`No se pudo guardar: ${error}`, { tone: "error" });
    onSaved(next);
    showToast(`«${next.title}» guardado.`);
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <label htmlFor={`lg-t-${section.id}`} className="sr-only">Título</label>
        <input id={`lg-t-${section.id}`} className="field max-w-sm font-semibold" value={title} onChange={(e) => setTitle(e.target.value)} />
        {dirty && <Badge tone="warning">Sin guardar</Badge>}
        <span className="flex-1" />
        <button type="button" className="btn btn-secondary btn-sm" onClick={() => setPreview((p) => !p)}>{preview ? "Editar" : "Vista previa"}</button>
        <button type="button" className="btn btn-primary btn-sm" disabled={!dirty || saving} onClick={save}>{saving ? "Guardando…" : "Guardar"}</button>
      </div>
      {preview ? (
        <div className="mt-4 rounded-xl bg-ivory p-4"><LegalText text={fillLegal(body, legalValues(info))} /></div>
      ) : (
        <>
          <label htmlFor={`lg-b-${section.id}`} className="sr-only">Texto de {section.title}</label>
          <textarea id={`lg-b-${section.id}`} rows={14} className="field mt-4 resize-y font-mono text-[12.5px]" value={body} onChange={(e) => setBody(e.target.value)} />
        </>
      )}
    </div>
  );
}
