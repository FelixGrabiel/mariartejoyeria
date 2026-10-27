import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { normalizePhone, type Customer } from "@/lib/customer";
import type { CartItem, Combo, RestockRequest, ComboCartItem, CategoryId, MaterialType, MeaningTheme, Order, OrderStatus, PackagingOption, Product, StockMovement } from "@/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/** null si faltan las variables de entorno: la tienda usa entonces los datos de ejemplo locales. */
export const supabase: SupabaseClient | null = url && key ? createClient(url, key) : null;

interface ProductRow {
  id: string;
  slug: string;
  name: string;
  description: string;
  category_id: string;
  material: string;
  material_type: string;
  price: number | string;
  images: string[];
  featured: boolean;
  active: boolean;
  is_new: boolean;
  variant_name: string | null;
  care: string | null;
  created_at: string;
  gift_enabled: boolean;
  meaning: string | null;
  styles: string[] | null;
  product_themes: { theme_id: string }[];
  product_variants: { sku: string; label: string; stock: number; sort_order: number; min_stock: number }[];
}

/** Catálogo público (solo productos activos, por RLS). Devuelve null si falla. */
export async function fetchCatalog(): Promise<Product[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(sku,label,stock,sort_order,min_stock), product_themes(theme_id)")
    .order("created_at", { ascending: false });
  if (error || !data) return null;
  return (data as ProductRow[]).map(rowToProduct);
}

// ---------- Panel administrativo (requiere sesión de administrador, por RLS) ----------

function rowToProduct(r: ProductRow): Product {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description,
    categoryId: r.category_id as CategoryId,
    material: r.material,
    materialType: r.material_type as MaterialType,
    price: Number(r.price),
    images: r.images,
    featured: r.featured,
    active: r.active,
    isNew: r.is_new || undefined,
    variantName: r.variant_name ?? undefined,
    care: r.care ?? undefined,
    createdAt: r.created_at,
    giftEnabled: r.gift_enabled,
    meaning: r.meaning ?? undefined,
    themeIds: (r.product_themes ?? []).map((t) => t.theme_id),
    styles: r.styles ?? [],
    variants: [...r.product_variants]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ sku, label, stock, min_stock }) => ({ sku, label, stock, minStock: min_stock })),
  };
}

/** ¿El usuario con sesión es administrador? (puede leer su fila en staff_profiles) */
export async function checkIsAdmin(userId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.from("staff_profiles").select("role").eq("user_id", userId).maybeSingle();
  return data?.role === "admin";
}

export async function fetchAdminData(): Promise<{ products: Product[]; orders: Order[]; movements: StockMovement[] } | null> {
  if (!supabase) return null;
  const [p, o, m] = await Promise.all([
    supabase.from("products").select("*, product_variants(sku,label,stock,sort_order,min_stock), product_themes(theme_id)").order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id,code,customer_name,customer_phone,address,district,channel,status,created_at,order_items(product_id,product_name,variant_label,quantity,unit_price,occasion,packaging_name,packaging_price,dedication,meaning_card,combo_name,combo_group)")
      .order("created_at", { ascending: false })
      .order("code", { ascending: false }),
    supabase.from("inventory_movements").select("*").order("date", { ascending: false }).order("id", { ascending: false }),
  ]);
  if (p.error || o.error || m.error) return null;
  return {
    products: (p.data as ProductRow[]).map(rowToProduct),
    orders: (o.data ?? []).map((r) => ({
      id: r.id,
      code: r.code,
      customerName: r.customer_name,
      customerPhone: r.customer_phone ?? undefined,
      address: r.address || undefined,
      district: r.district,
      channel: r.channel,
      status: r.status,
      createdAt: r.created_at,
      items: (r.order_items ?? []).map((i: {
        product_id: string | null;
        product_name: string;
        variant_label: string;
        quantity: number;
        unit_price: number | string;
        occasion: string | null;
        packaging_name: string | null;
        packaging_price: number | string;
        dedication: string | null;
        meaning_card: boolean;
        combo_name: string | null;
        combo_group: number | null;
      }) => ({
        productId: i.product_id ?? "",
        productName: i.product_name,
        variantLabel: i.variant_label,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
        occasion: i.occasion ?? undefined,
        packagingName: i.packaging_name ?? undefined,
        packagingPrice: Number(i.packaging_price),
        dedication: i.dedication ?? undefined,
        meaningCard: i.meaning_card || undefined,
        comboName: i.combo_name ?? undefined,
        comboGroup: i.combo_group ?? undefined,
      })),
    })),
    movements: (m.data ?? []).map((r) => ({
      id: r.id,
      date: r.date,
      sku: r.sku,
      productName: r.product_name,
      type: r.type,
      quantity: r.quantity,
      note: r.note,
    })),
  };
}

