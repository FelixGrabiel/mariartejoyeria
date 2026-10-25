import assert from "node:assert/strict";
import { test } from "node:test";
import { cleanDedication, dedicationError, giftKey, sameLine, unitsForSku } from "./gift.ts";

const gift = { occasion: "Cumpleaños", packagingId: "caja", dedication: "Feliz día", meaningCard: true };

test("una joya con regalo no se mezcla con la misma sin regalo", () => {
  const plain = { productId: "p-1", sku: "A", quantity: 1 };
  assert.equal(sameLine(plain, { ...plain, gift }), false);
  assert.equal(sameLine({ ...plain, gift }, { ...plain, gift: { ...gift } }), true);
});

test("cambiar la dedicatoria o el empaque crea otra línea", () => {
  const base = { productId: "p-1", sku: "A", gift };
  assert.equal(sameLine(base, { ...base, gift: { ...gift, dedication: "Otra" } }), false);
  assert.equal(sameLine(base, { ...base, gift: { ...gift, packagingId: "bolsita" } }), false);
});

test("giftKey ignora espacios en los extremos", () => {
  assert.equal(giftKey({ ...gift, dedication: "  Feliz día " }), giftKey(gift));
  assert.equal(giftKey(undefined), "");
});

test("la dedicatoria respeta el límite configurado", () => {
  assert.equal(dedicationError("a".repeat(150), 150), null);
  assert.match(dedicationError("a".repeat(151), 150) ?? "", /150/);
  assert.equal(cleanDedication("  hola  ", 3), "hol");
});

test("las unidades de un SKU suman todas las líneas", () => {
  const items = [
    { sku: "A", quantity: 2 },
    { sku: "A", quantity: 1 },
    { sku: "B", quantity: 5 },
  ];
  assert.equal(unitsForSku(items, "A"), 3);
  assert.equal(unitsForSku(items, "Z"), 0);
});
