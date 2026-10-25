import { site } from "@/data/site";
import type { CartLine, Product, ProductVariant } from "@/types";
import { formatPrice } from "./format";

/**
 * Construye enlaces wa.me. Solo ABRE WhatsApp con el texto prellenado:
 * la persona revisa y envía el mensaje manualmente. Nada se envía solo.
 */
export function whatsappUrl(message?: string): string {
  const base = `https://wa.me/${site.whatsappNumber}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

export function buildOrderMessage(lines: CartLine[], giftNote?: string): string {
  const valid = lines.filter((l) => !l.issue);
  const subtotal = valid.reduce((sum, l) => sum + l.lineTotal, 0);

  const body = valid
    .map((l, i) => {
      const variant = l.product.variantName ? ` (${l.product.variantName}: ${l.variant.label})` : "";
      return `${i + 1}. ${l.product.name}${variant}\n   ${l.item.quantity} x ${formatPrice(l.unitPrice)} = ${formatPrice(l.lineTotal)}\n   SKU: ${l.variant.sku}`;
    })
    .join("\n");

  const parts = [
    "Hola, MariArte. Me gustaría consultar este pedido:",
    "",
    body,
    "",
    `Subtotal referencial: ${formatPrice(subtotal)}`,
    "Envío por confirmar.",
    `Total referencial (sin envío): ${formatPrice(subtotal)}`,
  ];

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