/** Devuelve un mensaje de error o null si todo salió bien. */
type DbResult = string | null;

export async function dbSaveProduct(product: Product, movements: StockMovement[]): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("products").upsert({
    id: product.id,
    slug: product.slug,
    name: product.name,
    description: product.description,
    category_id: product.categoryId,
    material: product.material,
    material_type: product.materialType,
    price: product.price,
    images: product.images,
    featured: product.featured,
    active: product.active,
    is_new: !!product.isNew,
    variant_name: product.variantName ?? null,
    care: product.care ?? null,
    created_at: product.createdAt.slice(0, 10),
    gift_enabled: !!product.giftEnabled,
    meaning: product.meaning?.trim() || null,
    styles: product.styles ?? [],
  });
  if (error) return error.message;
  const themes = product.themeIds ?? [];
  const delThemes = await supabase.from("product_themes").delete().eq("product_id", product.id);
  if (delThemes.error) return delThemes.error.message;
  if (themes.length) {
    const insThemes = await supabase.from("product_themes").insert(themes.map((theme_id) => ({ product_id: product.id, theme_id })));
    if (insThemes.error) return insThemes.error.message;
  }
  const skus = product.variants.map((v) => v.sku);
  const del = await supabase.from("product_variants").delete().eq("product_id", product.id).not("sku", "in", `(${skus.map((s) => `"${s}"`).join(",")})`);
  if (del.error) return del.error.message;
  const up = await supabase.from("product_variants").upsert(
    product.variants.map((v, i) => ({ sku: v.sku, product_id: product.id, label: v.label, stock: v.stock, sort_order: i + 1, min_stock: v.minStock ?? 2 })),
  );
  if (up.error) return up.error.message;
  return dbInsertMovements(movements);
}

export async function dbInsertMovements(movements: StockMovement[]): Promise<DbResult> {
  if (!supabase || !movements.length) return null;
  const { error } = await supabase.from("inventory_movements").insert(
    movements.map((m) => ({ id: m.id, date: m.date, sku: m.sku, product_name: m.productName, type: m.type, quantity: m.quantity, note: m.note })),
  );
  return error?.message ?? null;
}

export async function dbDeleteProduct(productId: string): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("products").delete().eq("id", productId);
  return error?.message ?? null;
}

export async function dbSetProductActive(productId: string, active: boolean): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("products").update({ active }).eq("id", productId);
  return error?.message ?? null;
}

export async function dbUpdateOrderStatus(orderId: string, status: OrderStatus): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("orders").update({ status }).eq("id", orderId);
  return error?.message ?? null;
}

export async function dbSetStock(sku: string, stock: number, movement: StockMovement): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("product_variants").update({ stock }).eq("sku", sku);
  if (error) return error.message;
  return dbInsertMovements([movement]);
}

// ---------- Pedidos desde la tienda y fotos ----------

/** Registra el pedido en la base (precio y stock se validan en el servidor). Devuelve el código o un error. */
export async function dbCreateOrder(
  items: CartItem[],
  customer: Customer,
  combos: ComboCartItem[] = [],
): Promise<{ code: string } | { error: string }> {
  if (!supabase) return { error: "Supabase no está configurado." };
  const { data, error } = await supabase.rpc("place_order", {
    p_customer_name: customer.name.trim(),
    p_phone: normalizePhone(customer.phone),
    p_district: customer.district.trim(),
    p_address: customer.address.trim(),
    p_items: items.map((i) => ({
      product_id: i.productId,
      sku: i.sku,
      quantity: i.quantity,
      gift: i.gift
        ? { occasion: i.gift.occasion, packaging_id: i.gift.packagingId ?? "", dedication: i.gift.dedication, meaning_card: i.gift.meaningCard }
        : undefined,
    })),
    p_combos: combos.map((c) => ({ combo_id: c.comboId, quantity: c.quantity, picks: c.picks })),
  });
  if (error) return { error: error.message };
  return { code: String(data) };
}

/** Sube una foto al bucket público de productos y devuelve su URL pública. */
export async function uploadProductImage(file: File): Promise<{ url: string } | { error: string }> {
  if (!supabase) return { error: "Supabase no está configurado." };
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type });
  if (error) return { error: error.message };
  return { url: supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl };
}


