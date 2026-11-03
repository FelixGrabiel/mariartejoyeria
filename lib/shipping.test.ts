import assert from "node:assert/strict";
import { test } from "node:test";
import { missingForFreeShipping, shippingQuote } from "./shipping.ts";

const zone = { id: "lima", name: "Lima", price: 10, freeFrom: 150, eta: "", pickup: false, active: true, sortOrder: 1 };

test("sin zona elegida el costo queda por confirmar", () => {
  assert.deepEqual(shippingQuote(undefined, 100), { cost: null, free: false });
});

test("la zona cobra su tarifa bajo el umbral y es gratis desde el umbral", () => {
  assert.deepEqual(shippingQuote(zone, 149.99), { cost: 10, free: false });
  assert.deepEqual(shippingQuote(zone, 150), { cost: 0, free: true });
});

test("una zona por confirmar no calcula costo ni envío gratis", () => {
  const prov = { ...zone, price: null, freeFrom: null };
  assert.deepEqual(shippingQuote(prov, 500), { cost: null, free: false });
});

test("una zona sin umbral siempre cobra su tarifa; el recojo a 0 no cobra", () => {
  assert.deepEqual(shippingQuote({ ...zone, freeFrom: null }, 9999), { cost: 10, free: false });
  assert.deepEqual(shippingQuote({ ...zone, price: 0, freeFrom: null, pickup: true }, 20), { cost: 0, free: false });
});

test("cuánto falta para el envío gratis", () => {
  assert.equal(missingForFreeShipping(zone, 100), 50);
  assert.equal(missingForFreeShipping(zone, 150), 0);
  assert.equal(missingForFreeShipping({ ...zone, freeFrom: null }, 10), 0);
  assert.equal(missingForFreeShipping(undefined, 10), 0);
});
