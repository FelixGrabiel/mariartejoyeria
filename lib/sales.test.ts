import assert from "node:assert/strict";
import { test } from "node:test";
import { lastDays, orderValue, ordersByStatus, salesByDay, salesByZone, summarize, topProducts } from "./sales.ts";
import type { Order } from "../types/index.ts";

const today = new Date("2026-11-10T15:00:00Z");
const order = (over: Partial<Order> & { day: string; price?: number; qty?: number; name?: string }): Order => {
  const { day, price = 100, qty = 1, name = "Joya", ...rest } = over;
  return {
    id: day + name, code: "MA-1", customerName: "Ana", district: "Lima", channel: "WhatsApp", createdAt: day, status: "confirmado",
    items: [{ productId: "p", productName: name, variantLabel: "U", quantity: qty, unitPrice: price }], ...rest,
  } as Order;
};

test("lastDays devuelve los últimos días terminando hoy", () => {
  assert.deepEqual(lastDays(3, today), ["2026-11-08", "2026-11-09", "2026-11-10"]);
});

test("el valor del pedido suma productos, empaque y envío", () => {
  const o = order({ day: "2026-11-10", qty: 2, price: 50, shippingCost: 10 });
  o.items[0].packagingPrice = 5;
  assert.equal(orderValue(o), 120);
});

test("las ventas por día solo cuentan pedidos vendidos (no pendientes ni cancelados)", () => {
  const orders = [
    order({ day: "2026-11-10" }),
    order({ day: "2026-11-10", status: "pendiente" }),
    order({ day: "2026-11-10", status: "cancelado" }),
    order({ day: "2026-11-09", status: "entregado", price: 40 }),
  ];
  const pts = salesByDay(orders, 3, today);
  assert.deepEqual(pts.map((p) => p.total), [0, 40, 100]);
  assert.deepEqual(pts.map((p) => p.count), [0, 1, 1]);
});

test("el resumen calcula total, ticket promedio, pendientes y variación", () => {
  const orders = [
    order({ day: "2026-11-10", price: 100 }),
    order({ day: "2026-11-09", price: 50, shippingCost: 10 }),
    order({ day: "2026-11-09", status: "pendiente", price: 30 }),
    order({ day: "2026-11-08", status: "cancelado" }),
    order({ day: "2026-11-05", price: 80 }), // período anterior (3 días antes: 11-05..11-07)
  ];
  const s = summarize(orders, 3, today);
  assert.equal(s.sold, 160);
  assert.equal(s.soldCount, 2);
  assert.equal(s.average, 80);
  assert.equal(s.pendingValue, 30);
  assert.equal(s.cancelledCount, 1);
  assert.equal(s.change, 100);
});

test("sin ventas en el período anterior no hay variación", () => {
  assert.equal(summarize([order({ day: "2026-11-10" })], 3, today).change, null);
});

test("el ranking de productos ordena por unidades", () => {
  const orders = [
    order({ day: "2026-11-10", name: "A", qty: 1 }),
    order({ day: "2026-11-09", name: "B", qty: 3, price: 10 }),
    order({ day: "2026-11-09", name: "A", qty: 1, status: "cancelado" }),
  ];
  const top = topProducts(orders, 3, today);
  assert.deepEqual(top.map((r) => [r.label, r.units]), [["B", 3], ["A", 1]]);
});

test("ventas por zona y pedidos por estado", () => {
  const orders = [
    order({ day: "2026-11-10", shippingZone: "Lima", price: 100 }),
    order({ day: "2026-11-10", price: 20 }),
    order({ day: "2026-11-10", status: "pendiente" }),
  ];
  assert.deepEqual(salesByZone(orders, 3, today).map((r) => r.label), ["Lima", "Sin zona"]);
  const st = ordersByStatus(orders, 3, today);
  assert.equal(st.find((s) => s.status === "confirmado")?.count, 2);
  assert.equal(st.find((s) => s.status === "pendiente")?.count, 1);
});
