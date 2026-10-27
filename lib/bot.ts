/**
 * Lógica pura del asistente del sitio: detecta qué quiere el cliente y da respuestas fijas basadas en
 * datos reales. No inventa nada: lo que no sabe lo deriva a WhatsApp. Sin imports del proyecto (se prueba con `npm test`).
 */
export type Intent =
  | "saludo"
  | "gracias"
  | "humano"
  | "pedido"
  | "stock"
  | "envios"
  | "pagos"
  | "cambios"
  | "comprar"
  | "regalo"
  | "horario"
  | "precio"
  | "desconocido";

const normalize = (t: string) =>
  t
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9ñ\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

/** Cada intención con sus palabras (o inicios de palabra). El orden importa: la primera que coincide gana. */
const RULES: { intent: Intent; words: string[] }[] = [
  { intent: "humano", words: ["persona", "asesor", "asesora", "humano", "hablar con", "llamar", "alguien", "atencion al cliente", "reclamo", "queja"] },
  { intent: "pedido", words: ["mi pedido", "pedido", "seguimiento", "rastrear", "codigo", "estado de", "ya salio", "donde esta"] },
  { intent: "envios", words: ["envio", "envian", "enviar", "delivery", "entrega", "entregan", "provincia", "demora", "tarda", "plazo", "recoger", "recojo"] },
  { intent: "pagos", words: ["pago", "pagar", "yape", "plin", "tarjeta", "transferencia", "deposito", "efectivo", "cobran", "cuotas"] },
  { intent: "cambios", words: ["cambio", "cambiar", "devolucion", "devolver", "garantia", "reembolso"] },
  { intent: "regalo", words: ["regalo", "regalar", "dedicatoria", "empaque", "tarjeta de", "sorpresa"] },
  { intent: "horario", words: ["horario", "atienden", "abierto", "abren", "cierran", "a que hora"] },
  { intent: "comprar", words: ["como compro", "como comprar", "como pido", "como hago un pedido", "quiero comprar", "quiero pedir", "como pedir", "como funciona"] },
  { intent: "precio", words: ["precio", "cuesta", "cuanto cuesta", "cuanto sale", "cuanto vale", "costo", "valor"] },
  { intent: "stock", words: ["stock", "disponible", "disponibilidad", "hay ", "tienen", "tiene ", "queda", "quedan", "agotado", "agotada", "volvera", "reponen"] },
  { intent: "gracias", words: ["gracias", "muchas gracias", "ok gracias", "listo gracias"] },
  { intent: "saludo", words: ["hola", "buenas", "buenos dias", "buenas tardes", "buenas noches", "hey", "holi"] },
];

export function detectIntent(text: string): Intent {
  const t = ` ${normalize(text)} `;
  if (t.trim().length === 0) return "desconocido";
  for (const rule of RULES) {
    if (rule.words.some((w) => t.includes(w.endsWith(" ") ? ` ${w}` : w.includes(" ") ? w : ` ${w}`))) return rule.intent;
  }
  return "desconocido";
}

const STOP = new Set([
  "hay", "tienen", "tiene", "tienes", "stock", "disponible", "disponibles", "disponibilidad", "quiero", "queria", "quisiera", "saber", "si", "de", "del", "la", "el", "las", "los",
  "un", "una", "unos", "unas", "en", "para", "por", "con", "que", "me", "mi", "precio", "cuanto", "cuesta", "pulsera", "pulseras", "joya", "joyas", "esta", "estan", "queda", "quedan",
  "agotado", "agotada", "y", "o", "a", "al", "se", "lo", "le", "ver", "ya", "volvera", "reponen", "buenas", "hola", "por", "favor", "porfavor",
]);

/** Palabras útiles para buscar un producto dentro de una frase como «¿hay pulsera de ojo turco?». */
export function productQuery(text: string): string {
  return normalize(text)
    .split(" ")
    .filter((w) => w.length > 1 && !STOP.has(w))
    .join(" ");
}

export interface BotFacts {
  whatsappUrl: string;
  siteUrl?: string;
}

/** Respuestas fijas: solo lo que la tienda ya comunica en su sitio. */
export function staticAnswer(intent: Intent, f: BotFacts): string | null {
  switch (intent) {
    case "saludo":
      return "¡Hola! Soy el asistente de MariArte. Puedo ayudarte a ver si hay stock de una joya, revisar el estado de tu pedido o resolver dudas de envíos y pagos. ¿Qué necesitas?";
    case "gracias":
      return "¡Con gusto! Si necesitas algo más, aquí estoy.";
    case "envios":
      return "Enviamos a todo el Perú. El costo, la empresa de envío y el plazo se coordinan por WhatsApp según tu ciudad, y no se garantizan tiempos hasta que la tienda los confirme.";
    case "pagos":
      return "Por ahora la web no cobra en línea. Al enviar tu pedido, MariArte te escribe por WhatsApp para confirmar disponibilidad, precio final, forma de pago y envío.";
    case "cambios":
      return "La política de cambios y devoluciones está por confirmarse con la tienda. Consúltala por WhatsApp antes de comprar y te responden con las condiciones.";
    case "comprar":
      return "Es sencillo: agrega las joyas al carrito, escribe tu nombre, celular y distrito, y pulsa «Pedir por WhatsApp». Se registra tu pedido (con un código) y se abre WhatsApp con el mensaje listo; MariArte lo confirma contigo.";
    case "regalo":
      return "Puedes armar un regalo con empaque y dedicatoria en la página «Arma tu regalo». Elige la joya, la ocasión, el empaque y escribe tu mensaje; lo agregamos al carrito.";
    case "horario":
      return "El horario de atención aún no está publicado en la web. Escríbenos por WhatsApp y te responden en cuanto puedan.";
    case "precio":
      return "Los precios son referenciales y están en cada ficha. Dime el nombre de la joya y te muestro el precio y si hay stock.";
    case "humano":
      return `Claro, te comunico con una persona de MariArte por WhatsApp: ${f.whatsappUrl}`;
    default:
      return null;
  }
}

export const MENU: { id: string; label: string; text: string }[] = [
  { id: "stock", label: "¿Hay stock de una joya?", text: "¿Hay stock?" },
  { id: "pedido", label: "Estado de mi pedido", text: "Quiero ver el estado de mi pedido" },
  { id: "envios", label: "Envíos y plazos", text: "¿Cómo son los envíos?" },
  { id: "pagos", label: "Formas de pago", text: "¿Cómo puedo pagar?" },
  { id: "comprar", label: "Cómo comprar", text: "¿Cómo compro?" },
  { id: "humano", label: "Hablar con una persona", text: "Quiero hablar con una persona" },
];

export type Availability = "disponible" | "pocas" | "agotado";

/** Disponibilidad en palabras (sin prometer unidades exactas). */
export function availabilityOf(stocks: number[]): Availability {
  const total = stocks.reduce((s, n) => s + Math.max(0, n), 0);
  if (total <= 0) return "agotado";
  return total <= 2 ? "pocas" : "disponible";
}

export const availabilityLabel: Record<Availability, string> = {
  disponible: "Disponible",
  pocas: "Quedan pocas unidades",
  agotado: "Agotado por ahora",
};
