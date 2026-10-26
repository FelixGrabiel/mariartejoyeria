"use client";

import { useState, type FormEvent } from "react";
import { cn, formatDate } from "@/lib/format";
import { normalizePhone } from "@/lib/customer";
import { dbTrackOrder, supabase, type TrackedOrder } from "@/lib/supabase";
import { Check } from "@/components/ui/icons";
import { DemoNotice } from "@/components/ui/misc";
import type { OrderStatus } from "@/types";

const flow: { status: OrderStatus; label: string; hint: string }[] = [
  { status: "pendiente", label: "Recibido", hint: "Tu solicitud llegó. MariArte la confirmará por WhatsApp." },
  { status: "confirmado", label: "Confirmado", hint: "Disponibilidad y precio final confirmados." },
  { status: "preparado", label: "En preparación", hint: "Estamos preparando tu pedido." },
  { status: "enviado", label: "Enviado", hint: "Tu pedido va en camino." },
  { status: "entregado", label: "Entregado", hint: "¡Que lo disfrutes!" },
];

export function OrderTracker() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [searched, setSearched] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setOrder(null);
    if (!code.trim() || !/^9\d{8}$/.test(normalizePhone(phone))) {
      setError("Escribe tu código (por ejemplo MA-2005) y el celular de 9 dígitos que usaste en el pedido.");
      return;
    }
    setBusy(true);
    const result = await dbTrackOrder(code, phone);
    setBusy(false);
    setSearched(true);
    if ("error" in result) setError(result.error);
    else setOrder(result.order);
  }

  const currentIndex = order ? flow.findIndex((f) => f.status === order.status) : -1;

  return (
    <div className="container-page max-w-2xl pt-8 sm:pt-10">
      <p className="eyebrow mb-3">Después de tu pedido</p>
      <h1 className="font-serif text-[2.6rem] font-semibold leading-none sm:text-[3.2rem]">Sigue tu pedido</h1>
      <p className="mt-3 text-[15px] text-muted">
        Escribe el código que te mostramos al enviar tu pedido y el celular que usaste. Solo tú puedes ver su estado.
      </p>

      {!supabase && (
        <DemoNotice className="mt-6">El seguimiento funciona cuando la tienda está conectada a su base de datos.</DemoNotice>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-4 rounded-3xl border border-line bg-white p-6 sm:grid-cols-2">
        <div>
          <label htmlFor="tr-code" className="field-label">Código del pedido</label>
          <input id="tr-code" className="field uppercase" placeholder="MA-2005" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="tr-phone" className="field-label">Celular</label>
          <input id="tr-phone" className="field" inputMode="tel" placeholder="987 654 321" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" className="btn btn-primary w-full" disabled={busy || !supabase}>
            {busy ? "Buscando…" : "Ver estado"}
          </button>
        </div>
        {error && (
          <p role="alert" className="field-error sm:col-span-2">
            {error}
          </p>
        )}
      </form>

      {searched && !order && !error && (
        <p role="status" className="mt-6 rounded-2xl border border-dashed border-line p-6 text-center text-sm text-muted">
          No encontramos un pedido con ese código y celular. Revisa los datos o escríbenos por WhatsApp.
        </p>
      )}

      {order && (
        <section aria-labelledby="tr-result" className="mt-8 rounded-3xl border border-line bg-white p-6 sm:p-8">
          <h2 id="tr-result" className="font-serif text-[1.7rem] font-semibold">
            Pedido {order.code}
          </h2>
          <p className="text-[13px] text-muted">Solicitado el {formatDate(order.created_at)}</p>

          {order.status === "cancelado" ? (
            <p className="mt-5 rounded-2xl bg-danger-soft px-4 py-3 text-[14px] font-medium text-danger">Este pedido fue cancelado.</p>
          ) : (
            <ol className="mt-6 space-y-4">
              {flow.map((step, i) => {
                const done = i <= currentIndex;
                return (
                  <li key={step.status} className="flex gap-3" aria-current={i === currentIndex ? "step" : undefined}>
                    <span className={cn("mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-white", done ? "bg-rose" : "bg-line")}>
                      {done && <Check size={14} />}
                    </span>
                    <div>
                      <p className={cn("font-semibold", done ? "text-ink" : "text-muted")}>{step.label}</p>
                      {i === currentIndex && <p className="text-[13px] text-muted">{step.hint}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          <h3 className="mt-8 text-[13px] font-semibold uppercase tracking-[0.14em] text-muted">Tu pedido</h3>
          <ul className="mt-2 divide-y divide-line text-[14px]">
            {order.items.map((i, idx) => (
              <li key={idx} className="py-2.5">
                {i.quantity}× {i.name} · {i.variant}
                {i.combo && <span className="block text-[12.5px] text-muted">Combo · {i.combo}</span>}
                {(i.occasion || i.packaging) && (
                  <span className="block text-[12.5px] text-muted">
                    Regalo{i.occasion ? ` · ${i.occasion}` : ""}
                    {i.packaging ? ` · ${i.packaging}` : ""}
                  </span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-[12px] text-muted">El precio final, el pago y el envío se confirman por WhatsApp.</p>
        </section>
      )}
    </div>
  );
}
