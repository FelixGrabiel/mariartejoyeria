import type { MetadataRoute } from "next";
import { siteUrl } from "@/data/site";
import { getCatalog } from "@/lib/server-catalog";

export const revalidate = 3600;

const staticPaths = ["/", "/catalogo", "/regalo", "/nosotros", "/contacto", "/politicas"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = (await getCatalog()) ?? [];
  return [
    ...staticPaths.map((path) => ({ url: `${siteUrl}${path}`, changeFrequency: "weekly" as const, priority: path === "/" ? 1 : 0.7 })),
    ...products
      .filter((p) => p.active)
      .map((p) => ({ url: `${siteUrl}/producto/${p.slug}`, lastModified: p.createdAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
