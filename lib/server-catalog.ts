import { cache } from "react";
import { initialProducts } from "@/data/products";
import { fetchCatalog, supabase } from "@/lib/supabase";
import type { Product } from "@/types";

/**
 * Catálogo para renderizar en el servidor (páginas, metadata, sitemap).
 * - Con Supabase: productos activos de la base (null si la consulta falla; el navegador lo reintenta).
 * - Sin Supabase (desarrollo local): los datos de ejemplo.
 */
export const getCatalog = cache(async (): Promise<Product[] | null> => {
  if (!supabase) return initialProducts;
  return fetchCatalog();
});
