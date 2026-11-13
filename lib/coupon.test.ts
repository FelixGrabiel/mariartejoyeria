import assert from "node:assert/strict";
import { test } from "node:test";
import { couponDiscount, couponStatus, isValidCouponCode, normalizeCouponCode, type Coupon } from "./coupon.ts";

const base: Coupon = { code: "HOLA10", kind: "percent", value: 10, minSubtotal: 0, uses: 0, active: true, note: "" };

test("porcentaje y monto fijo, con redondeo a céntimos", () => {
  assert.equal(couponDiscount("percent", 10, 89.9), 8.99);
  assert.equal(couponDiscount("percent", 15, 33.33), 5);
  assert.equal(couponDiscount("amount", 20, 89.9), 20);
});

test("el descuento nunca supera el subtotal ni es negativo", () => {
  assert.equal(couponDiscount("amount", 50, 30), 30);
  assert.equal(couponDiscount("percent", 100, 30), 30);
  assert.equal(couponDiscount("amount", 10, 0), 0);
});

test("normaliza y valida el código", () => {
  assert.equal(normalizeCouponCode("  bienvenida 10 "), "BIENVENIDA10");
  assert.equal(isValidCouponCode("BIENVENIDA10"), true);
  assert.equal(isValidCouponCode("ab"), false);
  assert.equal(isValidCouponCode("CON ESPACIO"), false);
});

test("estado del cupón según fechas, usos y pausa", () => {
  const now = new Date("2026-11-15T12:00:00Z");
  assert.equal(couponStatus(base, now), "activo");
  assert.equal(couponStatus({ ...base, active: false }, now), "pausado");
  assert.equal(couponStatus({ ...base, maxUses: 5, uses: 5 }, now), "agotado");
  assert.equal(couponStatus({ ...base, endsAt: "2026-11-01T00:00:00Z" }, now), "vencido");
  assert.equal(couponStatus({ ...base, startsAt: "2026-12-01T00:00:00Z" }, now), "programado");
});
