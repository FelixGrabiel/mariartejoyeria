/**
 * Cálculo puro de las líneas del carrito (productos sueltos y combos), con sus avisos de stock.
 * Separado de StoreContext para poder probarlo con `npm test`.
 */
import type { CartItem, CartLine, Combo, ComboCartItem, ComboLine, PackagingOption, Product } from "../types/index.ts";
import { comboTotals, discountedPrice, isComboLive } from "./combo.ts";
import { unitsForSku } from "./gift.ts";

/** Unidades de un SKU reservadas en el carrito (sueltas + componentes de combos). `skipCombo` ignora un combo por posición. */
export function unitsInCartFor(cart: CartItem[], comboCart: ComboCartItem[], combos: Combo[], sku: string, skipCombo = -1): number {
  let total = unitsForSku(cart, sku);
  comboCart.forEach((ci, idx) => {
    if (idx === skipCombo) return;
    const combo = combos.find((c) => c.id === ci.comboId);
    combo?.items.forEach((it, i) => {
      if ((it.sku ?? ci.picks[i]) === sku) total += it.quantity * ci.quantity;
    });
  });
  return total;
}

export function buildComboLines(
  comboCart: ComboCartItem[],
  combos: Combo[],
  products: Product[],
  configLoaded: boolean,
  unitsInCart: (sku: string) => number,
): ComboLine[] {
  const lines: ComboLine[] = [];
  comboCart.forEach((item) => {
    const combo = combos.find((c) => c.id === item.comboId);
    if (!combo) {
      if (configLoaded) {
        // El combo ya no existe o venció: se muestra como línea con aviso para que el cliente la quite.
        lines.push({
          item,
          combo: { id: item.comboId, name: "Combo no disponible", description: "", discountPercent: 0, active: false, maxPerOrder: 1, sortOrder: 0, items: [] },
          components: [],
          regular: 0,
          total: 0,
          savings: 0,
          issue: "Este combo ya no está disponible.",
        });
      }
      return;
    }
    let issue: string | undefined;
    if (!isComboLive(combo)) issue = "Este combo ya no está vigente.";
    else if (item.quantity > combo.maxPerOrder) issue = `Máximo ${combo.maxPerOrder} por pedido.`;
    const components: ComboLine["components"] = [];
    combo.items.forEach((it, i) => {
      const sku = it.sku ?? item.picks[i];
      const product = products.find((p) => p.id === it.productId);
      const variant = product?.variants.find((v) => v.sku === sku);
      if (!product || !variant) {
        issue = issue ?? "Falta elegir una opción o un producto del combo ya no existe.";
        return;
      }
      if (!product.active) issue = issue ?? `${product.name} ya no está disponible.`;
      else if (variant.stock <= 0) issue = issue ?? `${product.name} (${variant.label}) se agotó.`;
      else if (unitsInCart(sku) > variant.stock) issue = issue ?? `Solo quedan ${variant.stock} unidad(es) de ${product.name} (${variant.label}).`;
      components.push({ product, variant, quantity: it.quantity, unitPrice: discountedPrice(product.price, combo.discountPercent) });
    });
    const totals = comboTotals(components.map((c) => ({ price: c.product.price, quantity: c.quantity })), combo.discountPercent);
    lines.push({
      item,
      combo,
      components,
      regular: totals.regular * item.quantity,
      total: Math.round(totals.total * item.quantity * 100) / 100,
      savings: Math.round(totals.savings * item.quantity * 100) / 100,
      issue,
    });
  });
  return lines;
}

export function buildCartLines(
  cart: CartItem[],
  products: Product[],
  packaging: PackagingOption[],
  configLoaded: boolean,
  unitsInCart: (sku: string) => number,
): CartLine[] {
  const lines: CartLine[] = [];
  for (const item of cart) {
    const product = products.find((p) => p.id === item.productId);
    const variant = product?.variants.find((v) => v.sku === item.sku);
    if (!product || !variant) continue;
    const pack = item.gift?.packagingId ? packaging.find((o) => o.id === item.gift?.packagingId && o.active) : undefined;
    const packUnit = pack?.price ?? 0;
    const totalUnits = unitsInCart(item.sku);
    let issue: string | undefined;
    if (!product.active) issue = "Esta joya ya no está disponible en la tienda.";
    else if (variant.stock === 0) issue = "Esta opción se agotó.";
    else if (totalUnits > variant.stock) issue = `Solo quedan ${variant.stock} unidad(es) de esta opción en total. Ajusta las cantidades.`;
    else if (item.gift && !product.giftEnabled) issue = "Esta joya ya no admite personalización de regalo.";
    else if (item.gift?.packagingId && configLoaded && !pack) issue = "El empaque elegido ya no está disponible. Quita la línea y vuelve a armar el regalo.";
    lines.push({
      item,
      product,
      variant,
      unitPrice: product.price,
      lineTotal: (product.price + packUnit) * item.quantity,
      packaging: pack,
      issue,
    });
  }
  return lines;
}

/** Subtotal en soles de las líneas sin problemas (productos + combos), redondeado al céntimo. */
export function cartSubtotalOf(cartLines: CartLine[], comboLines: ComboLine[]): number {
  return (
    Math.round(
      (cartLines.filter((l) => !l.issue).reduce((sum, l) => sum + l.lineTotal, 0) +
        comboLines.filter((l) => !l.issue).reduce((sum, l) => sum + l.total, 0)) *
        100,
    ) / 100
  );
}
