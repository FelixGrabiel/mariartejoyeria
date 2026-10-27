import assert from "node:assert/strict";
import { test } from "node:test";
import { availabilityOf, detectIntent, productQuery, staticAnswer } from "./bot.ts";

test("detecta las intenciones principales (con tildes, mayúsculas y signos)", () => {
  assert.equal(detectIntent("¿Hacen ENVÍOS a provincia?"), "envios");
  assert.equal(detectIntent("Aceptan yape o plin?"), "pagos");
  assert.equal(detectIntent("Quiero saber el estado de mi pedido"), "pedido");
  assert.equal(detectIntent("hay stock de la pulsera de ojo turco"), "stock");
  assert.equal(detectIntent("quiero hablar con una persona"), "humano");
  assert.equal(detectIntent("buenas tardes"), "saludo");
  assert.equal(detectIntent("muchas gracias"), "gracias");
  assert.equal(detectIntent("cuánto cuesta el san benito"), "precio");
  assert.equal(detectIntent("quiero un regalo con dedicatoria"), "regalo");
  assert.equal(detectIntent("como compro"), "comprar");
});

test("lo que no entiende queda como desconocido (y no inventa)", () => {
  assert.equal(detectIntent("qwerty asdf"), "desconocido");
  assert.equal(detectIntent("   "), "desconocido");
  assert.equal(staticAnswer("desconocido", { whatsappUrl: "x" }), null);
});

test("una palabra suelta no se confunde con otra («hay» no está dentro de «Chayanne»)", () => {
  assert.notEqual(detectIntent("chayanne"), "stock");
});

test("extrae el nombre del producto de una frase", () => {
  assert.equal(productQuery("¿Hay stock de la pulsera de ojo turco?"), "ojo turco");
  assert.equal(productQuery("tienen san benito disponible"), "san benito");
});

test("las respuestas fijas no prometen plazos ni fechas", () => {
  const f = { whatsappUrl: "https://wa.me/51" };
  for (const i of ["envios", "pagos", "cambios", "horario"] as const) {
    const a = staticAnswer(i, f) ?? "";
    assert.ok(!/\b\d+ (dias|días|horas)\b/i.test(a), `${i} menciona un plazo concreto`);
  }
  assert.ok(staticAnswer("humano", f)?.includes("https://wa.me/51"));
});

test("disponibilidad en palabras", () => {
  assert.equal(availabilityOf([0, 0]), "agotado");
  assert.equal(availabilityOf([1, 1]), "pocas");
  assert.equal(availabilityOf([0, 5]), "disponible");
});
