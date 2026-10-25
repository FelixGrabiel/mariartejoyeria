/**
 * Lógica pura de «Arma tu regalo». No importa nada del proyecto para poder
 * probarse con `npm test` sin compilar la app.
 */
export const occasions = [
  "Cumpleaños",
  "Aniversario",
  "Amistad",
  "Pareja",
  "Agradecimiento",
  "Otra ocasión",
] as const;

export const DEFAULT_DEDICATION_MAX = 150;

export interface GiftLike {
  occasion: string;
  packagingId?: string;
  dedication: string;
  meaningCard: boolean;
}

/** Identificador estable de una personalización; sirve para distinguir líneas del carrito. */
export function giftKey(gift?: GiftLike): string {
  if (!gift) return "";
  return [gift.occasion.trim(), gift.packagingId ?? "", gift.dedication.trim(), gift.meaningCard ? "1" : "0"].join("¦");
}

export function sameLine(
  a: { productId: string; sku: string; gift?: GiftLike },
  b: { productId: string; sku: string; gift?: GiftLike },
): boolean {
  return a.productId === b.productId && a.sku === b.sku && giftKey(a.gift) === giftKey(b.gift);
}

/** Texto de la dedicatoria sin espacios sobrantes; null si queda vacía. */
export function cleanDedication(text: string, max: number): string {
  return text.replace(/\s+\n/g, "\n").trim().slice(0, Math.max(0, max));
}

export function dedicationError(text: string, max: number): string | null {
  if (text.trim().length > max) return `La dedicatoria no puede superar los ${max} caracteres.`;
  return null;
}

/** Unidades totales en el carrito de un mismo SKU (con o sin regalo). */
export function unitsForSku(items: { sku: string; quantity: number }[], sku: string): number {
  return items.filter((i) => i.sku === sku).reduce((sum, i) => sum + i.quantity, 0);
}
