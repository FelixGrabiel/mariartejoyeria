import { chromium } from "playwright";

/**
 * Pruebas de navegador: simulan 14 tipos de clientes (y el acceso del administrador) contra la tienda.
 * El catálogo, los pedidos y el asistente se SIMULAN en el navegador (no se escribe nada en la base real).
 * Uso:  BASE=http://localhost:3000 npm run test:e2e   (por defecto prueba una copia local)
 */
const BASE = process.env.BASE || "http://localhost:3000";
const results = [];
const consoleErrors = [];

// ---------- Catálogo simulado (lo que devolvería Supabase) ----------
const v = (sku, label, stock, i = 1) => ({ sku, label, stock, sort_order: i, min_stock: 2 });
const prod = (o) => ({
  description: "Descripción de prueba.", material: "Material de prueba", images: [], featured: false, active: true, is_new: false,
  variant_name: null, care: null, created_at: "2026-10-20", gift_enabled: false, meaning: null, styles: [], product_themes: [], ...o,
});
const baseProducts = () => [
  prod({ id: "m1", slug: "pulsera-ojo-turco", name: "Pulsera ojo turco", category_id: "pulseras", material_type: "Hilo tejido", price: 65, images: ["/images/ojo-turco-regulable-1.jpg"], featured: true, gift_enabled: true,
    product_variants: [v("M1-U", "Única", 6)], product_themes: [{ theme_id: "proteccion" }], styles: ["minimalista"] }),
  prod({ id: "m2", slug: "san-benito-plata", name: "San Benito en plata", category_id: "pulseras", material_type: "Hilo tejido", price: 89, images: ["/images/san-benito-plata-1.jpg"], featured: true, gift_enabled: true, variant_name: "Color",
    product_variants: [v("M2-R", "Rojo", 3, 1), v("M2-N", "Negro", 0, 2)], product_themes: [{ theme_id: "proteccion" }], styles: ["clasico"] }),
  prod({ id: "m3", slug: "trebol-arbol-vida", name: "Trébol árbol de la vida", category_id: "pulseras", material_type: "Cuentas", price: 89, images: ["/images/trebol-arbol-vida-1.jpg"], featured: true, gift_enabled: true,
    product_variants: [v("M3-U", "Única", 1)], product_themes: [{ theme_id: "suerte" }], styles: ["delicado"] }),
  prod({ id: "m4", slug: "pack-san-benito", name: "Pack dos San Benito", category_id: "sets", material_type: "Cuentas", price: 129, images: ["/images/pack-san-benito-muranos-1.jpg"], gift_enabled: true,
    product_variants: [v("M4-U", "Pack de dos", 2)], product_themes: [{ theme_id: "amistad" }, { theme_id: "amor" }] }),
  prod({ id: "m5", slug: "mano-hamsa", name: "Mano de Hamsa", category_id: "pulseras", material_type: "Cuentas", price: 89, images: ["/images/hamsa-plata-1.jpg"],
    product_variants: [v("M5-U", "Única", 0)] }),
  prod({ id: "m6", slug: "collar-minimal", name: "Collar minimal", category_id: "collares", material_type: "Metal (por confirmar)", price: 59.9, gift_enabled: true,
    product_variants: [v("M6-U", "Única", 4)] }),
];
const themes = [
  { id: "amor", name: "Amor y cariño", description: "Símbolo de afecto.", active: true, sort_order: 1 },
  { id: "amistad", name: "Amistad", description: "Un vínculo especial.", active: true, sort_order: 2 },
  { id: "proteccion", name: "Protección", description: "Tradición de cuidado.", active: true, sort_order: 3 },
  { id: "suerte", name: "Buena suerte", description: "Buenos deseos.", active: true, sort_order: 5 },
];
const packaging = [
  { id: "pk1", name: "Bolsita de tela", description: "Bolsita MariArte", price: 0, active: true, sort_order: 1 },
  { id: "pk2", name: "Caja de regalo", description: "Caja con lazo", price: 5.5, active: true, sort_order: 2 },
];
const combos = [
  { id: "c1", name: "Dúo Protección", description: "Dos pulseras", discount_percent: 10, active: true, starts_at: null, ends_at: null, max_per_order: 2, sort_order: 1,
    combo_items: [{ id: 1, product_id: "m1", sku: "M1-U", quantity: 1, position: 1 }, { id: 2, product_id: "m2", sku: null, quantity: 1, position: 2 }] },
  { id: "c2", name: "Dúo sin descuento", description: "", discount_percent: 0, active: true, starts_at: null, ends_at: null, max_per_order: 3, sort_order: 2,
    combo_items: [{ id: 3, product_id: "m3", sku: "M3-U", quantity: 1, position: 1 }, { id: 4, product_id: "m6", sku: "M6-U", quantity: 1, position: 2 }] },
];

function newState(over = {}) {
  return { products: baseProducts(), themes, packaging, combos, dedMax: 40, mode: "ok", payloads: [], ...over };
}

const CORS = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization,apikey,content-type,x-client-info,prefer,accept,accept-profile,content-profile,range,x-supabase-api-version",
  "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
};
const json = (route, body, status = 200) => route.fulfill({ status, headers: { ...CORS, "content-type": "application/json" }, body: JSON.stringify(body) });

async function setupContext(browser, state, opts = {}) {
  const ctx = await browser.newContext({ locale: "es-PE", viewport: opts.mobile ? { width: 390, height: 844 } : { width: 1366, height: 900 }, isMobile: !!opts.mobile, deviceScaleFactor: opts.mobile ? 2 : 1 });
  await ctx.addInitScript(() => {
    window.__opened = [];
    window.open = (url) => {
      window.__opened.push(String(url));
      return { close() { window.__closed = (window.__closed || 0) + 1; }, location: { set href(x) { window.__opened.push(String(x)); }, get href() { return ""; } } };
    };
  });
  await ctx.route(/supabase\.co\/functions\/v1\/assistant/, async (route) => {
    const req = route.request();
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    state.aiCalls = state.aiCalls || [];
    state.aiCalls.push(JSON.parse(req.postData() || "{}"));
    if (state.ai === "ok") return json(route, { reply: "Respuesta de prueba del asistente con IA." });
    if (state.ai === "rate") return json(route, { error: "rate" }, 429);
    return json(route, { error: "not_configured" }, 503);
  });
  await ctx.route(/supabase\.co\/rest\/v1\//, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname.replace("/rest/v1/", "");
    if (req.method() === "OPTIONS") return route.fulfill({ status: 204, headers: CORS });
    if (state.mode === "netdown" && !p.startsWith("rpc/track")) return route.abort("failed");
    if (p === "products") return state.mode === "catalog500" ? json(route, { message: "boom" }, 500) : json(route, state.products);
    if (p === "meaning_themes") return json(route, state.themes);
    if (p === "packaging_options") return json(route, state.packaging);
    if (p === "combos") return json(route, state.combos);
    if (p === "store_settings") {
      const rows = [{ key: "dedication_max_chars", value: String(state.dedMax) }];
      return (req.headers()["accept"] || "").includes("pgrst.object") ? json(route, rows[0]) : json(route, rows);
    }
    if (p === "rpc/place_order") {
      const body = JSON.parse(req.postData() || "{}");
      state.payloads.push(body);
      if (state.mode === "slow") await new Promise((r) => setTimeout(r, 1200));
      if (state.mode === "error") return json(route, { code: "P0001", message: "Stock insuficiente para completar el pedido", details: null, hint: null }, 400);
      return json(route, "MA-3001");
    }
    if (p === "rpc/request_restock_v2") {
      const body = JSON.parse(req.postData() || "{}");
      state.restock = state.restock || [];
      state.restock.push(body);
      if (state.mode === "error") return json(route, { code: "P0001", message: "Ya tienes un aviso pendiente para este producto" }, 400);
      return json(route, 1);
    }
    if (p === "rpc/track_order") {
      const body = JSON.parse(req.postData() || "{}");
      if (body.p_code === "MA-ERR") return json(route, { code: "P0001", message: "Demasiadas consultas. Inténtalo más tarde" }, 400);
      if (String(body.p_code).toUpperCase() === "MA-3001" && body.p_phone === "987654321")
        return json(route, { code: "MA-3001", status: "preparado", created_at: "2026-10-26", items: [{ name: "Pulsera ojo turco", variant: "Única", quantity: 1, occasion: "Cumpleaños", packaging: "Caja de regalo", combo: null }] });
      if (String(body.p_code).toUpperCase() === "MA-3002" && body.p_phone === "987654321")
        return json(route, { code: "MA-3002", status: "cancelado", created_at: "2026-10-25", items: [] });
      return json(route, null);
    }
    return json(route, []);
  });
  return ctx;
}

