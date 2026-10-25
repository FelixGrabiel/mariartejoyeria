/**
 * Persistencia local SOLO para la demo (carrito, favoritos y cambios del
 * panel). En producción, productos/pedidos/stock vivirán en Supabase.
 */
export const STORAGE_KEYS = {
  cart: "mariarte.demo.v1.cart",
  favorites: "mariarte.demo.v1.favorites",
  giftNote: "mariarte.demo.v1.giftNote",
  products: "mariarte.demo.v1.products",
  orders: "mariarte.demo.v1.orders",
  movements: "mariarte.demo.v1.movements",
} as const;

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Modo privado o almacenamiento lleno: la demo sigue funcionando en memoria.
  }
}

export function removeStorage(key: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignorar
  }
}
