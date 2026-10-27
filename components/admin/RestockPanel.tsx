"use client";

import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { formatDate } from "@/lib/format";
import { whatsappToCustomer } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/Badge";

/** Bandeja de avisos: personas que pidieron que les escriban cuando un producto agotado vuelva. */
export function RestockPanel() {
  const { restockRequests, setRestockStatus, products } = useStore();
  const [filter, setFilter] = useState<"pendiente" | "atendido" | "todos">("pendiente");
  const list = restockRequests.filter((r) => filter === "todos" || r.status === filter);
  const stockOf = (productId: string | null, sku?: string) => {
    const p = products.find((x) => x.id === productId);
    if (!p) return null;
    return sku ? p.variants.find((v) => v.sku === sku)?.stock ?? 0 : p.variants.reduce((s, v) => s + v.stock, 0);
  };

  return (
    <div>
      <p className="mb-4 max-w-2xl text-[13px] text-muted">
        Estas personas dejaron su contacto para que les escribas cuando un producto agotado vuelva. El aviso es manual: cuando repongas stock,
        pulsa «Avisar por WhatsApp» y luego «Marcar atendido».
      </p>
      <div className="mb-4 flex gap-2">
        {(["pendiente", "atendido", "todos"] as const).map((f) => (
          <button
            key={f}
            type="button"
            aria-pressed={filter === f}
            onClick={() => setFilter(f)}
            className={`h-9 rounded-full px-4 text-[13px] font-medium capitalize ${filter === f ? "bg-ink text-ivory" : "border border-line bg-white text-ink"}`}
          >
            {f === "pendiente" ? "Pendientes" : f === "atendido" ? "Atendidos" : "Todos"}{" "}
            <span className="opacity-60">({restockRequests.filter((r) => f === "todos" || r.status === f).length})</span>
          </button>
        ))}
      </div>

      {list.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">No hay avisos en esta lista.</p>}

      <ul className="space-y-3">
        {list.map((r) => {
          const stock = stockOf(r.productId, r.sku);
          const label = `${r.productName}${r.variantLabel ? ` (${r.variantLabel})` : ""}`;
          return (
            <li key={r.id} className="rounded-2xl border border-line bg-white p-4">
              <div className="flex flex-wrap items-center gap-3">
                <p className="min-w-0 flex-1 font-semibold text-ink">{label}</p>
                {stock !== null && <Badge tone={stock > 0 ? "success" : "danger"}>{stock > 0 ? `Ya hay ${stock} en stock` : "Sigue agotado"}</Badge>}
                <Badge tone={r.status === "pendiente" ? "warning" : "neutral"}>{r.status === "pendiente" ? "Pendiente" : "Atendido"}</Badge>
              </div>
              <p className="mt-1 text-[13.5px] text-ink">
                {r.customerName} · {r.customerPhone} <span className="text-muted">· {formatDate(r.createdAt)}</span>
              </p>
              {r.note && <p className="mt-1 text-[13px] italic text-muted">«{r.note}»</p>}
              <div className="mt-3 flex flex-wrap gap-2">
                <a
                  href={whatsappToCustomer(r.customerPhone, `Hola ${r.customerName}, te escribimos de MariArte: ${label} ya está disponible. ¿Quieres que te lo reservemos?`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-whatsapp btn-sm"
                >
                  Avisar por WhatsApp
                </a>
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRestockStatus(r.id, r.status === "pendiente" ? "atendido" : "pendiente")}>
                  {r.status === "pendiente" ? "Marcar atendido" : "Reabrir"}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