// ---------- Empaques, significados y ajustes ----------

export interface StoreConfig {
  packaging: PackagingOption[];
  themes: MeaningTheme[];
  dedicationMax: number;
}

/** Con sesión de administrador devuelve también lo inactivo (por RLS); sin sesión, solo lo activo. */
export async function fetchStoreConfig(): Promise<StoreConfig | null> {
  if (!supabase) return null;
  const [pk, th, st] = await Promise.all([
    supabase.from("packaging_options").select("*").order("sort_order"),
    supabase.from("meaning_themes").select("*").order("sort_order"),
    supabase.from("store_settings").select("key,value").eq("key", "dedication_max_chars").maybeSingle(),
  ]);
  if (pk.error || th.error) return null;
  const max = Number(st.data?.value);
  return {
    packaging: (pk.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      active: r.active,
      sortOrder: r.sort_order,
    })),
    themes: (th.data ?? []).map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      active: r.active,
      sortOrder: r.sort_order,
    })),
    dedicationMax: Number.isInteger(max) && max > 0 ? max : 150,
  };
}

export async function dbSavePackaging(p: PackagingOption): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("packaging_options").upsert({
    id: p.id,
    name: p.name,
    description: p.description,
    price: p.price,
    active: p.active,
    sort_order: p.sortOrder,
  });
  return error?.message ?? null;
}

export async function dbDeletePackaging(id: string): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("packaging_options").delete().eq("id", id);
  return error?.message ?? null;
}

export async function dbSaveTheme(t: MeaningTheme): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("meaning_themes").upsert({
    id: t.id,
    name: t.name,
    description: t.description,
    active: t.active,
    sort_order: t.sortOrder,
  });
  return error?.message ?? null;
}

export async function dbDeleteTheme(id: string): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("meaning_themes").delete().eq("id", id);
  return error?.message ?? null;
}

export async function dbSaveDedicationMax(value: number): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("store_settings").upsert({ key: "dedication_max_chars", value: String(value) });
  return error?.message ?? null;
}

export interface TrackedOrder {
  code: string;
  status: OrderStatus;
  created_at: string;
  items: { name: string; variant: string; quantity: number; occasion: string | null; packaging: string | null; combo?: string | null }[];
}

/** Seguimiento público: exige el código y el celular del pedido. Devuelve null si no coinciden. */
export async function dbTrackOrder(code: string, phone: string): Promise<{ order: TrackedOrder | null } | { error: string }> {
  if (!supabase) return { error: "El seguimiento no está disponible en modo demostración." };
  const { data, error } = await supabase.rpc("track_order", { p_code: code.trim(), p_phone: normalizePhone(phone) });
  if (error) return { error: error.message };
  return { order: (data as TrackedOrder | null) ?? null };
}

// ---------- Combos ----------

interface ComboRow {
  id: string;
  name: string;
  description: string;
  discount_percent: number;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  max_per_order: number;
  sort_order: number;
  combo_items: { product_id: string; sku: string | null; quantity: number; position: number; id: number }[];
}

/** Con sesión de administrador devuelve también pausados y programados (por RLS); sin sesión, solo los vigentes. */
export async function fetchCombos(): Promise<Combo[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("combos").select("*, combo_items(id,product_id,sku,quantity,position)").order("sort_order");
  if (error || !data) return null;
  return (data as ComboRow[]).map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    discountPercent: r.discount_percent,
    active: r.active,
    startsAt: r.starts_at ?? undefined,
    endsAt: r.ends_at ?? undefined,
    maxPerOrder: r.max_per_order,
    sortOrder: r.sort_order,
    items: [...r.combo_items]
      .sort((a, b) => a.position - b.position || a.id - b.id)
      .map((i) => ({ productId: i.product_id, sku: i.sku ?? undefined, quantity: i.quantity })),
  }));
}

export async function dbSaveCombo(combo: Combo): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("combos").upsert({
    id: combo.id,
    name: combo.name,
    description: combo.description,
    discount_percent: combo.discountPercent,
    active: combo.active,
    starts_at: combo.startsAt || null,
    ends_at: combo.endsAt || null,
    max_per_order: combo.maxPerOrder,
    sort_order: combo.sortOrder,
  });
  if (error) return error.message;
  const del = await supabase.from("combo_items").delete().eq("combo_id", combo.id);
  if (del.error) return del.error.message;
  const ins = await supabase.from("combo_items").insert(
    combo.items.map((i, idx) => ({ combo_id: combo.id, product_id: i.productId, sku: i.sku || null, quantity: i.quantity, position: idx + 1 })),
  );
  return ins.error?.message ?? null;
}

