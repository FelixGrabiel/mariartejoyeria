/** Datos de contacto del pedido. Lógica pura (sin imports del proyecto) para poder probarla con `npm test`. */
export interface Customer {
  name: string;
  phone: string;
  district: string;
  address: string;
}

export const emptyCustomer: Customer = { name: "", phone: "", district: "", address: "" };

/** Deja solo los 9 dígitos del celular peruano (acepta +51 y espacios). */
export function normalizePhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("51") ? digits.slice(2) : digits;
}

export type CustomerErrors = Partial<Record<keyof Customer, string>>;

export function validateCustomer(c: Customer): CustomerErrors {
  const errors: CustomerErrors = {};
  const name = c.name.trim();
  if (name.length < 2 || name.length > 80) errors.name = "Escribe tu nombre.";
  if (!/^9\d{8}$/.test(normalizePhone(c.phone))) errors.phone = "Escribe un celular de 9 dígitos que empiece con 9.";
  const district = c.district.trim();
  if (district.length < 2 || district.length > 80) errors.district = "Escribe tu distrito o ciudad.";
  if (c.address.trim().length > 160) errors.address = "Máximo 160 caracteres.";
  return errors;
}

export function isCustomerValid(c: Customer): boolean {
  return Object.keys(validateCustomer(c)).length === 0;
}
