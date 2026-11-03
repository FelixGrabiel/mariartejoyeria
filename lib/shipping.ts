import type { ShippingZone } from "@/types";

export interface ShippingQuote {
  /** Costo en soles. null = se confirma por WhatsApp. */
  cost: number | null;
  free: boolean;
}

/** Costo de envío de una zona para un subtotal. Debe coincidir con `place_order_v2` en la base de datos. */
export function shippingQuote(zone: ShippingZone | undefined, subtotal: number): ShippingQuote {
  if (!zone) return { cost: null, free: false };
  if (zone.price === null) return { cost: null, free: false };
  if (zone.freeFrom !== null && subtotal >= zone.freeFrom) return { cost: 0, free: true };
  return { cost: zone.price, free: false };
}

/** Cuánto falta para el envío gratis (0 si ya lo tiene o no aplica). */
export function missingForFreeShipping(zone: ShippingZone | undefined, subtotal: number): number {
  if (!zone || zone.price === null || zone.freeFrom === null || subtotal >= zone.freeFrom) return 0;
  return Math.round((zone.freeFrom - subtotal) * 100) / 100;
}
