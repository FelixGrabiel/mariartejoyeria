import { supabase } from "@/lib/supabase";

const TABLES = [
  "products",
  "product_variants",
  "product_themes",
  "orders",
  "order_items",
  "inventory_movements",
  "packaging_options",
  "meaning_themes",
  "combos",
  "combo_items",
  "restock_requests",
  "shipping_zones",
  "legal_sections",
  "store_settings",
  "complaints",
] as const;

/** Descarga (como administrador) una copia en JSON de las tablas de la tienda. Devuelve un error o null. */
export async function downloadBackup(): Promise<string | null> {
  if (!supabase) return "Supabase no está configurado.";
  const data: Record<string, unknown[]> = {};
  for (const table of TABLES) {
    const rows: unknown[] = [];
    for (let from = 0; ; from += 1000) {
      const { data: page, error } = await supabase.from(table).select("*").range(from, from + 999);
      if (error) return `No se pudo leer «${table}»: ${error.message}`;
      rows.push(...(page ?? []));
      if (!page || page.length < 1000) break;
    }
    data[table] = rows;
  }
  const blob = new Blob([JSON.stringify({ app: "mariarte", createdAt: new Date().toISOString(), tables: data }, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `respaldo-mariarte-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return null;
}
