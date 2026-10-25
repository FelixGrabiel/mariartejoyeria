import type { CategoryId, MaterialType, Product, ProductVariant } from "@/types";

export type SortOption = "destacados" | "novedades" | "nombre" | "precio-asc" | "precio-desc";

export const sortOptions: { value: SortOption; label: string }[] = [
  { value: "destacados", label: "Destacados" },
  { value: "novedades", label: "Novedades" },
  { value: "nombre", label: "Nombre (A–Z)" },
  { value: "precio-asc", label: "Precio: menor a mayor" },
  { value: "precio-desc", label: "Precio: mayor a menor" },
];

export type PriceRange = "todos" | "hasta-35" | "35-50" | "mas-50";

export const priceRanges: { value: PriceRange; label: string }[] = [
  { value: "todos", label: "Todos los precios" },
  { value: "hasta-35", label: "Hasta S/ 35" },
  { value: "35-50", label: "S/ 35 – S/ 50" },
  { value: "mas-50", label: "Más de S/ 50" },
];

export const materialTypes: MaterialType[] = ["Hilo tejido", "Cuentas", "Metal (por confirmar)"];

export interface CatalogFilters {
  query: string;
  categories: CategoryId[];
  materials: MaterialType[];
  /** Ids de «Joyas con significado». */
  themes: string[];
  price: PriceRange;
  onlyAvailable: boolean;
}

export const emptyFilters: CatalogFilters = {
  query: "",
  categories: [],
  materials: [],
  themes: [],
  price: "todos",
  onlyAvailable: false,
};

export function totalStock(product: Product): number {
  return product.variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0);
}

export function isSoldOut(product: Product): boolean {
  return totalStock(product) === 0;
}

export function firstAvailableVariant(product: Product): ProductVariant | undefined {
  return product.variants.find((v) => v.stock > 0);
}

export function lowStockVariants(products: Product[], threshold = 2) {
  return products.flatMap((p) =>
    p.variants
      .filter((v) => v.stock <= threshold)
      .map((v) => ({ product: p, variant: v })),
  );
}

function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}

function inPriceRange(price: number, range: PriceRange): boolean {
  switch (range) {
    case "hasta-35":
      return price <= 35;
    case "35-50":
      return price > 35 && price <= 50;
    case "mas-50":
      return price > 50;
    default:
      return true;
  }
}

export function filterProducts(
  products: Product[],
  filters: CatalogFilters,
  categoryNames: Record<string, string>,
): Product[] {
  const q = normalize(filters.query.trim());
  return products.filter((p) => {
    if (!p.active) return false;
    if (filters.categories.length && !filters.categories.includes(p.categoryId)) return false;
    if (filters.materials.length && !filters.materials.includes(p.materialType)) return false;
    if (filters.themes.length && !filters.themes.some((t) => p.themeIds?.includes(t))) return false;
    if (!inPriceRange(p.price, filters.price)) return false;
    if (filters.onlyAvailable && isSoldOut(p)) return false;
    if (q) {
      const haystack = normalize(
        `${p.name} ${categoryNames[p.categoryId] ?? ""} ${p.material} ${p.variants.map((v) => v.label).join(" ")}`,
      );
      if (!q.split(/\s+/).every((word) => haystack.includes(word))) return false;
    }
    return true;
  });
}

export function sortProducts(products: Product[], sort: SortOption): Product[] {
  const list = [...products];
  switch (sort) {
    case "novedades":
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    case "nombre":
      return list.sort((a, b) => a.name.localeCompare(b.name, "es"));
    case "precio-asc":
      return list.sort((a, b) => a.price - b.price);
    case "precio-desc":
      return list.sort((a, b) => b.price - a.price);
    default:
      return list.sort((a, b) => {
        if (a.featured !== b.featured) return a.featured ? -1 : 1;
        const soldA = isSoldOut(a) ? 1 : 0;
        const soldB = isSoldOut(b) ? 1 : 0;
        return soldA - soldB;
      });
  }
}
