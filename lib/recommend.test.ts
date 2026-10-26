import assert from "node:assert/strict";
import { test } from "node:test";
import { recommend, type Answers } from "./recommend.ts";
import type { Product } from "../types/index.ts";

function product(over: Partial<Product> & { id: string }): Product {
  return {
    slug: over.id,
    name: over.id,
    description: "",
    categoryId: "pulseras",
    material: "",
    materialType: "Hilo tejido",
    price: 30,
    images: [],
    featured: false,
    active: true,
    variants: [{ sku: `${over.id}-A`, label: "Única", stock: 5 }],
    createdAt: "2026-01-01",
    ...over,
  };
}

const base: Answers = { recipient: "pareja", occasion: "aniversario", material: "cualquiera", budget: null, style: "cualquiera" };

test("no recomienda agotados ni ocultos", () => {
  const list = [
    product({ id: "ok" }),
    product({ id: "agotado", variants: [{ sku: "x", label: "u", stock: 0 }] }),
    product({ id: "oculto", active: false }),
  ];
  const ids = recommend(list, base).results.map((r) => r.product.id);
  assert.deepEqual(ids, ["ok"]);
});

test("respeta presupuesto y material", () => {
  const list = [
    product({ id: "barato", price: 25 }),
    product({ id: "caro", price: 60 }),
    product({ id: "cuentas", price: 25, materialType: "Cuentas" }),
  ];
  const ids = recommend(list, { ...base, budget: 40, material: "Hilo tejido" }).results.map((r) => r.product.id);
  assert.deepEqual(ids, ["barato"]);
});

test("sube los temas afines y los sets para parejas", () => {
  const list = [
    product({ id: "neutro" }),
    product({ id: "amor", themeIds: ["amor"] }),
    product({ id: "set", categoryId: "sets" }),
  ];
  const ids = recommend(list, base).results.map((r) => r.product.id);
  assert.equal(ids[0], "amor");
  assert.ok(ids.indexOf("set") < ids.indexOf("neutro"));
});

test("devuelve como máximo 6 y explica sus razones solo con hechos", () => {
  const list = Array.from({ length: 9 }, (_, i) => product({ id: `p${i}`, price: 20 + i }));
  const res = recommend(list, { ...base, budget: 100 });
  assert.equal(res.results.length, 6);
  assert.ok(res.results[0].reasons.every((r) => typeof r === "string" && r.length > 0));
  assert.ok(!res.results[0].reasons.some((r) => r.startsWith("Estilo")));
});

test("sin coincidencias ofrece ampliar filtros con cifras reales", () => {
  const list = [product({ id: "a", price: 80 }), product({ id: "b", price: 90, materialType: "Cuentas" })];
  const res = recommend(list, { ...base, budget: 30, material: "Hilo tejido" });
  assert.equal(res.results.length, 0);
  assert.equal(res.relax?.withoutBudget, 1);
  assert.equal(res.relax?.withoutMaterial, 0);
  assert.equal(res.relax?.withoutBoth, 2);
});
