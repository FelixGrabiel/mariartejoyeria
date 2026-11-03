import assert from "node:assert/strict";
import { test } from "node:test";
import { buildCartLines, buildComboLines, cartSubtotalOf, unitsInCartFor } from "./cart-lines.ts";
import type { Combo, Product } from "../types/index.ts";

const product = (id: string, price: number, stock: number, over: Partial<Product> = {}): Product =>
  ({
    id, slug: id, name: `Joya ${id}`, description: "", categoryId: "pulseras", material: "", materialType: "plata", price,
    images: [], featured: false, active: true, createdAt: "2026-01-01",
    variants: [{ sku: `${id}-U`, label: "Única", stock }], ...over,
  }) as Product;

const products = [product("a", 100, 3), product("b", 50, 5)];
const duo: Combo = {
  id: "duo", name: "Dúo", description: "", discountPercent: 10, active: true, maxPerOrder: 2, sortOrder: 1,
  items: [{ productId: "a", sku: "a-U", quantity: 1 }, { productId: "b", sku: "b-U", quantity: 1 }],
};

test("las unidades del carrito suman productos sueltos y componentes de combos", () => {
  const cart = [{ productId: "a", sku: "a-U", quantity: 2 }];
  const comboCart = [{ comboId: "duo", picks: [], quantity: 1 }];
  assert.equal(unitsInCartFor(cart, comboCart, [duo], "a-U"), 3);
  assert.equal(unitsInCartFor(cart, comboCart, [duo], "a-U", 0), 2);
  assert.equal(unitsInCartFor(cart, comboCart, [duo], "b-U"), 1);
});

test("una línea suelta calcula su total y avisa si se pasa del stock", () => {
  const cart = [{ productId: "a", sku: "a-U", quantity: 2 }];
  const ok = buildCartLines(cart, products, [], true, () => 2);
  assert.equal(ok[0].lineTotal, 200);
  assert.equal(ok[0].issue, undefined);
  const over = buildCartLines(cart, products, [], true, () => 4);
  assert.match(over[0].issue ?? "", /Solo quedan 3/);
});

test("un producto inactivo o agotado queda con aviso", () => {
  const cart = [{ productId: "a", sku: "a-U", quantity: 1 }];
  assert.match(buildCartLines(cart, [product("a", 100, 3, { active: false })], [], true, () => 1)[0].issue ?? "", /ya no está disponible/);
  assert.match(buildCartLines(cart, [product("a", 100, 0)], [], true, () => 1)[0].issue ?? "", /se agotó/);
});

test("el empaque se suma por unidad y uno desactivado bloquea la línea", () => {
  const gift = { occasion: "Cumpleaños", packagingId: "caja", dedication: "", meaningCard: false };
  const cart = [{ productId: "a", sku: "a-U", quantity: 2, gift }];
  const gifted = [{ ...products[0], giftEnabled: true }, products[1]];
  const withPack = buildCartLines(cart, gifted, [{ id: "caja", name: "Caja", description: "", price: 5.5, active: true, sortOrder: 1 }], true, () => 2);
  assert.equal(withPack[0].lineTotal, 211);
  const noPack = buildCartLines(cart, gifted, [{ id: "caja", name: "Caja", description: "", price: 5.5, active: false, sortOrder: 1 }], true, () => 2);
  assert.match(noPack[0].issue ?? "", /empaque elegido/);
});

test("un combo aplica el descuento por componente y el subtotal lo suma", () => {
  const comboCart = [{ comboId: "duo", picks: [], quantity: 1 }];
  const lines = buildComboLines(comboCart, [duo], products, true, () => 1);
  assert.equal(lines[0].total, 135);
  assert.equal(lines[0].savings, 15);
  const cartLines = buildCartLines([{ productId: "b", sku: "b-U", quantity: 1 }], products, [], true, () => 1);
  assert.equal(cartSubtotalOf(cartLines, lines), 185);
});

test("un combo que ya no existe muestra aviso, pero solo cuando la configuración ya cargó", () => {
  const comboCart = [{ comboId: "fantasma", picks: [], quantity: 1 }];
  assert.equal(buildComboLines(comboCart, [duo], products, false, () => 0).length, 0);
  assert.match(buildComboLines(comboCart, [duo], products, true, () => 0)[0].issue ?? "", /ya no está disponible/);
});

test("las líneas con aviso no entran al subtotal", () => {
  const cart = [{ productId: "a", sku: "a-U", quantity: 5 }];
  const lines = buildCartLines(cart, products, [], true, () => 5);
  assert.equal(cartSubtotalOf(lines, []), 0);
});
