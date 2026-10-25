"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { cn, formatDate } from "@/lib/format";
import type { StockMovementType } from "@/types";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { AlertCircle } from "@/components/ui/icons";

const typeTone: Record<StockMovementType, BadgeTone> = { entrada: "success", salida: "danger", ajuste: "champagne" };

export function InventoryPanel() {
  const { products, movements, adjustStock } = useStore();
  const { showToast } = useToast();
  const [productId, setProductId] = useState(products[0]?.id ?? "");
  const [sku, setSku] = useState(products[0]?.variants[0]?.sku ?? "");
  const [type, setType] = useState<StockMovementType>("entrada");
  const [quantity, setQuantity] = useState("1");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<"todos" | StockMovementType>("todos");

  const product = products.find((p) => p.id === productId);
  const variant = product?.variants.find((v) => v.sku === sku);

  const list = useMemo(() => (filter === "todos" ? movements : movements.filter((m) => m.type === filter)), [movements, filter]);

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const qty = Number(quantity);
    if (type !== "ajuste" && qty < 0) {
      setError("Para entradas y salidas usa una cantidad positiva.");
      return;
    }
    const result = adjustStock(productId, sku, type, qty, note);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setError("");
    setQuantity("1");
    setNote("");
    showToast(result.message);
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <form onSubmit={onSubmit} noValidate className="rounded-2xl border border-line bg-white p-5 xl:self-start">
        <h3 className="font-serif text-[1.5rem] font-semibold">Registrar movimiento</h3>
        <p className="mt-1 text-[12.5px] text-muted">Actualiza el stock y deja trazabilidad (demo).</p>
        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="inv-product" className="field-label">Producto</label>
            <select
              id="inv-product"
              className="field"
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                setSku(products.find((p) => p.id === e.target.value)?.variants[0]?.sku ?? "");
              }}
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="inv-variant" className="field-label">Variante</label>
            <select id="inv-variant" className="field" value={sku} onChange={(e) => setSku(e.target.value)}>
              {product?.variants.map((v) => (
                <option key={v.sku} value={v.sku}>
                  {v.label} · stock {v.stock} · {v.sku}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="inv-type" className="field-label">Tipo</label>
              <select id="inv-type" className="field" value={type} onChange={(e) => setType(e.target.value as StockMovementType)}>
                <option value="entrada">Entrada (+)</option>
                <option value="salida">Salida (−)</option>
                <option value="ajuste">Ajuste (±)</option>
              </select>
            </div>
            <div>
              <label htmlFor="inv-qty" className="field-label">Cantidad</label>
              <input
                id="inv-qty"
                className="field"
                inputMode="numeric"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "inv-error" : "inv-help"}
              />
            </div>
          </div>
          <p id="inv-help" className="-mt-2 text-[12px] text-muted">
            {type === "ajuste" ? "Usa negativo para descontar (ej. −2)." : `Stock actual: ${variant?.stock ?? 0}`}
          </p>
          <div>
            <label htmlFor="inv-note" className="field-label">Nota</label>
            <input id="inv-note" className="field" placeholder="Ej.: Nueva producción, conteo físico…" value={note} onChange={(e) => setNote(e.target.value)} />
          </div>
          {error && (
            <p id="inv-error" role="alert" className="field-error">
              <AlertCircle size={14} /> {error}
            </p>
          )}
          <button type="submit" className="btn btn-primary w-full">Registrar</button>
        </div>
      </form>

      <div className="min-w-0">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {(["todos", "entrada", "salida", "ajuste"] as const).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "h-9 rounded-full px-4 text-[13px] font-medium capitalize transition",
                filter === f ? "bg-ink text-ivory" : "border border-line bg-white text-ink hover:border-rose/40",
              )}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="overflow-x-auto rounded-2xl border border-line bg-white">
          <table className="w-full min-w-[620px] text-left text-[13.5px]">
            <caption className="sr-only">Movimientos de stock</caption>
            <thead className="bg-ivory text-[11px] uppercase tracking-[0.12em] text-muted">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Fecha</th>
                <th scope="col" className="px-4 py-3 font-semibold">Producto / SKU</th>
                <th scope="col" className="px-4 py-3 font-semibold">Tipo</th>
                <th scope="col" className="px-4 py-3 text-right font-semibold">Cantidad</th>
                <th scope="col" className="px-4 py-3 font-semibold">Nota</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.map((m) => (
                <tr key={m.id}>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">{formatDate(m.date)}</td>
                  <td className="px-4 py-3">
                    <p className="text-ink">{m.productName}</p>
                    <p className="font-mono text-[11.5px] text-muted">{m.sku}</p>
                  </td>
                  <td className="px-4 py-3"><Badge tone={typeTone[m.type]}>{m.type}</Badge></td>
                  <td className={cn("px-4 py-3 text-right font-semibold tabular-nums", m.quantity < 0 ? "text-danger" : "text-success")}>
                    {m.quantity > 0 ? `+${m.quantity}` : m.quantity}
                  </td>
                  <td className="px-4 py-3 text-muted">{m.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {list.length === 0 && <p className="p-8 text-center text-sm text-muted">Sin movimientos.</p>}
        </div>
      </div>
    </div>
  );
}
