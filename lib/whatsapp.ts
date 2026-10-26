import { site } from "@/data/site";
import type { CartLine, ComboLine, Product, ProductVariant } from "@/types";
import type { Customer } from "./customer";
import { formatPrice } from "./format";

/**
 * Construye enlaces wa.me. Solo ABRE WhatsApp con el texto prellenado:
 * la persona revisa y envía el mensaje manualmente. Nada se envía solo.
 */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${site.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildOrderMessage(lines: CartLine[], giftNote?: string, customer?: Customer, orderCode?: string, comboLines: ComboLine[] = []): string {
  const valid = lines.filter((l) => !l.issue);
  const validCombos = comboLines.filter((l) => !l.issue);
  const subtotal =
    valid.reduce((sum, l) => sum + l.lineTotal, 0) + validCombos.reduce((sum, l) => sum + l.total, 0);

  const body = valid
    .map((l, i) => {
      const variant = l.product.variantName ? ` (${l.product.variantName}: ${l.variant.label})` : "";
      const gift = l.item.gift;
      const unit = l.unitPrice + (l.packaging?.price ?? 0);
      const lines = [
        `${i + 1}. ${gift ? "REGALO · " : ""}${l.product.name}${variant}`,
        `   ${l.item.quantity} x ${formatPrice(unit)} = ${formatPrice(l.lineTotal)}`,
        `   SKU: ${l.variant.sku}`,
      ];
      if (gift) {
        if (gift.occasion) lines.push(`   Ocasión: ${gift.occasion}`);
        if (l.packaging) {
          lines.push(`   Empaque: ${l.packaging.name}${l.packaging.price > 0 ? ` (+${formatPrice(l.packaging.price)} c/u)` : ""}`);
        }
        if (gift.dedication.trim()) lines.push(`   Dedicatoria: "${gift.dedication.trim()}"`);
        if (gift.meaningCard) lines.push("   Incluir tarjeta «El significado de tu joya»");
      }
      return lines.join("\n");
    })
    .join("\n");

  const comboBody = validCombos
    .map((l, i) => {
      const head = `${valid.length + i + 1}. COMBO · ${l.combo.name} (x${l.item.quantity})${l.combo.discountPercent > 0 ? ` · ${l.combo.discountPercent}% menos` : ""}`;
      const parts = l.components.map((c) => `   - ${c.quantity * l.item.quantity}x ${c.product.name} (${c.variant.label}) · SKU: ${c.variant.sku}`);
      return [head, ...parts, `   Total del combo: ${formatPrice(l.total)}${l.savings > 0 ? ` (ahorro ${formatPrice(l.savings)})` : ""}`].join("\n");
    })
    .join("\n");

  const parts = [
    ...(orderCode ? [`Pedido web ${orderCode}`, ""] : []),
    "Hola, MariArte. Quisiera solicitar este pedido (queda pendiente de tu confirmación):",
    "",
    [body, comboBody].filter(Boolean).join("\n"),
    "",
    `Subtotal referencial: ${formatPrice(subtotal)}`,
    "Envío por confirmar.",
    `Total referencial (sin envío): ${formatPrice(subtotal)}`,
  ];

  if (customer && customer.name.trim()) {
    parts.push("", "Mis datos:", `Nombre: ${customer.name.trim()}`);
    if (customer.phone.trim()) parts.push(`Celular: ${customer.phone.trim()}`);
    if (customer.district.trim()) parts.push(`Distrito/ciudad: ${customer.district.trim()}`);
    if (customer.address.trim()) parts.push(`Dirección: ${customer.address.trim()}`);
  }

  if (giftNote?.trim()) {
    parts.push("", "Dedicatoria / nota para regalo:", `"${giftNote.trim()}"`);
  }

  parts.push("", "¿Me confirman disponibilidad, precio final y opciones de entrega? Gracias.");
  return parts.join("\n");
}

export function buildProductMessage(product: Product, variant: ProductVariant | undefined, quantity: number): string {
  const variantText = variant && product.variantName ? ` (${product.variantName}: ${variant.label})` : "";
  return [
    `Hola, MariArte. Me interesa esta joya:`,
    "",
    `${product.name}${variantText}`,
    `Cantidad: ${quantity}`,
    `Precio referencial: ${formatPrice(product.price * quantity)}`,
    "Envío por confirmar.",
    "",
    "¿Está disponible?",
  ].join("\n");
}
