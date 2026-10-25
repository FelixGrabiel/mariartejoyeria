"use client";

import { useStore } from "@/context/StoreContext";
import { formatPrice } from "@/lib/format";
import { buildOrderMessage } from "@/lib/whatsapp";
import { ChevronDown, Info } from "@/components/ui/icons";
import { WhatsAppCheckoutButton } from "./WhatsAppCheckoutButton";

export function CartSummary() {
  const { cartLines, cartSubtotal, giftNote } = useStore();
  const valid = cartLines.filter((l) => !l.issue);
  const units = valid.reduce((sum, l) => sum + l.item.quantity, 0);
  const hasIssues = cartLines.some((l) => l.issue);
  const message = buildOrderMessage(cartLines, giftNote);

  return (
    <aside aria-labelledby="summary-title" className="card p-6 sm:p-7 lg:sticky lg:top-28">
      <h2 id="summary-title" className="font-serif text-[1.9rem] font-semibold">
        Resumen del pedido
      </h2>

      <dl className="mt-5 space-y-3 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal ({units} {units === 1 ? "pieza" : "piezas"})</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(cartSubtotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Envío</dt>
          <dd className="font-medium text-rose-deep">Por confirmar</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <dt className="font-semibold">Total referencial</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatPrice(cartSubtotal)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-right text-[12px] text-muted">sin incluir envío</p>

      {hasIssues && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">
          Hay piezas sin stock suficiente. No se incluirán en el mensaje hasta que ajustes la cantidad o las quites.
        </p>
      )}

      <div className="mt-6">
        <WhatsAppCheckoutButton message={message} items={valid.map((l) => l.item)} disabled={valid.length === 0} />
      </div>

      <p className="mt-4 flex gap-2 text-[12.5px] leading-snug text-muted">
        <Info size={15} className="mt-0.5 shrink-0" />
        Tu pedido queda pendiente de confirmación. MariArte verificará disponibilidad, precio final, pago y envío por WhatsApp. Esta web no realiza cobros.
      </p>

      <details className="group mt-5 rounded-2xl border border-line bg-ivory">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[13px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
          Ver mensaje que se enviará
          <ChevronDown size={16} className="transition group-open:rotate-180" />
        </summary>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border-t border-line px-4 py-3 font-sans text-[12.5px] leading-relaxed text-muted">
          {message}
        </pre>
      </details>
    </aside>
  );
}