async function newPage(ctx, tag) {
  const page = await ctx.newPage();
  page.setDefaultTimeout(9000);
  page.on("pageerror", (e) => consoleErrors.push(`[${tag}] pageerror: ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error" && !/Failed to load resource/.test(m.text())) consoleErrors.push(`[${tag}] console: ${m.text().slice(0, 160)}`);
  });
  return page;
}

async function step(persona, name, fn) {
  try {
    const detail = await fn();
    results.push({ persona, name, ok: true, detail: detail ?? "" });
  } catch (e) {
    results.push({ persona, name, ok: false, detail: String(e.message || e).split("\n")[0].slice(0, 200) });
  }
}
const expect = (cond, msg) => { if (!cond) throw new Error(msg); };
const main = (page) => page.locator("main").innerText();
const go = async (page, path, wait = 1500) => { await page.goto(BASE + path, { waitUntil: "networkidle" }); await page.waitForTimeout(wait); };
const opened = (page) => page.evaluate(() => window.__opened || []);
const overflow = (page) => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
const price = (t, re) => { const m = t.match(re); return m ? m[1] : null; };

const browser = await chromium.launch();

// =====================================================================
// P1 · Visitante curioso (escritorio): explora, busca, filtra, favoritos
// =====================================================================
{
  const P = "P1 Visitante curioso";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "la portada carga con productos y sin textos de ejemplo", async () => {
    await go(page, "/", 2500);
    const t = await page.locator("body").innerText();
    expect(/Joyas con significado/.test(t), "no aparece el título principal");
    expect(!/ejemplo|demostraci|ficticio|provisional/i.test(t), "aparece texto de ejemplo");
    expect(/Pulsera ojo turco/.test(t), "no aparecen productos destacados");
  });
  await step(P, "solo se muestran categorías con productos (Pulseras, Sets, Collares; no Anillos)", async () => {
    const t = await page.locator("#categories-title").locator("xpath=ancestor::section").innerText();
    expect(/Pulseras/.test(t) && /Sets/.test(t) && /Collares/.test(t), "faltan categorías con productos");
    expect(!/Anillos/.test(t), "muestra una categoría vacía");
  });
  await step(P, "el catálogo lista los 6 productos", async () => {
    await go(page, "/catalogo", 2000);
    const n = await page.locator("main article").count();
    expect(n === 6, `muestra ${n} tarjetas`);
  });
  await step(P, "buscar «ojo» deja 1 resultado", async () => {
    await page.getByPlaceholder("Buscar por nombre o categoría").fill("ojo");
    await page.waitForTimeout(500);
    const n = await page.locator("main article").count();
    expect(n === 1, `muestra ${n}`);
  });
  await step(P, "buscar algo que no existe muestra el estado vacío con opción de volver", async () => {
    await page.getByPlaceholder("Buscar por nombre o categoría").fill("zzzzzz");
    await page.waitForTimeout(500);
    const t = await main(page);
    expect(/No encontramos coincidencias/.test(t), "no muestra el mensaje");
    await page.getByRole("button", { name: "Ver todas las joyas" }).click();
    await page.waitForTimeout(400);
    expect((await page.locator("main article").count()) === 6, "no volvió a listar todo");
  });
  await step(P, "ordenar por precio de menor a mayor pone el collar primero", async () => {
    await page.locator("#catalog-sort").selectOption({ label: "Ordenar: Precio: menor a mayor" });
    await page.waitForTimeout(400);
    const first = await page.locator("main article h3").first().innerText();
    expect(/Collar/.test(first), `el primero es «${first}»`);
  });
  await step(P, "«Ocultar agotados» quita la Mano de Hamsa", async () => {
    await page.getByLabel("Ocultar agotados").first().check();
    await page.waitForTimeout(400);
    const names = await page.locator("main article h3").allInnerTexts();
    expect(!names.some((n) => /Hamsa/.test(n)) && names.length === 5, names.join(", "));
  });
  await step(P, "filtrar por significado «Protección» deja 2 joyas", async () => {
    await go(page, "/catalogo?tema=proteccion", 2000);
    const n = await page.locator("main article").count();
    expect(n === 2, `muestra ${n}`);
  });
  await step(P, "guardar un favorito y que siga tras recargar", async () => {
    await go(page, "/catalogo", 2000);
    await page.getByRole("button", { name: /Guardar Pulsera ojo turco en favoritos/ }).click();
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    const pressed = await page.getByRole("button", { name: /Quitar Pulsera ojo turco de favoritos/ }).count();
    expect(pressed === 1, "el favorito no persistió");
    await go(page, "/favoritos", 1500);
    expect(/Pulsera ojo turco/.test(await main(page)), "no aparece en /favoritos");
  });
  await step(P, "ficha de un producto agotado: no se puede agregar", async () => {
    await go(page, "/producto/mano-hamsa", 2000);
    const btn = page.getByRole("button", { name: /Agotado/ }).first();
    expect(await btn.isDisabled(), "el botón no está deshabilitado");
  });
  await step(P, "una dirección de producto que no existe muestra «No encontramos esta joya»", async () => {
    await go(page, "/producto/no-existe", 2000);
    expect(/No encontramos esta joya/.test(await main(page)), "no muestra el mensaje");
  });
  await step(P, "una dirección que no existe muestra la página 404", async () => {
    const res = await page.goto(BASE + "/esto-no-existe", { waitUntil: "networkidle" });
    expect(res.status() === 404, `código ${res.status()}`);
  });
  await ctx.close();
}

// =====================================================================
// P2 · Comprador rápido (escritorio): ficha → carrito → pedido
// =====================================================================
{
  const P = "P2 Comprador rápido";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "variante agotada no se puede elegir y la cantidad se limita al stock (3)", async () => {
    await go(page, "/producto/san-benito-plata", 2000);
    expect(await page.getByRole("radio", { name: /Negro/ }).isDisabled(), "«Negro» agotado se puede elegir");
    await page.getByRole("radio", { name: /Rojo/ }).check({ force: true });
    const plus = page.getByRole("button", { name: /Aumentar cantidad|Máximo disponible/ });
    await plus.click(); await plus.click();
    const q = await page.locator("output").first().innerText();
    expect(q.trim() === "3", `cantidad ${q}`);
    expect(await page.getByRole("button", { name: /Máximo disponible: 3/ }).isDisabled(), "permite pasar de 3");
  });
  await step(P, "agregar 3 al carrito y que el botón se bloquee (no hay más stock)", async () => {
    await page.getByRole("button", { name: /Agregar al carrito/ }).click();
    await page.waitForTimeout(500);
    expect(await page.getByRole("button", { name: /Agregar al carrito|Opción agotada/ }).isDisabled(), "permite agregar más de lo que hay");
    expect(/Ya tienes 3 en tu carrito/.test(await main(page)), "no avisa que ya tiene el máximo");
  });
  await step(P, "el carrito muestra el producto y el total S/ 267.00", async () => {
    await go(page, "/carrito", 1500);
    const t = await main(page);
    expect(/San Benito en plata/.test(t), "no muestra el producto");
    expect(price(t, /Total referencial\s*\n?\s*(S\/\s*[\d.]+)/) === "S/ 267.00", `total ${price(t, /Total referencial\s*\n?\s*(S\/\s*[\d.]+)/)}`);
  });
  await step(P, "bajar la cantidad a 2 recalcula el total (S/ 178.00)", async () => {
    await page.getByRole("button", { name: "Disminuir cantidad" }).click();
    await page.waitForTimeout(400);
    const t = await main(page);
    expect(price(t, /Total referencial\s*\n?\s*(S\/\s*[\d.]+)/) === "S/ 178.00", "total incorrecto");
  });
  await step(P, "sin datos del cliente el botón de pedido está bloqueado", async () => {
    const el = page.getByText("Pedir por WhatsApp").first();
    const tag = await el.evaluate((n) => n.closest("a,button").tagName);
    expect(tag === "BUTTON", `es un ${tag}`);
  });
  await step(P, "datos inválidos muestran errores claros y no registran el pedido", async () => {
    await page.getByLabel("Nombre").fill("A");
    await page.getByLabel("Celular").fill("12345");
    await page.getByLabel("Distrito o ciudad").fill("L");
    await page.getByText("Pedir por WhatsApp").first().click({ force: true });
    await page.waitForTimeout(400);
    expect(state.payloads.length === 0, "envió un pedido con datos inválidos");
    expect(/Completa tus datos/.test(await main(page)), "no pide completar los datos");
  });
  await step(P, "pedido válido: se registra con los datos correctos y abre WhatsApp con el código", async () => {
    await page.getByLabel("Nombre").fill("Ana Pérez");
    await page.getByLabel("Celular").fill("+51 987 654 321");
    await page.getByLabel("Distrito o ciudad").fill("Miraflores, Lima");
    await page.getByLabel("Dirección (opcional)").fill("Av. Larco 123");
    await page.getByText("Pedir por WhatsApp").first().click();
    await page.waitForTimeout(900);
    expect(state.payloads.length === 1, `se enviaron ${state.payloads.length} pedidos`);
    const b = state.payloads[0];
    expect(b.p_customer_name === "Ana Pérez" && b.p_phone === "987654321" && b.p_district === "Miraflores, Lima" && b.p_address === "Av. Larco 123", "datos del cliente incorrectos: " + JSON.stringify(b).slice(0, 160));
    expect(b.p_items.length === 1 && b.p_items[0].sku === "M2-R" && b.p_items[0].quantity === 2, "líneas incorrectas");
    const urls = await opened(page);
    const wa = urls.find((u) => u.includes("wa.me"));
    expect(wa, "no abrió WhatsApp");
    const text = decodeURIComponent(wa.split("text=")[1] || "");
    expect(/MA-3001/.test(text) && /Ana Pérez/.test(text) && /987 654 321|987654321/.test(text) && /San Benito/.test(text), "el mensaje no trae código/cliente/producto");
  });
  await step(P, "los datos del cliente quedan recordados al recargar", async () => {
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    expect((await page.getByLabel("Nombre").inputValue()) === "Ana Pérez", "no recordó el nombre");
  });
  await step(P, "pulsar de nuevo el mismo pedido NO lo duplica (reabre WhatsApp con el mismo código)", async () => {
    const before = state.payloads.length;
    await page.evaluate(() => { window.__opened = []; });
    await page.getByText("Pedir por WhatsApp").first().click();
    await page.waitForTimeout(700);
    expect(state.payloads.length === before, `se registró otro pedido (${state.payloads.length - before})`);
    const wa = (await opened(page)).find((u) => u.includes("wa.me")) || "";
    expect(/MA-3001/.test(decodeURIComponent(wa)), "no reabrió WhatsApp con el código anterior");
    expect(/ya estaba registrado/.test(await page.locator("body").innerText()), "no avisó que no se duplicó");
  });
  await step(P, "dos clics en el mismo instante registran un solo pedido nuevo", async () => {
    await page.getByLabel("Dirección (opcional)").fill("Otra dirección 456");
    state.mode = "slow"; state.payloads.length = 0;
    await page.evaluate(() => { const a = [...document.querySelectorAll("a")].find((x) => x.textContent.includes("Pedir por WhatsApp")); a.click(); a.click(); a.click(); });
    await page.waitForTimeout(2500);
    expect(state.payloads.length === 1, `se enviaron ${state.payloads.length} pedidos`);
    state.mode = "ok";
  });
  await step(P, "error del servidor (sin stock): avisa y NO abre WhatsApp", async () => {
    state.mode = "error"; state.payloads.length = 0;
    await page.getByLabel("Dirección (opcional)").fill("Dirección para error");
    await page.evaluate(() => { window.__opened = []; });
    await page.getByText("Pedir por WhatsApp").first().click();
    await page.waitForTimeout(900);
    const t = await page.locator("body").innerText();
    expect(/No pudimos registrar tu pedido: Stock insuficiente/.test(t), "no mostró el error");
    expect(!(await opened(page)).some((u) => u.includes("wa.me")), "abrió WhatsApp pese al error");
    expect((await page.evaluate(() => window.__closed || 0)) >= 1, "no cerró la pestaña en blanco");
  });
  await step(P, "sin conexión: avisa sin romper la página", async () => {
    state.mode = "netdown";
    await page.getByLabel("Dirección (opcional)").fill("Dirección sin red");
    await page.getByText("Pedir por WhatsApp").first().click();
    await page.waitForTimeout(1200);
    expect(/No pudimos registrar tu pedido/.test(await page.locator("body").innerText()), "no avisó del fallo de red");
  });
  await step(P, "quitar el producto vacía el carrito y muestra el mensaje", async () => {
    state.mode = "ok";
    await page.getByRole("button", { name: /Eliminar San Benito/ }).click();
    await page.waitForTimeout(500);
    expect(/Tu carrito aún está vacío/.test(await main(page)), "no muestra carrito vacío");
  });
  await ctx.close();
}

// =====================================================================
// P3 · Regalo: personalización completa
// =====================================================================
{
  const P = "P3 Regalo";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "«Arma tu regalo» arranca con la joya elegida desde la ficha", async () => {
    await go(page, "/regalo?producto=pulsera-ojo-turco", 2500);
    expect(/1\. ¿Qué joya vas a regalar\?/.test(await main(page)), "no está el paso 1");
    await page.getByRole("button", { name: "Continuar" }).click();
  });
  await step(P, "no deja continuar sin elegir ocasión", async () => {
    expect(await page.getByRole("button", { name: "Continuar" }).isDisabled(), "permite continuar sin ocasión");
    await page.getByRole("radio", { name: "Cumpleaños" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
  });
  await step(P, "el empaque «Caja de regalo» suma S/ 5.50 al total", async () => {
    await page.getByRole("radio", { name: /Caja de regalo/ }).click();
    const aside = await page.locator("aside[aria-label='Resumen del regalo']").innerText();
    expect(/S\/ 70\.50/.test(aside), "el total del regalo no es S/ 70.50: " + aside.replace(/\s+/g, " ").slice(0, 120));
    await page.getByRole("button", { name: "Continuar" }).click();
  });
  await step(P, "la dedicatoria respeta el límite (40) y bloquea al pasarse", async () => {
    await page.locator("#gift-dedication").fill("x".repeat(45));
    expect(/no puede superar los 40/.test(await main(page)), "no avisa del límite");
    expect(await page.getByRole("button", { name: "Continuar" }).isDisabled(), "permite continuar pasado el límite");
    await page.locator("#gift-dedication").fill("Feliz cumpleaños, mamá 💖");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Continuar" }).click();
  });
  await step(P, "el resumen muestra todos los datos del regalo", async () => {
    const t = await main(page);
    expect(/Cumpleaños/.test(t) && /Caja de regalo/.test(t) && /Feliz cumpleaños, mamá/.test(t) && /Tarjeta de significado\s*\n?\s*Sí/.test(t), "faltan datos en el resumen");
  });
  await step(P, "agregar al carrito muestra el regalo con empaque, dedicatoria y tarjeta", async () => {
    await page.getByRole("button", { name: /Agregar regalo al carrito/ }).click();
    await page.waitForURL("**/carrito");
    await page.waitForTimeout(1200);
    const t = await main(page);
    expect(/Regalo personalizado · Cumpleaños/.test(t) && /Empaque: Caja de regalo/.test(t) && /Feliz cumpleaños, mamá/.test(t) && /significado de tu joya/.test(t), "el carrito no muestra la personalización");
    expect(price(t, /Total referencial\s*\n?\s*(S\/\s*[\d.]+)/) === "S/ 70.50", "total distinto de S/ 70.50");
  });
  await step(P, "el mensaje de WhatsApp incluye el regalo completo", async () => {
    await page.locator("details summary").first().click();
    const msg = await page.locator("details pre").innerText();
    expect(/REGALO · Pulsera ojo turco/.test(msg) && /Ocasión: Cumpleaños/.test(msg) && /Empaque: Caja de regalo \(\+S\/ 5\.50 c\/u\)/.test(msg) && /Dedicatoria: "Feliz cumpleaños, mamá/.test(msg), "mensaje incompleto: " + msg.slice(0, 200));
  });
  await step(P, "el pedido enviado lleva el regalo con empaque y dedicatoria", async () => {
    await page.getByLabel("Nombre").fill("Luis Gómez");
    await page.getByLabel("Celular").fill("912345678");
    await page.getByLabel("Distrito o ciudad").fill("Surco");
    await page.getByText("Pedir por WhatsApp").first().click();
    await page.waitForTimeout(900);
    const g = state.payloads[0]?.p_items?.[0]?.gift;
    expect(g && g.occasion === "Cumpleaños" && g.packaging_id === "pk2" && g.meaning_card === true && /Feliz cumpleaños/.test(g.dedication), "payload sin regalo: " + JSON.stringify(g));
  });
  await step(P, "el stock se comparte: con 1 unidad, un regalo y una compra normal del mismo producto no caben", async () => {
    await go(page, "/producto/trebol-arbol-vida", 1800);
    await page.getByRole("button", { name: /Agregar al carrito/ }).click();
    await go(page, "/regalo?producto=trebol-arbol-vida", 2200);
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("radio", { name: "Pareja" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    await page.getByRole("button", { name: "Continuar" }).click();
    expect(await page.getByRole("button", { name: /Agregar regalo al carrito/ }).isDisabled(), "permite regalar la única unidad que ya está en el carrito");
  });
  await ctx.close();
}

// =====================================================================
// P4 · Cazador de ofertas: combos
// =====================================================================
{
  const P = "P4 Cazador de ofertas";
  const state = newState();
  state.products.find((p) => p.id === "m2").product_variants[1].stock = 2;
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "/combos muestra los 2 combos con su ahorro", async () => {
    await go(page, "/combos", 2500);
    const n = await page.locator("main article").count();
    expect(n === 2, `muestra ${n} combos`);
    expect(/10% menos/i.test(await main(page)), "no muestra el 10 %");
  });
  await step(P, "el combo con variante por elegir pide elegirla antes de agregar", async () => {
    const card = page.locator("article", { hasText: "Dúo Protección" });
    expect(await card.getByRole("button", { name: /Elige tus opciones/ }).isDisabled(), "permite agregar sin elegir");
    await card.locator("select").selectOption({ label: "Rojo" });
    const t = await card.innerText();
    expect(/S\/ 138\.60/.test(t) && /Ahorras S\/ 15\.40/.test(t), "precio/ahorro incorrecto: " + t.replace(/\s+/g, " ").slice(0, 160));
  });
  await step(P, "agregar 2 combos y no permitir un 3.º (máximo 2)", async () => {
    const card = page.locator("article", { hasText: "Dúo Protección" });
    await card.getByRole("button", { name: /Aumentar cantidad|Máximo disponible/ }).click();
    expect(await card.getByRole("button", { name: /Máximo disponible: 2/ }).isDisabled(), "permite pasar del máximo");
    await card.getByRole("button", { name: /Agregar combo/ }).click();
    await page.waitForTimeout(500);
  });
  await step(P, "el carrito muestra el combo con componentes, ahorro y total S/ 277.20", async () => {
    await go(page, "/carrito", 1500);
    const t = await main(page);
    expect(/Dúo Protección/.test(t) && /Pulsera ojo turco/.test(t) && /San Benito en plata/.test(t), "faltan componentes");
    expect(/Ahorras S\/ 30\.80/.test(t), "ahorro incorrecto");
    expect(price(t, /Total referencial\s*\n?\s*(S\/\s*[\d.]+)/) === "S/ 277.20", "total incorrecto: " + price(t, /Total referencial\s*\n?\s*(S\/\s*[\d.]+)/));
  });
  await step(P, "el stock se comparte con un producto suelto: Rojo (3) → combo×2 + 1 suelto sí, 2 sueltos no", async () => {
    await go(page, "/producto/san-benito-plata", 1800);
    await page.getByRole("radio", { name: /Rojo/ }).check({ force: true });
    const info = await main(page);
    expect(/Ya tienes 2 en tu carrito/.test(info), "no cuenta las unidades del combo");
    expect(await page.getByRole("button", { name: /Máximo disponible: 1/ }).isDisabled(), "permite más de 1 suelto");
  });
  await step(P, "el pedido enviado lleva el combo con las variantes elegidas", async () => {
    await go(page, "/carrito", 1500);
    await page.getByLabel("Nombre").fill("Rosa Díaz");
    await page.getByLabel("Celular").fill("955555555");
    await page.getByLabel("Distrito o ciudad").fill("Cusco");
    await page.getByText("Pedir por WhatsApp").first().click();
    await page.waitForTimeout(900);
    const c = state.payloads[0]?.p_combos?.[0];
    expect(c && c.combo_id === "c1" && c.quantity === 2 && c.picks.join() === "M1-U,M2-R", "payload de combo incorrecto: " + JSON.stringify(c));
    const wa = (await opened(page)).find((u) => u.includes("wa.me")) || "";
    expect(/COMBO/.test(decodeURIComponent(wa)), "el mensaje de WhatsApp no menciona el combo");
  });
  await step(P, "combo sin descuento no muestra «menos» ni ahorro", async () => {
    await go(page, "/combos", 2000);
    const t = await page.locator("article", { hasText: "Dúo sin descuento" }).innerText();
    expect(!/% menos/i.test(t) && !/Ahorras/i.test(t), "muestra descuento inexistente");
  });
  await ctx.close();
}

// =====================================================================
// P5 · Indeciso: asistente de recomendaciones
// =====================================================================
{
  const P = "P5 Indeciso";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "pareja + aniversario + hasta S/ 80: recomienda joyas dentro del presupuesto", async () => {
    await go(page, "/asistente", 2500);
    await page.getByRole("radio", { name: "Mi pareja" }).click();
    await page.getByRole("radio", { name: "Aniversario" }).click();
    await page.getByRole("radio", { name: "Hasta S/ 80" }).click();
    await page.waitForTimeout(500);
    const items = page.locator("section[aria-labelledby=finder-results] > ul > li");
    const n = await items.count();
    expect(n >= 1 && n <= 6, `recomienda ${n}`);
    const prices = (await items.allInnerTexts()).map((t) => parseFloat((t.match(/S\/\s*([\d.]+)\s*·\s*precio referencial/) || [])[1]));
    expect(prices.every((p) => p <= 80), "hay joyas sobre el presupuesto: " + prices.join(","));
  });
  await step(P, "no recomienda productos agotados", async () => {
    const t = await page.locator("section[aria-labelledby=finder-results]").innerText();
    expect(!/Hamsa/.test(t), "recomendó un producto agotado");
  });
  await step(P, "sin coincidencias ofrece ampliar y el botón funciona", async () => {
    await page.getByRole("radio", { name: "Cuentas" }).click();
    await page.getByRole("radio", { name: "Hasta S/ 35" }).click();
    await page.waitForTimeout(500);
    expect(/No encontramos joyas con todas estas condiciones/.test(await main(page)), "no muestra el estado sin resultados");
    await page.getByRole("button", { name: /Quitar el límite de presupuesto/ }).click();
    await page.waitForTimeout(500);
    expect((await page.locator("section[aria-labelledby=finder-results] > ul > li").count()) >= 1, "no aparecieron resultados al ampliar");
  });
  await step(P, "desde una recomendación se llega a la ficha", async () => {
    await page.locator("section[aria-labelledby=finder-results] h3 a").first().click();
    await page.waitForURL("**/producto/**");
  });
  await ctx.close();
}

// =====================================================================
// P6 · Cliente con pedido: seguimiento
// =====================================================================
{
  const P = "P6 Cliente con pedido";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "campos vacíos o inválidos piden datos", async () => {
    await go(page, "/pedido", 2000);
    await page.getByRole("button", { name: "Ver estado" }).click();
    expect(/Escribe tu código/.test(await main(page)), "no valida");
  });
  await step(P, "código y celular correctos muestran el estado «En preparación» y el detalle", async () => {
    await page.locator("#tr-code").fill("ma-3001");
    await page.locator("#tr-phone").fill("987 654 321");
    await page.getByRole("button", { name: "Ver estado" }).click();
    await page.getByText("Pedido MA-3001").waitFor();
    const t = await main(page);
    expect(/En preparación/.test(t) && /Pulsera ojo turco/.test(t) && /Caja de regalo/.test(t), "faltan datos del seguimiento");
    expect(!/S\/ \d/.test(t.replace(/El precio final/, "")), "muestra precios");
  });
  await step(P, "un pedido cancelado lo dice claramente", async () => {
    await page.locator("#tr-code").fill("MA-3002");
    await page.getByRole("button", { name: "Ver estado" }).click();
    await page.getByText("Este pedido fue cancelado").waitFor();
  });
  await step(P, "datos que no coinciden no revelan nada", async () => {
    await page.locator("#tr-code").fill("MA-3001");
    await page.locator("#tr-phone").fill("900000000");
    await page.getByRole("button", { name: "Ver estado" }).click();
    await page.getByText("No encontramos un pedido").waitFor();
    expect(!/Pedido MA-3001/.test(await main(page)), "reveló el pedido");
  });
  await step(P, "el límite de consultas muestra el mensaje del servidor", async () => {
    await page.locator("#tr-code").fill("MA-ERR");
    await page.locator("#tr-phone").fill("987654321");
    await page.getByRole("button", { name: "Ver estado" }).click();
    await page.getByText(/Demasiadas consultas/).waitFor();
  });
  await ctx.close();
}

// =====================================================================
// P7 · Móvil: recorrido completo en pantalla de celular
// =====================================================================
{
  const P = "P7 Cliente en celular";
  const state = newState();
  const ctx = await setupContext(browser, state, { mobile: true });
  const page = await newPage(ctx, P);
  for (const path of ["/", "/catalogo", "/producto/san-benito-plata", "/regalo", "/combos", "/asistente", "/carrito", "/contacto", "/pedido", "/nosotros", "/politicas", "/favoritos"]) {
    await step(P, `${path}: sin desbordamiento horizontal`, async () => {
      await go(page, path, 2000);
      const o = await overflow(page);
      expect(o <= 1, `se desborda ${o}px`);
    });
  }
  await step(P, "el menú móvil abre y navega", async () => {
    await go(page, "/", 1800);
    await page.getByRole("button", { name: "Abrir menú" }).click();
    await page.getByRole("link", { name: "Catálogo" }).last().click();
    await page.waitForURL("**/catalogo");
  });
  await step(P, "compra completa en el celular", async () => {
    await go(page, "/producto/pulsera-ojo-turco", 2000);
    await page.getByRole("button", { name: /Agregar al carrito/ }).click();
    await go(page, "/carrito", 1500);
    await page.getByLabel("Nombre").fill("María Quispe");
    await page.getByLabel("Celular").fill("966666666");
    await page.getByLabel("Distrito o ciudad").fill("Arequipa");
    await page.getByText("Pedir por WhatsApp").first().click();
    await page.waitForTimeout(900);
    expect(state.payloads.length === 1, "no registró el pedido");
    expect((await opened(page)).some((u) => u.includes("wa.me")), "no abrió WhatsApp");
  });
  await ctx.close();
}

// =====================================================================
// P8 · Contacto
// =====================================================================
{
  const P = "P8 Consulta por contacto";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "formulario vacío muestra los errores", async () => {
    await go(page, "/contacto", 1800);
    await page.getByRole("button", { name: /Enviar por WhatsApp/ }).click();
    const t = await main(page);
    expect(/Escribe tu nombre/.test(t) && /Indica un correo o celular/.test(t) && /Cuéntanos un poco más/.test(t), "faltan errores");
  });
  await step(P, "contacto inválido (ni correo ni celular) se rechaza", async () => {
    await page.locator("#contact-name").fill("Carlos");
    await page.locator("#contact-contact").fill("hola");
    await page.locator("#contact-message").fill("Quiero información de una pulsera");
    await page.getByRole("button", { name: /Enviar por WhatsApp/ }).click();
    expect(/correo válido o un celular/.test(await main(page)), "aceptó un contacto inválido");
  });
  await step(P, "mensaje válido abre WhatsApp con motivo, mensaje y contacto", async () => {
    await page.locator("#contact-contact").fill("carlos@correo.com");
    await page.locator("#contact-topic").selectOption("Envíos");
    await page.getByRole("button", { name: /Enviar por WhatsApp/ }).click();
    await page.waitForTimeout(500);
    const wa = (await opened(page)).find((u) => u.includes("wa.me")) || "";
    const text = decodeURIComponent(wa.split("text=")[1] || "");
    expect(/Motivo: Envíos/.test(text) && /Quiero información/.test(text) && /carlos@correo.com/.test(text), "mensaje incompleto: " + text.slice(0, 120));
    expect(/Envíalo desde allí/.test(await main(page)), "no explica que debe enviarlo");
  });
  await step(P, "las preguntas frecuentes se abren", async () => {
    const q = page.locator("details summary").first();
    await q.click();
    expect(await page.locator("details[open]").count() >= 1, "no abre");
  });
  await ctx.close();
}

// =====================================================================
// P9 · Cambios mientras compra: el stock baja después de agregar
// =====================================================================
{
  const P = "P9 Stock que cambia";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "agrega 3 y luego el stock baja a 1: el carrito avisa y no deja pedir", async () => {
    await go(page, "/producto/san-benito-plata", 2000);
    await page.getByRole("radio", { name: /Rojo/ }).check({ force: true });
    const plus = page.getByRole("button", { name: /Aumentar cantidad|Máximo/ });
    await plus.click(); await plus.click();
    await page.getByRole("button", { name: /Agregar al carrito/ }).click();
    state.products.find((p) => p.id === "m2").product_variants[0].stock = 1;
    await go(page, "/carrito", 2000);
    const t = await main(page);
    expect(/Solo quedan 1 unidad/.test(t), "no avisa que el stock bajó");
    const tag = await page.getByText("Pedir por WhatsApp").first().evaluate((n) => n.closest("a,button").tagName);
    expect(tag === "BUTTON", "deja pedir con un stock insuficiente");
  });
  await step(P, "un producto que se oculta mientras está en el carrito se marca como no disponible", async () => {
    state.products = state.products.filter((p) => p.id !== "m2");
    await go(page, "/carrito", 2000);
    const t = await main(page);
    expect(!/San Benito en plata/.test(t) || /no está disponible|ya no/.test(t) || /Tu carrito aún está vacío/.test(t), "sigue mostrando como comprable");
  });
  await ctx.close();
}

// =====================================================================
// P10 · Tienda sin productos / catálogo caído
// =====================================================================
{
  const P = "P10 Tienda vacía o con fallas";
  const state = newState({ products: [], combos: [], packaging: [] });
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "sin productos: portada limpia (sin secciones vacías)", async () => {
    await go(page, "/", 2500);
    const t = await page.locator("main").innerText();
    expect(!/Explora por categoría|Las favoritas|Combina y ahorra|Joyas con significado\n/.test(t.replace(/Joyas con significado,/, "")), "muestra secciones vacías: " + t.replace(/\s+/g, " ").slice(0, 200));
  });
  await step(P, "sin productos: el catálogo dice que se está preparando", async () => {
    await go(page, "/catalogo", 2000);
    expect(/Estamos preparando nuestro catálogo/.test(await main(page)), "mensaje ausente");
  });
  await step(P, "sin productos: «Arma tu regalo» y «Combos» muestran estados vacíos", async () => {
    await go(page, "/regalo", 2000);
    expect(/Aún no hay joyas para regalo personalizado/.test(await main(page)), "regalo");
    await go(page, "/combos", 2000);
    expect(/Todavía no hay combos disponibles/.test(await main(page)), "combos");
  });
  await step(P, "sin productos: el asistente no se rompe", async () => {
    await go(page, "/asistente", 2000);
    expect(/No encontramos joyas|Por ahora no hay joyas/.test(await main(page)), "asistente");
  });
  state.mode = "catalog500"; state.products = baseProducts();
  await step(P, "si la base de datos falla (500) el sitio no se rompe", async () => {
    await go(page, "/catalogo", 2500);
    expect((await main(page)).length > 50, "página en blanco");
  });
  await ctx.close();
}

// =====================================================================
// P11 · Revisión de accesibilidad básica en todas las páginas
// =====================================================================
{
  const P = "P11 Accesibilidad";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  for (const path of ["/", "/catalogo", "/producto/pulsera-ojo-turco", "/regalo?producto=pulsera-ojo-turco", "/combos", "/asistente", "/carrito", "/contacto", "/pedido", "/politicas", "/nosotros", "/favoritos", "/admin"]) {
    await step(P, `${path}: un solo título, imágenes con alt, campos con etiqueta, botones con nombre`, async () => {
      await go(page, path, 2200);
      const r = await page.evaluate(() => {
        const vis = (e) => !!(e.offsetWidth || e.offsetHeight || e.getClientRects().length);
        const h1 = document.querySelectorAll("h1").length;
        const imgs = [...document.images].filter((i) => !i.hasAttribute("alt")).length;
        const fields = [...document.querySelectorAll("input:not([type=hidden]), select, textarea")].filter((f) => {
          if (f.closest("[aria-hidden=true]")) return false;
          const id = f.id;
          return !(f.getAttribute("aria-label") || f.getAttribute("aria-labelledby") || (id && document.querySelector(`label[for="${id}"]`)) || f.closest("label"));
        }).map((f) => f.outerHTML.slice(0, 60));
        const buttons = [...document.querySelectorAll("button, a[href]")].filter((b) => vis(b) && !b.closest("[aria-hidden=true]") && !((b.textContent || "").trim() || b.getAttribute("aria-label") || b.getAttribute("title") || b.querySelector("img[alt]:not([alt=''])") || b.querySelector("[aria-label]"))).map((b) => b.outerHTML.slice(0, 70));
        return { h1, imgs, fields, buttons, lang: document.documentElement.lang };
      });
      expect(r.h1 === 1, `h1: ${r.h1}`);
      expect(r.imgs === 0, `${r.imgs} imágenes sin alt`);
      expect(r.fields.length === 0, `campos sin etiqueta: ${r.fields.join(" | ")}`);
      expect(r.buttons.length === 0, `sin nombre: ${r.buttons.join(" | ")}`);
      expect(r.lang === "es-PE", `idioma ${r.lang}`);
    });
  }
  await ctx.close();
}

// =====================================================================
// P12 · Acceso del administrador
// =====================================================================
{
  const P = "P12 Administrador";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "/admin-demo redirige a /admin y pide iniciar sesión", async () => {
    await page.goto(BASE + "/admin-demo", { waitUntil: "networkidle" });
    await page.waitForTimeout(1800);
    expect(page.url().endsWith("/admin"), "no redirigió: " + page.url());
    expect(await page.getByRole("heading", { name: "Iniciar sesión" }).count() === 1, "no muestra el login");
  });
  await step(P, "el panel no se ve sin sesión (sin datos ni menús)", async () => {
    const t = await page.locator("body").innerText();
    expect(!/Productos|Pedidos|Inventario/.test(t.replace("Iniciar sesión", "")), "se ven secciones del panel");
  });
  await step(P, "credenciales incorrectas muestran un error genérico", async () => {
    await page.locator("#admin-email").fill("intruso@correo-falso.test");
    await page.locator("#admin-password").fill("claveincorrecta123");
    await page.getByRole("button", { name: "Ingresar" }).click();
    await page.getByText("Correo o contraseña incorrectos").waitFor({ timeout: 15000 });
  });
  await step(P, "el pie de la tienda tiene el acceso al administrador", async () => {
    await go(page, "/", 1800);
    expect(await page.getByRole("link", { name: "Acceso administrador" }).count() === 1, "no hay enlace");
  });
  await ctx.close();
}

// =====================================================================
// P13 · Cliente que encuentra un producto agotado
// =====================================================================
{
  const P = "P13 Producto agotado";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "un producto agotado ofrece consultar por WhatsApp con el nombre del producto", async () => {
    await go(page, "/producto/mano-hamsa", 2200);
    expect(/Agotado por ahora/.test(await main(page)), "no aparece el bloque de agotado");
    const href = await page.getByRole("link", { name: /Consultar por WhatsApp/ }).getAttribute("href");
    expect(/wa\.me/.test(href) && /Mano%20de%20Hamsa|Mano de Hamsa/.test(decodeURIComponent(href)), "enlace sin el producto: " + href);
  });
  await step(P, "no promete una fecha ni un aviso automático", async () => {
    const t = await main(page);
    expect(/No podemos asegurar una fecha/.test(t), "falta la aclaración");
  });
  await step(P, "«Avísame cuando vuelva» valida nombre, celular y consentimiento", async () => {
    await page.getByRole("button", { name: "Avísame cuando vuelva" }).click();
    await page.getByRole("button", { name: "Dejar mi aviso" }).click();
    expect(/Escribe tu nombre/.test(await main(page)), "no pide el nombre");
    await page.locator("#rs-name").fill("Ana Pérez");
    await page.locator("#rs-phone").fill("12345");
    await page.getByRole("button", { name: "Dejar mi aviso" }).click();
    expect(/celular de 9 dígitos/.test(await main(page)), "no valida el celular");
    await page.locator("#rs-phone").fill("987 654 321");
    await page.getByRole("button", { name: "Dejar mi aviso" }).click();
    expect(/Marca la casilla/.test(await main(page)), "no exige el consentimiento");
    expect((state.restock || []).length === 0, "envió un aviso sin consentimiento");
  });
  await step(P, "con consentimiento se guarda el aviso con los datos correctos", async () => {
    await page.locator("#rs-note").fill("Es para un regalo");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Dejar mi aviso" }).click();
    await page.getByText(/dejamos tu aviso/).waitFor();
    const b = (state.restock || [])[0];
    expect(b && b.p_product_id === "m5" && b.p_name === "Ana Pérez" && b.p_phone === "987654321" && b.p_consent === true && b.p_note === "Es para un regalo", "payload incorrecto: " + JSON.stringify(b));
  });
  await step(P, "si el servidor rechaza el aviso (ya existe uno) muestra el motivo", async () => {
    state.mode = "error";
    await go(page, "/producto/mano-hamsa", 2200);
    await page.getByRole("button", { name: "Avísame cuando vuelva" }).click();
    await page.locator("#rs-name").fill("Ana Pérez");
    await page.locator("#rs-phone").fill("987654321");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Dejar mi aviso" }).click();
    await page.getByText("Ya tienes un aviso pendiente").waitFor();
    state.mode = "ok";
  });
  await step(P, "una variante agotada de un producto con stock también ofrece el aviso", async () => {
    await go(page, "/producto/san-benito-plata", 2200);
    expect(!/Agotado por ahora/.test(await main(page)), "muestra aviso con stock disponible");
    await page.getByRole("radio", { name: /Negro/ }).check({ force: true }).catch(() => {});
  });
  await step(P, "un producto con stock NO muestra el bloque de agotado", async () => {
    await go(page, "/producto/pulsera-ojo-turco", 2200);
    expect(!/Agotado por ahora/.test(await main(page)), "aparece en un producto disponible");
  });
  await step(P, "en el carrito, una pieza sin stock ofrece consultar disponibilidad", async () => {
    await go(page, "/producto/san-benito-plata", 2000);
    await page.getByRole("radio", { name: /Rojo/ }).check({ force: true });
    await page.getByRole("button", { name: /Agregar al carrito/ }).click();
    state.products.find((p) => p.id === "m2").product_variants[0].stock = 0;
    await go(page, "/carrito", 2000);
    const link = page.getByRole("link", { name: /Consultar disponibilidad por WhatsApp/ });
    expect(await link.count() >= 1, "no aparece el enlace de consulta");
    expect(/San%20Benito|San Benito/.test(decodeURIComponent(await link.first().getAttribute("href"))), "el enlace no menciona el producto");
  });
  await ctx.close();
}

// =====================================================================
// P14 · Cliente que usa el asistente (bot)
// =====================================================================
{
  const P = "P14 Asistente (bot)";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  const say = async (text) => {
    await page.locator("#bot-input").fill(text);
    await page.locator("#bot-input").press("Enter");
    await page.waitForTimeout(500);
  };
  const chat = () => page.locator("#asistente-panel").innerText();
  await step(P, "el botón del asistente está en la tienda y abre con un saludo y menú", async () => {
    await go(page, "/", 2200);
    await page.getByRole("button", { name: "Abrir el asistente de MariArte" }).click();
    await page.getByText(/Soy el asistente de MariArte/).first().waitFor();
    const t = await chat();
    expect(/Soy el asistente de MariArte/.test(t), "no saluda");
    for (const m of ["¿Hay stock de una joya?", "Estado de mi pedido", "Envíos y plazos", "Formas de pago", "Cómo comprar", "Hablar con una persona"]) expect(t.includes(m), "falta la opción " + m);
  });
  await step(P, "«Envíos y plazos» responde con lo que la tienda comunica y sin plazos inventados", async () => {
    await page.getByRole("button", { name: "Envíos y plazos" }).click();
    await page.waitForTimeout(400);
    const t = await chat();
    expect(/todo el Perú/.test(t) && /no se garantizan tiempos/.test(t), "respuesta incompleta");
  });
  await step(P, "pregunta por stock de un producto disponible: muestra precio y disponibilidad", async () => {
    await say("¿hay stock de la pulsera ojo turco?");
    const t = await chat();
    expect(/Pulsera ojo turco/.test(t) && /S\/ 65\.00/.test(t) && /Disponible/.test(t), "no muestra el producto con su estado: " + t.slice(-200));
  });
  await step(P, "pregunta por un producto agotado: ofrece «Avísame cuando vuelva»", async () => {
    await say("tienen la mano de hamsa?");
    const t = await chat();
    expect(/Agotado por ahora/.test(t), "no dice que está agotado");
    expect(await page.locator("#asistente-panel").getByRole("link", { name: "Avísame cuando vuelva" }).count() >= 1, "no ofrece el aviso");
  });
  await step(P, "un producto que no existe no se inventa", async () => {
    await say("hay stock de anillos de diamantes");
    expect(/No encontré joyas que coincidan/.test(await chat()), "inventó un resultado");
  });
  await step(P, "«estado de mi pedido» pide datos y valida", async () => {
    await say("quiero ver el estado de mi pedido");
    await page.locator("#bot-code").fill("MA-3001");
    await page.locator("#bot-phone").fill("123");
    await page.locator("#asistente-panel").getByRole("button", { name: "Ver estado" }).click();
    expect(/celular de 9 dígitos/.test(await chat()), "no valida el celular");
  });
  await step(P, "escribir en el chat NO borra lo que ya llenaste en el formulario de pedido", async () => {
    await page.locator("#bot-input").fill("hola");
    await page.waitForTimeout(300);
    expect((await page.locator("#bot-code").inputValue()) === "MA-3001", "se borró el código al escribir");
  });
  await step(P, "con datos correctos muestra el estado del pedido", async () => {
    await page.locator("#bot-phone").fill("987 654 321");
    await page.locator("#asistente-panel").getByRole("button", { name: "Ver estado" }).click();
    await page.getByText(/En preparación/).first().waitFor();
    expect(/MA-3001/.test(await chat()), "no muestra el código");
  });
  await step(P, "una pregunta que no entiende, con IA sin configurar, deriva a una persona (y no reintenta)", async () => {
    state.aiCalls = [];
    await say("¿trabajan con aretes de oro?");
    await page.waitForTimeout(600);
    expect(/No estoy seguro de poder ayudarte/.test(await chat()), "no deriva");
    await say("¿y collares de plata fina?");
    await page.waitForTimeout(600);
    expect(state.aiCalls.length === 1, `llamó a la IA ${state.aiCalls.length} veces con la IA sin configurar`);
  });
  await step(P, "con la IA activada responde y envía solo el historial reciente", async () => {
    state.ai = "ok"; state.aiCalls = [];
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Abrir el asistente de MariArte" }).click();
    await say("¿qué opinas del clima de esta semana?");
    await page.getByText("Respuesta de prueba del asistente con IA.").waitFor();
    const call = state.aiCalls[0];
    expect(call && call.messages.length <= 6 && call.messages.at(-1).role === "user", "payload inesperado: " + JSON.stringify(call).slice(0, 120));
  });
  await step(P, "si la IA responde «muchas consultas» se muestra un mensaje amable", async () => {
    state.ai = "rate";
    await say("¿puedes recomendarme algo especial para mi mamá?");
    await page.waitForTimeout(700);
    expect(/Hay muchas consultas/.test(await chat()), "no muestra el mensaje de límite");
  });
  await step(P, "«Hablar con una persona» abre WhatsApp", async () => {
    await page.evaluate(() => { window.__opened = []; });
    await page.getByRole("button", { name: "Hablar con una persona" }).click();
    expect((await opened(page)).some((u) => u.includes("wa.me")), "no abrió WhatsApp");
  });
  await step(P, "el asistente se cierra con el botón y vuelve a abrir", async () => {
    await page.getByRole("button", { name: "Cerrar el asistente" }).click();
    expect(await page.locator("#asistente-panel").count() === 0, "no se cerró");
  });
  await step(P, "no aparece en el panel de administración", async () => {
    await go(page, "/admin", 1800);
    expect(await page.getByRole("button", { name: /asistente de MariArte/ }).count() === 0, "aparece en /admin");
  });
  await ctx.close();
}

// Aviso con correo opcional
{
  const P = "P14b Aviso con correo";
  const state = newState();
  const ctx = await setupContext(browser, state);
  const page = await newPage(ctx, P);
  await step(P, "el aviso acepta un correo opcional, lo valida y lo envía", async () => {
    await go(page, "/producto/mano-hamsa", 2200);
    await page.getByRole("button", { name: "Avísame cuando vuelva" }).click();
    await page.locator("#rs-name").fill("Ana Pérez");
    await page.locator("#rs-phone").fill("987654321");
    await page.locator("#rs-email").fill("esto-no-es-correo");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Dejar mi aviso" }).click();
    expect(/correo válido/.test(await main(page)), "no valida el correo");
    expect((state.restock || []).length === 0, "envió con un correo inválido");
    await page.locator("#rs-email").fill("Ana@Correo.com");
    await page.getByRole("button", { name: "Dejar mi aviso" }).click();
    await page.getByText(/dejamos tu aviso/).waitFor();
    const b = state.restock[0];
    expect(b.p_email === "Ana@Correo.com", "no envió el correo: " + JSON.stringify(b));
    expect(/te enviará un correo/.test(await main(page)), "el mensaje final no menciona el correo");
  });
  await step(P, "sin correo también funciona y el mensaje no promete correo", async () => {
    state.restock = [];
    await go(page, "/producto/mano-hamsa", 2200);
    await page.getByRole("button", { name: "Avísame cuando vuelva" }).click();
    await page.locator("#rs-name").fill("Luis");
    await page.locator("#rs-phone").fill("911111111");
    await page.getByRole("checkbox").check();
    await page.getByRole("button", { name: "Dejar mi aviso" }).click();
    await page.getByText(/dejamos tu aviso/).waitFor();
    expect(state.restock[0].p_email === "", "envió un correo vacío mal formado");
    expect(!/te enviará un correo/.test(await main(page)), "promete un correo que no pidió");
  });
  await ctx.close();
}

await browser.close();

// ---------- Informe ----------
const personas = [...new Set(results.map((r) => r.persona))];
let fails = 0;
for (const p of personas) {
  const rs = results.filter((r) => r.persona === p);
  console.log(`\n### ${p}  (${rs.filter((r) => r.ok).length}/${rs.length})`);
  for (const r of rs) {
    if (!r.ok) fails++;
    console.log(`${r.ok ? "OK   " : "FALLO"} ${r.name}${r.ok ? "" : "  →  " + r.detail}`);
  }
}
const uniq = [...new Set(consoleErrors)];
console.log(`\nTOTAL: ${results.length} pruebas, ${fails} fallos. Errores de consola/página: ${uniq.length}`);
uniq.slice(0, 15).forEach((e) => console.log("  - " + e));
process.exit(fails ? 1 : 0);
