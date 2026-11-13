/**
 * Indicadores de ventas a partir de los pedidos. Lógica pura (sin React) para probarla con `npm test`.
 * «Vendido» = pedido confirmado, preparado, enviado o entregado. Los pendientes se muestran aparte y los cancelados no cuentan.
 */
import type { Order, OrderStatus } from "../types/index.ts";

export const SOLD_STATUSES: OrderStatus[] = ["confirmado", "preparado", "enviado", "entregado"];
export const isSold = (s: OrderStatus): boolean => SOLD_STATUSES.includes(s);

export const itemsValue = (o: Order): number => o.items.reduce((sum, i) => sum + i.quantity * (i.unitPrice + (i.packagingPrice ?? 0)), 0);
export const orderValue = (o: Order): number => Math.round((itemsValue(o) - (o.discountAmount ?? 0) + (o.shippingCost ?? 0)) * 100) / 100;

const DAY = 86_400_000;
const dayKey = (d: Date): string => d.toISOString().slice(0, 10);
const orderDay = (o: Order): string => o.createdAt.slice(0, 10);

/** Fechas (YYYY-MM-DD) de los últimos `days` días, terminando en `today`. */
export function lastDays(days: number, today: Date): string[] {
  const end = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
  return Array.from({ length: days }, (_, i) => dayKey(new Date(end - (days - 1 - i) * DAY)));
}

export interface DayPoint {
  date: string;
  total: number;
  count: number;
}

export function salesByDay(orders: Order[], days: number, today: Date): DayPoint[] {
  const points = new Map(lastDays(days, today).map((date) => [date, { date, total: 0, count: 0 }]));
  for (const o of orders) {
    if (!isSold(o.status)) continue;
    const p = points.get(orderDay(o));
    if (p) {
      p.total = Math.round((p.total + orderValue(o)) * 100) / 100;
      p.count += 1;
    }
  }
  return [...points.values()];
}

export interface SalesSummary {
  sold: number;
  soldCount: number;
  average: number;
  pendingValue: number;
  pendingCount: number;
  cancelledCount: number;
  /** Variación del total vendido frente al período anterior de igual duración (null si antes no hubo ventas). */
  change: number | null;
}

function inRange(o: Order, from: string, to: string): boolean {
  const d = orderDay(o);
  return d >= from && d <= to;
}

export function summarize(orders: Order[], days: number, today: Date): SalesSummary {
  const cur = lastDays(days, today);
  const from = cur[0];
  const to = cur[cur.length - 1];
  const prevEnd = dayKey(new Date(Date.parse(from) - DAY));
  const prevStart = dayKey(new Date(Date.parse(from) - days * DAY));
  const inPeriod = orders.filter((o) => inRange(o, from, to));
  const sold = inPeriod.filter((o) => isSold(o.status));
  const pending = inPeriod.filter((o) => o.status === "pendiente");
  const soldTotal = sold.reduce((s, o) => s + orderValue(o), 0);
  const prevTotal = orders.filter((o) => isSold(o.status) && inRange(o, prevStart, prevEnd)).reduce((s, o) => s + orderValue(o), 0);
  return {
    sold: Math.round(soldTotal * 100) / 100,
    soldCount: sold.length,
    average: sold.length ? Math.round((soldTotal / sold.length) * 100) / 100 : 0,
    pendingValue: Math.round(pending.reduce((s, o) => s + orderValue(o), 0) * 100) / 100,
    pendingCount: pending.length,
    cancelledCount: inPeriod.filter((o) => o.status === "cancelado").length,
    change: prevTotal > 0 ? Math.round(((soldTotal - prevTotal) / prevTotal) * 1000) / 10 : null,
  };
}

export interface RankRow {
  label: string;
  units: number;
  revenue: number;
}

/** Productos más vendidos del período (por unidades; empata por ingresos). */
export function topProducts(orders: Order[], days: number, today: Date, limit = 5): RankRow[] {
  const cur = lastDays(days, today);
  const rows = new Map<string, RankRow>();
  for (const o of orders) {
    if (!isSold(o.status) || !inRange(o, cur[0], cur[cur.length - 1])) continue;
    for (const i of o.items) {
      const r = rows.get(i.productName) ?? { label: i.productName, units: 0, revenue: 0 };
      r.units += i.quantity;
      r.revenue = Math.round((r.revenue + i.quantity * (i.unitPrice + (i.packagingPrice ?? 0))) * 100) / 100;
      rows.set(i.productName, r);
    }
  }
  return [...rows.values()].sort((a, b) => b.units - a.units || b.revenue - a.revenue).slice(0, limit);
}

/** Ventas por zona de envío (los pedidos sin zona van como «Sin zona»). */
export function salesByZone(orders: Order[], days: number, today: Date, limit = 6): RankRow[] {
  const cur = lastDays(days, today);
  const rows = new Map<string, RankRow>();
  for (const o of orders) {
    if (!isSold(o.status) || !inRange(o, cur[0], cur[cur.length - 1])) continue;
    const label = o.shippingZone || "Sin zona";
    const r = rows.get(label) ?? { label, units: 0, revenue: 0 };
    r.units += 1;
    r.revenue = Math.round((r.revenue + orderValue(o)) * 100) / 100;
    rows.set(label, r);
  }
  return [...rows.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

/** Cantidad de pedidos por estado en el período (embudo). */
export function ordersByStatus(orders: Order[], days: number, today: Date): { status: OrderStatus; count: number }[] {
  const cur = lastDays(days, today);
  const order: OrderStatus[] = ["pendiente", "confirmado", "preparado", "enviado", "entregado", "cancelado"];
  return order.map((status) => ({
    status,
    count: orders.filter((o) => o.status === status && inRange(o, cur[0], cur[cur.length - 1])).length,
  }));
}
