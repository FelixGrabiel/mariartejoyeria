import { site } from "@/data/site";
import type { BusinessInfo } from "@/lib/supabase";

export const PENDING_MARK = "[por completar]";

const SITE = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://mariartejoyeria.vercel.app").replace(/\/$/, "");

/** Valores para las {{llaves}} de los textos legales. Lo que el titular no completó queda marcado «[por completar]». */
export function legalValues(info: BusinessInfo): Record<string, string> {
  const pick = (v: string) => (v.trim() ? v.trim() : PENDING_MARK);
  return {
    razon_social: pick(info.biz_legal_name),
    ruc: pick(info.biz_ruc),
    domicilio: pick(info.biz_address),
    correo: pick(info.biz_email),
    ciudad: pick(info.biz_city),
    medios_pago: pick(info.biz_payment_methods),
    dias_cambio: pick(info.change_days),
    dias_reclamo: pick(info.complaints_days),
    whatsapp: site.whatsappDisplay,
    sitio: SITE,
  };
}

export function fillLegal(text: string, values: Record<string, string>): string {
  return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => values[key] ?? PENDING_MARK);
}

/** Datos que aún faltan completar (para avisar en el panel). */
export function missingBusinessFields(info: BusinessInfo): string[] {
  const labels: [keyof BusinessInfo, string][] = [
    ["biz_legal_name", "Razón social o nombre del titular"],
    ["biz_ruc", "RUC"],
    ["biz_address", "Domicilio"],
    ["biz_email", "Correo de contacto"],
    ["biz_city", "Ciudad para controversias"],
  ];
  return labels.filter(([k]) => !info[k].trim()).map(([, label]) => label);
}

export type LegalBlock = { type: "h"; text: string } | { type: "p"; text: string } | { type: "ul"; items: string[] };

/** Convierte el texto simple («## Título», «- viñeta», párrafos) en bloques seguros para mostrar (sin HTML). */
export function parseLegal(text: string): LegalBlock[] {
  const blocks: LegalBlock[] = [];
  let list: string[] | null = null;
  const flush = () => {
    if (list) blocks.push({ type: "ul", items: list });
    list = null;
  };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) {
      flush();
      continue;
    }
    if (line.startsWith("## ")) {
      flush();
      blocks.push({ type: "h", text: line.slice(3).trim() });
    } else if (line.startsWith("- ")) {
      list = list ?? [];
      list.push(line.slice(2).trim());
    } else {
      flush();
      blocks.push({ type: "p", text: line });
    }
  }
  flush();
  return blocks;
}
