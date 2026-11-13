/**
 * Cupones: texto y cálculo de referencia para el panel y el carrito. Lógica pura (sin React).
 * El descuento REAL lo calcula la base de datos (`coupon_discount` en supabase/migrations); esto debe coincidir con ella.
 */
export type CouponKind = "percent" | "amount";

export interface Coupon {
  code: string;
  kind: CouponKind;
  value: number;
  minSubtotal: number;
  startsAt?: string;
  endsAt?: string;
  maxUses?: number;
  uses: number;
  active: boolean;
  note: string;
}

const money = (n: number): string => `S/ ${n.toFixed(2)}`;

/** Normaliza lo que escribe la persona: mayúsculas, sin espacios. */
export const normalizeCouponCode = (text: string): string => text.trim().toUpperCase().replace(/\s+/g, "");

export const isValidCouponCode = (code: string): boolean => /^[A-Z0-9_-]{3,24}$/.test(code);

/** Descuento en soles para un subtotal (nunca mayor que el subtotal). No revisa vigencia ni usos. */
export function couponDiscount(kind: CouponKind, value: number, subtotal: number): number {
  const raw = kind === "percent" ? Math.round(subtotal * value) / 100 : value;
  return Math.round(Math.min(Math.max(raw, 0), Math.max(subtotal, 0)) * 100) / 100;
}

export function couponLabel(c: Pick<Coupon, "kind" | "value">): string {
  return c.kind === "percent" ? `${c.value}% de descuento` : `${money(c.value)} de descuento`;
}

export type CouponStatus = "activo" | "pausado" | "programado" | "vencido" | "agotado";

/** Estado visible en el panel. */
export function couponStatus(c: Coupon, now: Date): CouponStatus {
  if (!c.active) return "pausado";
  if (c.maxUses !== undefined && c.uses >= c.maxUses) return "agotado";
  if (c.endsAt && now > new Date(c.endsAt)) return "vencido";
  if (c.startsAt && now < new Date(c.startsAt)) return "programado";
  return "activo";
}
