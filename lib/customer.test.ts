import assert from "node:assert/strict";
import { test } from "node:test";
import { isCustomerValid, normalizePhone, validateCustomer } from "./customer.ts";

const ok = { name: "Ana Pérez", phone: "987 654 321", district: "Miraflores, Lima", address: "" };

test("normaliza el celular con espacios y prefijo +51", () => {
  assert.equal(normalizePhone("987 654 321"), "987654321");
  assert.equal(normalizePhone("+51 987-654-321"), "987654321");
});

test("acepta datos completos", () => {
  assert.equal(isCustomerValid(ok), true);
});

test("rechaza celular incorrecto", () => {
  assert.match(validateCustomer({ ...ok, phone: "12345" }).phone ?? "", /9 dígitos/);
  assert.match(validateCustomer({ ...ok, phone: "887654321" }).phone ?? "", /empiece con 9/);
});

test("exige nombre y distrito", () => {
  const e = validateCustomer({ ...ok, name: " ", district: "" });
  assert.ok(e.name && e.district);
});

test("limita la dirección", () => {
  assert.ok(validateCustomer({ ...ok, address: "a".repeat(161) }).address);
});
