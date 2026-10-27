import assert from "node:assert/strict";
import { test } from "node:test";
import { emptyFilters, filterProducts, lowStockVariants, sortProducts } from "./catalog.ts";
import type { Product } from "../types/index.ts";

function product(over: Partial<Product> & { id: string }): Product {
  return {
    slug: over.id, name: over.id, description: "", categoryId: "pulseras", material: "Hilo rojo", materialType: "Hilo tejido",
    price: 30, images: [], featured: false, active: true, variants: [{ sku: `${over.id}-A`, label: "Única", stock: 5 }], createdAt: "2026-01-01", ...over,
  };
}
const names = { pulseras: "Pulseras", sets: "Sets", collares: "Collares" };
const ids = (list: Product[]) => list.map((p) => p.id);

test("buscar «ojo» no encuentra «Rojo» pero sí «ojo turco»", () => {
  const list = [
    product({ id: "ojo", name: "Pulsera ojo turco" }),
    product({ id: "rojo", name: "San Benito", variants: [{ sku: "R", label: "Rojo", stock: 3 }] }),
  ];
  assert.deepEqual(ids(filterProducts(list, { ...emptyFilters, query: "ojo" }, names)), ["ojo"]);
});

test("la búsqueda ignora tildes y mayúsculas, y acepta palabras a medio escribir", () => {
  const list = [product({ id: "a", name: "Trébol árbol de la vida" })];
  assert.equal(filterProducts(list, { ...emptyFilters, query: "TREBOL arb" }, names).length, 1);
  assert.equal(filterProducts(list, { ...emptyFilters, query: "vid" }, names).length, 1);
});

test("busca también por categoría y por material", () => {
  const list = [product({ id: "a", categoryId: "sets", material: "Hilo negro" })];
  assert.equal(filterProducts(list, { ...emptyFilters, query: "sets" }, names).length, 1);
  assert.equal(filterProducts(list, { ...emptyFilters, query: "negro" }, names).length, 1);
  assert.equal(filterProducts(list, { ...emptyFilters, query: "plata" }, names).length, 0);
});

test("todas las palabras deben coincidir", () => {
  const list = [product({ id: "a", name: "Pulsera ojo turco" })];
  assert.equal(filterProducts(list, { ...emptyFilters, query: "pulsera turco" }, names).length, 1);
  assert.equal(filterProducts(list, { ...emptyFilters, query: "pulsera collar" }, names).length, 0);
});

test("filtros de precio, disponibilidad y tema", () => {
  const list = [
    product({ id: "barato", price: 30, themeIds: ["amor"] }),
    product({ id: "caro", price: 90 }),
    product({ id: "agotado", price: 30, variants: [{ sku: "x", label: "u", stock: 0 }] }),
  ];
  assert.deepEqual(ids(filterProducts(list, { ...emptyFilters, price: "hasta-35" }, names)), ["barato", "agotado"]);
  assert.deepEqual(ids(filterProducts(list, { ...emptyFilters, onlyAvailable: true }, names)), ["barato", "caro"]);
  assert.deepEqual(ids(filterProducts(list, { ...emptyFilters, themes: ["amor"] }, names)), ["barato"]);
});

test("ordenar por precio es estrictamente por precio y «destacados» deja los agotados al final", () => {
  const list = [
    product({ id: "agotado", featured: true, variants: [{ sku: "x", label: "u", stock: 0 }] }),
    product({ id: "b", price: 50 }),
    product({ id: "a", price: 20, featured: true }),
  ];
  assert.deepEqual(ids(sortProducts(list, "precio-asc")), ["a", "agotado", "b"]);
  assert.deepEqual(ids(sortProducts(list, "precio-desc")), ["b", "agotado", "a"]);
  assert.equal(ids(sortProducts(list, "destacados"))[0], "a");
  assert.equal(ids(sortProducts(list, "destacados")).at(-1), "agotado");
});

test("alerta de stock bajo usa el mínimo de cada variante", () => {
  const list = [product({ id: "p", variants: [{ sku: "A", label: "x", stock: 4, minStock: 5 }, { sku: "B", label: "y", stock: 4 }] })];
  assert.deepEqual(lowStockVariants(list).map((r) => r.variant.sku), ["A"]);
});
