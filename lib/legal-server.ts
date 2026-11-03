import { emptyBusiness, BUSINESS_KEYS, type BusinessInfo } from "@/lib/supabase";
import type { LegalSection } from "@/types";

/** Lectura en el servidor (con la clave pública y RLS) de los textos legales y los datos del negocio. */
export async function fetchLegalPublic(): Promise<{ sections: LegalSection[]; info: BusinessInfo } | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  try {
    const opts = { headers: { apikey: key }, next: { revalidate: 120 } } as const;
    const [s, b] = await Promise.all([
      fetch(`${url}/rest/v1/legal_sections?select=id,title,body,sort_order&order=sort_order`, opts),
      fetch(`${url}/rest/v1/store_settings?select=key,value&key=in.(${BUSINESS_KEYS.join(",")})`, opts),
    ]);
    if (!s.ok || !b.ok) return null;
    const rows = (await s.json()) as { id: string; title: string; body: string; sort_order: number }[];
    const settings = (await b.json()) as { key: string; value: string }[];
    const info: BusinessInfo = { ...emptyBusiness };
    for (const r of settings) if ((BUSINESS_KEYS as readonly string[]).includes(r.key)) info[r.key as keyof BusinessInfo] = r.value ?? "";
    return { sections: rows.map((r) => ({ id: r.id, title: r.title, body: r.body, sortOrder: r.sort_order })), info };
  } catch {
    return null;
  }
}