export async function dbDeleteCombo(id: string): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("combos").delete().eq("id", id);
  return error?.message ?? null;
}

/** Guarda solo la lista (y el orden) de fotos de un producto. */
export async function dbSetProductImages(productId: string, images: string[]): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("products").update({ images }).eq("id", productId);
  return error?.message ?? null;
}

/** Borra del almacenamiento una foto subida desde el panel (solo si es una URL de nuestro bucket). */
export async function deleteStoredImage(url: string): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const marker = "/storage/v1/object/public/product-images/";
  const idx = url.indexOf(marker);
  if (idx < 0) return null; // foto de la biblioteca del sitio: no hay archivo remoto que borrar
  const { error } = await supabase.storage.from("product-images").remove([decodeURIComponent(url.slice(idx + marker.length))]);
  return error?.message ?? null;
}

export const isStoredImage = (url: string): boolean => url.includes("/storage/v1/object/public/product-images/");

// ---------- Avisos de stock ----------

/** El cliente deja su contacto para que la tienda le escriba si un producto agotado vuelve. */
export async function dbRequestRestock(input: {
  productId: string;
  sku?: string;
  name: string;
  phone: string;
  email?: string;
  note?: string;
  consent: boolean;
}): Promise<{ id: number } | { error: string }> {
  if (!supabase) return { error: "Los avisos no están disponibles en modo demostración." };
  const { data, error } = await supabase.rpc("request_restock_v2", {
    p_product_id: input.productId,
    p_sku: input.sku ?? "",
    p_name: input.name.trim(),
    p_phone: normalizePhone(input.phone),
    p_email: (input.email ?? "").trim(),
    p_note: (input.note ?? "").trim(),
    p_consent: input.consent,
  });
  if (error) return { error: error.message };
  return { id: Number(data) };
}

export async function fetchRestockRequests(): Promise<RestockRequest[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("restock_requests").select("*").order("created_at", { ascending: false });
  if (error || !data) return null;
  return data.map((r) => ({
    id: r.id,
    productId: r.product_id,
    sku: r.sku ?? undefined,
    productName: r.product_name,
    variantLabel: r.variant_label ?? undefined,
    customerName: r.customer_name,
    customerPhone: r.customer_phone,
    note: r.note,
    status: r.status,
    createdAt: r.created_at,
    email: r.email ?? undefined,
    readyAt: r.ready_at ?? undefined,
    notifiedAt: r.notified_at ?? undefined,
    notifyStatus: r.notify_status ?? undefined,
  }));
}

export async function dbSetRestockStatus(id: number, status: "pendiente" | "atendido"): Promise<DbResult> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.from("restock_requests").update({ status }).eq("id", id);
  return error?.message ?? null;
}

// ---------- Asistente (IA opcional) y envío de avisos por correo ----------

/** Pregunta al asistente con IA (función del servidor). Devuelve la respuesta o el motivo por el que no se pudo. */
export async function askAssistant(messages: { role: string; content: string }[]): Promise<{ reply: string } | { error: "not_configured" | "rate" | "busy" | "fail" }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return { error: "not_configured" };
  try {
    const res = await fetch(`${url}/functions/v1/assistant`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: key, authorization: `Bearer ${key}` },
      body: JSON.stringify({ messages }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && typeof data.reply === "string") return { reply: data.reply };
    if (data?.error === "not_configured" || data?.error === "rate" || data?.error === "busy") return { error: data.error };
    return { error: "fail" };
  } catch {
    return { error: "fail" };
  }
}

export interface NotifyResult {
  configured: boolean;
  message?: string;
  sent?: number;
  failed?: number;
  withoutEmail?: number;
  skipped?: number;
}

/** Pide al servidor que envíe ya los avisos por correo pendientes (solo administradores). */
export async function invokeNotifyRestock(): Promise<NotifyResult | { error: string }> {
  if (!supabase) return { error: "Supabase no está configurado." };
  const { data, error } = await supabase.functions.invoke("notify-restock", { body: {} });
  if (error) return { error: "No se pudo ejecutar el envío. Inténtalo de nuevo." };
  return data as NotifyResult;
}
