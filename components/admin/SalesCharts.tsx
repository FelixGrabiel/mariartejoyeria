"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { cn, formatPrice } from "@/lib/format";
import { ordersByStatus, salesByDay, salesByZone, summarize, topProducts, type RankRow } from "@/lib/sales";
import type { OrderStatus } from "@/types";

const PERIODS = [7, 30, 90] as const;

const statusBar: Record<OrderStatus, string> = {
  pendiente: "bg-warning",
  confirmado: "bg-rose",
  preparado: "bg-champagne",
  enviado: "bg-champagne-deep",
  entregado: "bg-success",
  cancelado: "bg-danger",
};

const shortDate = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d}/${m}`;
};

/** Gráficos de ventas del panel: tendencia diaria, productos más vendidos, zonas y estado de los pedidos. */
export function SalesCharts() {
  const { orders } = useStore();
  const [days, setDays] = useState<(typeof PERIODS)[number]>(30);
  const today = useMemo(() => new Date(), []);

  const summary = useMemo(() => summarize(orders, days, today), [orders, days, today]);
  const series = useMemo(() => salesByDay(orders, days, today), [orders, days, today]);
  const top = useMemo(() => topProducts(orders, days, today), [orders, days, today]);
  const zones = useMemo(() => salesByZone(orders, days, today), [orders, days, today]);
  const statuses = useMemo(() => ordersByStatus(orders, days, today), [orders, days, today]);
  const totalOrders = statuses.reduce((s, x) => s + x.count, 0);

  return (
    <section aria-labelledby="sales-title" className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="sales-title" className="font-serif text-[1.5rem] font-semibold">Cómo van las ventas</h2>
        <div role="group" aria-label="Período" className="flex gap-1.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              aria-pressed={days === p}
              onClick={() => setDays(p)}
              className={cn("h-9 rounded-full px-4 text-[13px] font-medium transition", days === p ? "bg-ink text-ivory" : "border border-line bg-white text-ink hover:border-rose/40")}
            >
              {p} días
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Vendido"
          value={formatPrice(summary.sold)}
          hint={summary.change === null ? "Sin ventas en el período anterior" : `${summary.change >= 0 ? "▲" : "▼"} ${Math.abs(summary.change)}% frente al período anterior`}
          tone={summary.change === null ? "default" : summary.change >= 0 ? "good" : "bad"}
        />
        <Kpi label="Pedidos vendidos" value={String(summary.soldCount)} hint="Confirmados, preparados, enviados o entregados" />
        <Kpi label="Ticket promedio" value={summary.soldCount ? formatPrice(summary.average) : "—"} hint="Valor promedio por pedido vendido" />
        <Kpi label="Por confirmar" value={formatPrice(summary.pendingValue)} hint={`${summary.pendingCount} pedido(s) pendiente(s)${summary.cancelledCount ? ` · ${summary.cancelledCount} cancelado(s)` : ""}`} tone={summary.pendingCount ? "warn" : "default"} />
      </div>

      <div className="rounded-2xl border border-line bg-white p-5">
        <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Ventas por día</h3>
        <BarChart series={series} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Rank title="Productos más vendidos" rows={top} unit="u." empty="Aún no hay ventas en este período." />
        <Rank title="Ventas por zona de envío" rows={zones} unit="ped." empty="Aún no hay ventas en este período." money />
        <div className="rounded-2xl border border-line bg-white p-5">
          <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">Pedidos por estado</h3>
          {totalOrders === 0 ? (
            <p className="mt-4 text-sm text-muted">Aún no hay pedidos en este período.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {statuses.map(({ status, count }) => (
                <li key={status}>
                  <div className="flex justify-between text-[13px]">
                    <span className="capitalize text-ink">{status}</span>
                    <span className="tabular-nums text-muted">{count}</span>
                  </div>
                  <div className="mt-1 h-2 overflow-hidden rounded-full bg-blush-soft">
                    <div className={cn("h-full rounded-full", statusBar[status])} style={{ width: `${(count / totalOrders) * 100}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

function Kpi({ label, value, hint, tone = "default" }: { label: string; value: string; hint: string; tone?: "default" | "good" | "bad" | "warn" }) {
  const hintColor = tone === "good" ? "text-success" : tone === "bad" ? "text-danger" : tone === "warn" ? "text-warning" : "text-muted";
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <p className="text-[13px] font-medium text-muted">{label}</p>
      <p className="mt-2 text-[1.9rem] font-semibold tabular-nums leading-none text-ink">{value}</p>
      <p className={cn("mt-2 text-[12px]", hintColor)}>{hint}</p>
    </div>
  );
}

function BarChart({ series }: { series: { date: string; total: number; count: number }[] }) {
  const W = 640;
  const H = 190;
  const base = H - 24;
  const max = Math.max(...series.map((p) => p.total), 0);
  const nice = max === 0 ? 100 : Math.ceil(max / 50) * 50;
  const slot = W / series.length;
  const bar = Math.max(2, slot * 0.7);
  const everyLabel = series.length <= 7 ? 1 : series.length <= 30 ? 5 : 15;
  const total = series.reduce((s, p) => s + p.total, 0);

  return (
    <div className="mt-3">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Ventas diarias de los últimos ${series.length} días. Total ${formatPrice(total)}.`} className="h-auto w-full">
        <line x1="0" x2={W} y1={base} y2={base} className="stroke-line" strokeWidth="1" />
        <line x1="0" x2={W} y1={base - (base - 14)} y2={base - (base - 14)} className="stroke-line" strokeWidth="1" strokeDasharray="3 4" />
        <text x="2" y="10" className="fill-muted" fontSize="10">{formatPrice(nice)}</text>
        {series.map((p, i) => {
          const h = nice ? (p.total / nice) * (base - 14) : 0;
          const x = i * slot + (slot - bar) / 2;
          return (
            <g key={p.date}>
              <rect x={x} y={base - h} width={bar} height={Math.max(h, p.total > 0 ? 2 : 0)} rx="2" className="fill-rose">
                <title>{`${shortDate(p.date)}: ${formatPrice(p.total)} · ${p.count} pedido(s)`}</title>
              </rect>
              {i % everyLabel === 0 && (
                <text x={Math.min(W - 16, Math.max(16, i * slot + slot / 2))} y={H - 6} textAnchor="middle" className="fill-muted" fontSize="10">{shortDate(p.date)}</text>
              )}
            </g>
          );
        })}
      </svg>
      {total === 0 && <p className="mt-2 text-sm text-muted">Todavía no hay ventas confirmadas en este período.</p>}
    </div>
  );
}

function Rank({ title, rows, unit, empty, money = false }: { title: string; rows: RankRow[]; unit: string; empty: string; money?: boolean }) {
  const max = Math.max(...rows.map((r) => (money ? r.revenue : r.units)), 1);
  return (
    <div className="rounded-2xl border border-line bg-white p-5">
      <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-muted">{empty}</p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((r) => (
            <li key={r.label}>
              <div className="flex items-baseline justify-between gap-3 text-[13px]">
                <span className="min-w-0 truncate text-ink" title={r.label}>{r.label}</span>
                <span className="shrink-0 tabular-nums text-muted">
                  {r.units} {unit} · {formatPrice(r.revenue)}
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-blush-soft">
                <div className="h-full rounded-full bg-rose" style={{ width: `${((money ? r.revenue : r.units) / max) * 100}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
