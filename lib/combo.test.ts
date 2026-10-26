import assert from "node:assert/strict";
import { test } from "node:test";
import { comboTotals, discountedPrice, isComboLive } from "./combo.ts";

test("0 % no cambia el precio", () => {
  assert.equal(discountedPrice(32.9, 0), 32.9);
});

test("el descuento se aplica por componente y se redondea al céntimo (igual que en SQL)", () => {
  assert.equal(discountedPrice(32.9, 10), 29.61);
  assert.equal(discountedPrice(34.9, 10), 31.41);
  assert.equal(discountedPrice(29.9, 15), 25.42);
});

test("totales y ahorro de un combo", () => {
  const t = comboTotals(
    [
      { price: 32.9, quantity: 1 },
      { price: 34.9, quantity: 1 },
    ],
    10,
  );
  assert.equal(t.regular, 67.8);
  assert.equal(t.total, 61.02);
  assert.equal(t.savings, 6.78);
});

test("sin promoción no hay ahorro", () => {
  const t = comboTotals([{ price: 10, quantity: 2 }], 0);
  assert.equal(t.savings, 0);
  assert.equal(t.total, 20);
});

test("vigencia: pausado, futuro, vencido y vigente", () => {
  const now = new Date("2026-10-26T12:00:00Z");
  assert.equal(isComboLive({ active: false }, now), false);
  assert.equal(isComboLive({ active: true, startsAt: "2026-11-01T00:00:00Z" }, now), false);
  assert.equal(isComboLive({ active: true, endsAt: "2026-10-25T00:00:00Z" }, now), false);
  assert.equal(isComboLive({ active: true, startsAt: "2026-10-01T00:00:00Z", endsAt: "2026-12-01T00:00:00Z" }, now), true);
  assert.equal(isComboLive({ active: true }, now), true);
});
