"use client";

import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { cn, formatDate, formatPrice } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";
import { Badge, type BadgeTone } from "@/components/ui/Badge";

export const orderStatuses: OrderStatus[] = ["pendiente", "confirmado", "preparado", "enviado", "entregado", "cancelado"];

export const statusTone: Record<OrderStatus, BadgeTone> = {
  pendiente: "warning",
  confirmado: "blush",
  preparado: "champagne",
  enviado: "neutral",
  entregado: "success",
  cancelado: "danger",
};

export function orderTotal(order: Order): number {
  return order.items.reduce((sum, i) => sum + i.quantity * (i.unitPrice + (i.packagingPrice ?? 0)), 0);
}

export function OrdersTable({ orders, compact = false }: { orders: Order[]; compact?: boolean }) {
  const { updateOrderStatus } = useStore();
  const { showToast } = useToast();

  if (orders.length === 0) {
    return <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">No hay pedidos con este estado.</p>;
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full min-w-[720px] text-left text-[13.5px]">
        <caption className="sr-only">Pedidos de ejemplo</caption>
        <thead className="bg-ivory text-[11px] uppercase tracking-[0.12em] text-muted">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Pedido</th>
            <th scope="col" className="px-4 py-3 font-semibold">Cliente</th>
            {!compact && <th scope="col" className="px-4 py-3 font-semibold">Detalle</th>}
            <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
            <th scope="col" className="px-4 py-3 text-right font-semibold">Total</th>
            <th scope="col" className="px-4 py-3 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {orders.map((order) => (
            <tr key={order.id} className="align-top">
              <td className="px-4 py-3.5">
                <p className="font-semibold text-ink">{order.code}</p>
                <p className="text-[12px] text-muted">{order.channel}</p>
              </td>
              <td className="px-4 py-3.5">
                <p className="text-ink">{order.customerName}</p>
                <p className="text-[12px] text-muted">{order.district}</p>
                {order.address && <p className="text-[12px] text-muted">{order.address}</p>}
                {order.customerPhone && (
                  <a
                    href={`https://wa.me/51${order.customerPhone}?text=${encodeURIComponent(`Hola ${order.customerName}, te escribimos de MariArte por tu pedido ${order.code}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="link-underline mt-0.5 inline-block text-[12px] font-semibold text-rose-deep"
                  >
                    Escribir a {order.customerPhone}
                  </a>
                )}
              </td>
              {!compact && (
                <td className="px-4 py-3.5 text-[12.5px] text-muted">
                  {order.items.map((i, idx) => (
                    <div key={`${i.productId}-${i.variantLabel}-${idx}`} className="mb-1.5 last:mb-0">
                      <p>
                        {i.quantity}× {i.productName} · {i.variantLabel}
                        {i.occasion || i.packagingName || i.dedication ? <span className="ml-1 font-semibold text-rose-deep">· Regalo</span> : null}
                        {i.comboName ? <span className="ml-1 font-semibold text-rose-deep">· Combo «{i.comboName}» #{i.comboGroup}</span> : null}
                      </p>
                      {i.occasion && <p className="pl-3">Ocasión: {i.occasion}</p>}
                      {i.packagingName && (
                        <p className="pl-3">
                          Empaque: {i.packagingName}
                          {i.packagingPrice ? ` (+S/ ${i.packagingPrice.toFixed(2)})` : ""}
                        </p>
                      )}
                      {i.dedication && <p className="pl-3 italic">Dedicatoria: «{i.dedication}»</p>}
                      {i.meaningCard && <p className="pl-3">Con tarjeta de significado</p>}
                    </div>
                  ))}
                </td>
              )}
              <td className="whitespace-nowrap px-4 py-3.5 text-muted">{formatDate(order.createdAt)}</td>
              <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{formatPrice(orderTotal(order))}</td>
              <td className="px-4 py-3.5">
                {compact ? (
                  <Badge tone={statusTone[order.status]}>{order.status}</Badge>
                ) : (
                  <>
                    <label htmlFor={`status-${order.id}`} className="sr-only">
                      Estado del pedido {order.code}
                    </label>
                    <select
                      id={`status-${order.id}`}
                      value={order.status}
                      onChange={(e) => {
                        const status = e.target.value as OrderStatus;
                        updateOrderStatus(order.id, status);
                        showToast(`${order.code} ahora está «${status}».`, { tone: "info" });
                      }}
                      className={cn("field min-h-10 w-40 rounded-full py-1.5 text-[13px] capitalize")}
                    >
                      {orderStatuses.map((s) => (
                        <option key={s} value={s} className="capitalize">
                          {s}
                        </option>
                      ))}
                    </select>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
