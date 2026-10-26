/**
 * Asistente «Encuentra tu joya ideal». Sin IA externa: filtra por lo que sí es verificable
 * (disponibilidad, material, presupuesto) y ordena por afinidad con las respuestas.
 * Solo recomienda productos que existen en el catálogo.
 */
import type { MaterialType, Product } from "@/types";

export const recipients = [
  { value: "mi", label: "Para mí" },
  { value: "pareja", label: "Mi pareja" },
  { value: "amistad", label: "Una amistad" },
  { value: "familiar", label: "Un familiar" },
  { value: "otro", label: "Otra persona" },
] as const;

export const recommendOccasions = [
  { value: "ninguna", label: "Sin ocasión especial" },
  { value: "cumpleanos", label: "Cumpleaños" },
  { value: "aniversario", label: "Aniversario" },
  { value: "amistad", label: "Amistad" },
  { value: "pareja", label: "Pareja" },
  { value: "agradecimiento", label: "Agradecimiento" },
] as const;

export const styleOptions = [
  { value: "minimalista", label: "Minimalista" },
  { value: "delicado", label: "Delicado" },
  { value: "llamativo", label: "Llamativo" },
  { value: "clasico", label: "Clásico" },
] as const;

export interface Answers {
  recipient: (typeof recipients)[number]["value"];
  occasion: (typeof recommendOccasions)[number]["value"];
  /** "cualquiera" = sin preferencia. */
  material: MaterialType | "cualquiera";
  /** Presupuesto máximo en soles; null = sin límite. */
  budget: number | null;
  /** "cualquiera" = sin preferencia. */
  style: (typeof styleOptions)[number]["value"] | "cualquiera";
}

export interface Recommendation {
  product: Product;
  score: number;
  reasons: string[];
}

export interface RecommendResult {
  results: Recommendation[];
  /** Si no hay coincidencias: cuántas habría quitando cada restricción. */
  relax?: { withoutMaterial: number; withoutBudget: number; withoutBoth: number };
}

const soldOut = (p: Product) => p.variants.every((v) => v.stock <= 0);

/** Temas de «Joyas con significado» que encajan con la persona y la ocasión. */
function wantedThemes(a: Answers): string[] {
  const themes = new Set<string>();
  if (a.recipient === "pareja" || a.occasion === "pareja" || a.occasion === "aniversario") themes.add("amor");
  if (a.recipient === "amistad" || a.occasion === "amistad") themes.add("amistad");
  if (a.recipient === "familiar") themes.add("amor");
  if (a.occasion === "cumpleanos" || a.occasion === "agradecimiento") themes.add("regalos-especiales");
  return [...themes];
}

function passes(p: Product, a: Answers, useMaterial: boolean, useBudget: boolean): boolean {
  if (!p.active || soldOut(p)) return false;
  if (useMaterial && a.material !== "cualquiera" && p.materialType !== a.material) return false;
  if (useBudget && a.budget !== null && p.price > a.budget) return false;
  return true;
}

export function recommend(products: Product[], a: Answers, limit = 6): RecommendResult {
  const themes = wantedThemes(a);
  const shareable = a.recipient === "pareja" || a.recipient === "amistad" || a.occasion === "pareja" || a.occasion === "amistad";
  const isGift = a.recipient !== "mi" || a.occasion !== "ninguna";

  const ranked: Recommendation[] = products
    .filter((p) => passes(p, a, true, true))
    .map((product) => {
      let score = 0;
      const reasons: string[] = [];
      if (a.budget !== null) reasons.push(`Dentro de tu presupuesto (hasta S/ ${a.budget})`);
      if (a.material !== "cualquiera") reasons.push(`Material: ${product.materialType}`);
      const matchedThemes = themes.filter((t) => product.themeIds?.includes(t));
      if (matchedThemes.length) {
        score += 3 * matchedThemes.length;
        reasons.push("Su significado simbólico encaja con tu ocasión");
      }
      if (shareable && product.categoryId === "sets") {
        score += 2;
        reasons.push("Es un set para compartir");
      }
      if (isGift && product.giftEnabled) {
        score += 1;
        reasons.push("Puedes armarlo como regalo con dedicatoria");
      }
      if (a.style !== "cualquiera" && product.styles?.includes(a.style)) {
        score += 3;
        reasons.push(`Estilo ${a.style}`);
      }
      if (product.featured) score += 0.5;
      if (product.isNew) score += 0.25;
      return { product, score, reasons };
    })
    .sort((x, y) => y.score - x.score || x.product.price - y.product.price)
    .slice(0, limit);

  if (ranked.length > 0) return { results: ranked };

  const count = (m: boolean, b: boolean) => products.filter((p) => passes(p, a, m, b)).length;
  return {
    results: [],
    relax: { withoutMaterial: count(false, true), withoutBudget: count(true, false), withoutBoth: count(false, false) },
  };
}
