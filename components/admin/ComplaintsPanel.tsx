"use client";

import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { formatDate, formatPrice } from "@/lib/format";
import { whatsappToCustomer } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/Badge";
import type { Complaint } from "@/types";

const DAY = 86_400_000;

/** Días calendario que faltan (o se pasaron) para responder, según el plazo configurado en la ley (15 días hábiles ≈ 21 calendario). */
function daysLeft(c: Complaint, limitDays = 30): number {
  return Math.ceil((new Date(c.createdAt).getTime() + limitDays * DAY - Date.now()) / DAY);
}

export function ComplaintsPanel() {
  const { complaints } = useStore();
  const pending = complaints.filter((c) => c.status === "pendiente");
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-white p-5 text-[13.5px] text-muted">
        La ley peruana obliga a responder cada reclamo en un plazo máximo de <strong>15 días hábiles</strong> (prorrogable según el caso). Responde por correo o teléfono y registra aquí la respuesta.
        {pending.length > 0 && <p className="mt-2 font-semibold text-warning">{pending.length} reclamo(s) o queja(s) pendientes.</p>}
      </div>
      {complaints.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">Aún no hay reclamos ni quejas.</p>}
      {complaints.map((c) => (
        <ComplaintCard key={c.id} complaint={c} />
      ))}
    </div>
  );
}

function ComplaintCard({ complaint: c }: { complaint: Complaint }) {
  const { respondComplaint } = useStore();
  const { showToast } = useToast();
  const [text, setText] = useState("");
  const left = daysLeft(c);
  return (
    <article className="rounded-2xl border border-line bg-white p-5">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="font-semibold text-ink">{c.number}</h3>
        <Badge tone={c.kind === "queja" ? "neutral" : "blush"}>{c.kind}</Badge>
        <Badge tone={c.status === "respondido" ? "success" : left < 0 ? "danger" : "warning"}>
          {c.status === "respondido" ? "Respondido" : left < 0 ? "Plazo vencido" : "Pendiente"}
        </Badge>
        <span className="text-[12px] text-muted">{formatDate(c.createdAt)}</span>
      </div>
      <dl className="mt-3 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-2">
        <div><dt className="inline text-muted">Consumidor: </dt><dd className="inline">{c.consumerName} · {c.docType} {c.docNumber}</dd></div>
        <div><dt className="inline text-muted">Contacto: </dt><dd className="inline">{c.phone} · {c.email}</dd></div>
        <div className="sm:col-span-2"><dt className="inline text-muted">Domicilio: </dt><dd className="inline">{c.address}</dd></div>
        {c.guardianName && <div className="sm:col-span-2"><dt className="inline text-muted">Tutor: </dt><dd className="inline">{c.guardianName}</dd></div>}
        <div className="sm:col-span-2">
          <dt className="inline text-muted">{c.itemType === "producto" ? "Producto" : "Servicio"}: </dt>
          <dd className="inline">{c.itemDescription}{c.amount !== undefined ? ` · reclamado ${formatPrice(c.amount)}` : ""}{c.orderCode ? ` · pedido ${c.orderCode}` : ""}</dd>
        </div>
      </dl>
      <p className="mt-3 whitespace-pre-line text-[13.5px]"><span className="text-muted">Detalle: </span>{c.detail}</p>
      <p className="mt-2 whitespace-pre-line text-[13.5px]"><span className="text-muted">Solicita: </span>{c.request}</p>
      <a
        href={whatsappToCustomer(c.phone, `Hola ${c.consumerName}, te escribimos de MariArte por tu ${c.kind} ${c.number}.`)}
        target="_blank"
        rel="noopener noreferrer"
        className="link-underline mt-3 inline-block text-[12.5px] font-semibold text-rose-deep"
      >
        Escribir por WhatsApp
      </a>

      {c.status === "respondido" ? (
        <div className="mt-4 rounded-xl bg-success-soft p-4 text-[13.5px] text-success">
          <p className="font-semibold">Respuesta registrada{c.respondedAt ? ` · ${formatDate(c.respondedAt)}` : ""}</p>
          <p className="mt-1 whitespace-pre-line">{c.response}</p>
        </div>
      ) : (
        <div className="mt-4">
          <label htmlFor={`cr-${c.id}`} className="field-label">Respuesta enviada al cliente</label>
          <textarea id={`cr-${c.id}`} rows={3} className="field resize-y" value={text} onChange={(e) => setText(e.target.value)} />
          <button
            type="button"
            className="btn btn-primary btn-sm mt-2"
            onClick={() => {
              if (text.trim().length < 10) return showToast("Escribe la respuesta que le diste al cliente (mínimo 10 caracteres).", { tone: "error" });
              respondComplaint(c.id, text);
              showToast(`${c.number} marcado como respondido.`);
            }}
          >
            Marcar como respondido
          </button>
        </div>
      )}
    </article>
  );
}
