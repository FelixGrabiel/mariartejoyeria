/**
 * Utilidades de SEO que se ejecutan en el servidor (sitemap, metadatos, datos estructurados).
 * Usan solo la clave pública y respetan RLS: nunca ven productos ocultos.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mariartejoyeria.vercel.app").replace(/\/$/, "");

/** Mientras la tienda tenga datos de ejemplo, los buscadores no deben indexarla. Se activa con NEXT_PUBLIC_ALLOW_INDEXING=true. */
export const ALLOW_INDEXING = process.env.NEXT_PUBLIC_ALLOW_INDEXING === "true";

export interface PublicProduct {
  slug: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  inStock: boolean;
  createdAt: string;
}

/** null = no hay base de datos o falló (se usa el catálogo local); [] = la base respondió y no hay productos activos. */
export async function fetchPublicProducts(): Promise<PublicProduct[] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const res = await fetch(`${url}/rest/v1/products?select=slug,name,description,price,images,created_at,product_variants(stock)&order=created_at.desc`, {
      headers: { apikey: key },
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    const rows = (await res.json()) as {
      slug: string;
      name: string;
      description: string;
      price: number | string;
      images: string[];
      created_at: string;
      product_variants: { stock: number }[];
    }[];
    return rows.map((r) => ({
      slug: r.slug,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      images: r.images ?? [],
      inStock: (r.product_variants ?? []).some((v) => v.stock > 0),
      createdAt: r.created_at,
    }));
  } catch {
    return null;
  }
}

/** Convierte una ruta de imagen del sitio en URL absoluta (las de Storage ya lo son). */
export function absoluteUrl(path: string): string {
  return /^https?:\/\//.test(path) ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}
