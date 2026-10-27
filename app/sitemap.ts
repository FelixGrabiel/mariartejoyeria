import type { MetadataRoute } from "next";
import { fetchPublicProducts, SITE_URL } from "@/lib/seo";
import { initialProducts } from "@/data/products";

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixed = ["", "/catalogo", "/regalo", "/combos", "/asistente", "/nosotros", "/contacto", "/politicas", "/pedido"].map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: "weekly" as const,
    priority: path === "" ? 1 : 0.7,
  }));
  const remote = await fetchPublicProducts();
  const products = (remote ?? initialProducts.map((p) => ({ slug: p.slug, createdAt: p.createdAt }))).map((p) => ({
    url: `${SITE_URL}/producto/${p.slug}`,
    lastModified: new Date(p.createdAt),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));
  return [...fixed, ...products];
}
