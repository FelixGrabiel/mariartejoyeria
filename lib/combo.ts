/**
 * Precios y vigencia de combos («Combina y ahorra»). Lógica pura, igual a la de la función SQL `place_order`:
 * el descuento (porcentaje entero) se aplica a cada componente y se redondea al céntimo.
 */
export interface ComboWindow {
  active: boolean;
  startsAt?: string | null;
  endsAt?: string | null;
}

/** ¿El combo se puede comprar ahora? (activo y dentro de su vigencia). */
export function isComboLive(combo: ComboWindow, now: Date = new Date()): boolean {
  if (!combo.active) return false;
  if (combo.startsAt && new Date(combo.startsAt).getTime() > now.getTime()) return false;
  if (combo.endsAt && new Date(combo.endsAt).getTime() <= now.getTime()) return false;
  return true;
}

/** Precio unitario con la promoción aplicada (en soles). 0 % = sin descuento. */
export function discountedPrice(price: number, percent: number): number {
  const cents = Math.round(price * 100);
  return Math.round((cents * (100 - percent)) / 100) / 100;
}

export interface ComboTotals {
  /** Suma de los precios individuales (sin promoción). */
  regular: number;
  /** Total con la promoción. */
  total: number;
  /** Ahorro; 0 si no hay promoción activa. */
  savings: number;
}

export function comboTotals(components: { price: number; quantity: number }[], percent: number): ComboTotals {
  const regular = components.reduce((sum, c) => sum + Math.round(c.price * 100) * c.quantity, 0);
  const total = components.reduce((sum, c) => sum + Math.round(discountedPrice(c.price, percent) * 100) * c.quantity, 0);
  return { regular: regular / 100, total: total / 100, savings: (regular - total) / 100 };
}
