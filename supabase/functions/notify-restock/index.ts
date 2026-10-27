// Envía por correo los avisos "Avísame cuando vuelva" cuando el stock regresó.
// Se ejecuta (1) automáticamente cada 5 minutos desde la base de datos (pg_cron, con un secreto interno guardado en Vault) y (2) a mano desde el panel (sesión de administrador).
// Secretos que pones tú en Supabase → Edge Functions → Secrets: RESEND_API_KEY y FROM_EMAIL (ej. "MariArte <avisos@tudominio.com>"). Opcionales: SITE_URL, WHATSAPP_NUMBER.

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE_URL = (Deno.env.get("SITE_URL") ?? "https://mariartejoyeria.vercel.app").replace(/\/$/, "");
const WHATSAPP = Deno.env.get("WHATSAPP_NUMBER") ?? "51981360835";

const svc = { apikey: SERVICE_KEY, authorization: `Bearer ${SERVICE_KEY}`, "content-type": "application/json" };

const CORS = {
  "access-control-allow-origin": SITE_URL,
  "access-control-allow-headers": "authorization, apikey, content-type, x-client-info, x-webhook-secret",
  "access-control-allow-methods": "POST, OPTIONS",
  vary: "origin",
};

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/** Autorización: secreto interno de la tarea programada (se valida en la base de datos) o sesión de un administrador. */
async function authorized(req: Request): Promise<boolean> {
  const sent = req.headers.get("x-webhook-secret");
  if (sent) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/verify_notify_secret`, { method: "POST", headers: svc, body: JSON.stringify({ p_secret: sent }) });
    if (res.ok && (await res.json()) === true) return true;
  }

  const auth = req.headers.get("authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || token === ANON_KEY) return false;
  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: { apikey: ANON_KEY, authorization: `Bearer ${token}` } });
  if (!userRes.ok) return false;
  const user = await userRes.json();
  if (!user?.id) return false;
  const staff = await fetch(`${SUPABASE_URL}/rest/v1/staff_profiles?user_id=eq.${user.id}&role=eq.admin&select=role`, { headers: svc });
  const rows = staff.ok ? await staff.json() : [];
  return Array.isArray(rows) && rows.length > 0;
}

type Req = {
  id: number; product_id: string | null; sku: string | null; product_name: string; variant_label: string | null;
  customer_name: string; email: string | null;
};

async function currentStock(r: Req): Promise<{ stock: number; slug: string | null; active: boolean }> {
  if (!r.product_id) return { stock: 0, slug: null, active: false };
  const pRes = await fetch(`${SUPABASE_URL}/rest/v1/products?id=eq.${encodeURIComponent(r.product_id)}&select=slug,active`, { headers: svc });
  const p = pRes.ok ? ((await pRes.json())[0] as { slug: string; active: boolean } | undefined) : undefined;
  const filter = r.sku ? `sku=eq.${encodeURIComponent(r.sku)}` : `product_id=eq.${encodeURIComponent(r.product_id)}`;
  const vRes = await fetch(`${SUPABASE_URL}/rest/v1/product_variants?${filter}&select=stock`, { headers: svc });
  const vs = vRes.ok ? ((await vRes.json()) as { stock: number }[]) : [];
  return { stock: vs.reduce((s, v) => s + v.stock, 0), slug: p?.slug ?? null, active: Boolean(p?.active) };
}

function emailHtml(r: Req, slug: string): string {
  const label = esc(`${r.product_name}${r.variant_label ? ` (${r.variant_label})` : ""}`);
  const link = `${SITE_URL}/producto/${encodeURIComponent(slug)}`;
  return `<div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;color:#2b1a20">
  <h2 style="font-family:Georgia,serif">¡Buenas noticias, ${esc(r.customer_name.split(" ")[0])}!</h2>
  <p><strong>${label}</strong> volvió a estar disponible en MariArte. Las unidades pueden agotarse, así que no podemos reservarla automáticamente.</p>
  <p><a href="${link}" style="background:#6b3a4d;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;display:inline-block">Ver la joya</a></p>
  <p>¿Prefieres que te ayudemos? Escríbenos por <a href="https://wa.me/${WHATSAPP}">WhatsApp</a>.</p>
  <p style="color:#777;font-size:12px">Recibes este correo porque pediste que te avisáramos cuando este producto volviera. Es un único aviso.</p>
</div>`;
}

async function patch(id: number, fields: Record<string, unknown>) {
  await fetch(`${SUPABASE_URL}/rest/v1/restock_requests?id=eq.${id}`, { method: "PATCH", headers: svc, body: JSON.stringify(fields) });
}

Deno.serve(async (req: Request) => {
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...CORS, "content-type": "application/json" } });
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);
  if (!(await authorized(req))) return json({ error: "unauthorized" }, 401);

  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("FROM_EMAIL");
  if (!resendKey || !from) {
    return json({ configured: false, message: "El envío de correos aún no está configurado (faltan RESEND_API_KEY y FROM_EMAIL)." });
  }

  const listRes = await fetch(
    `${SUPABASE_URL}/rest/v1/restock_requests?ready_at=not.is.null&status=eq.pendiente&notify_status=is.null&select=id,product_id,sku,product_name,variant_label,customer_name,email&order=ready_at.asc&limit=50`,
    { headers: svc },
  );
  if (!listRes.ok) return json({ error: "db" }, 500);
  const pending = (await listRes.json()) as Req[];

  let sent = 0, failed = 0, withoutEmail = 0, skipped = 0;
  for (const r of pending) {
    const s = await currentStock(r);
    if (s.stock <= 0 || !s.active || !s.slug) {
      // Volvió a agotarse o se ocultó: vuelve a esperar.
      await patch(r.id, { ready_at: null });
      skipped++;
      continue;
    }
    if (!r.email) {
      await patch(r.id, { notify_status: "sin_correo" });
      withoutEmail++;
      continue;
    }
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { authorization: `Bearer ${resendKey}`, "content-type": "application/json" },
        body: JSON.stringify({
          from,
          to: [r.email],
          subject: `${r.product_name} ya está disponible en MariArte`,
          html: emailHtml(r, s.slug),
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        await patch(r.id, { notified_at: new Date().toISOString(), notify_status: "enviado", notify_error: null });
        sent++;
      } else {
        await patch(r.id, { notify_status: "fallido", notify_error: `resend ${res.status}` });
        failed++;
      }
    } catch (e) {
      await patch(r.id, { notify_status: "fallido", notify_error: String((e as Error).message).slice(0, 200) });
      failed++;
    }
  }
  return json({ configured: true, sent, failed, withoutEmail, skipped });
});
