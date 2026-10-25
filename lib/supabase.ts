import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { CategoryId, MaterialType, Order, OrderStatus, Product, StockMovement } from "@/types";

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
  product_variants: { sku: string; label: string; stock: number; sort_order: number }[];
}

/** Catálogo público (solo productos activos, por RLS). Devuelve null si falla. */
export async function fetchCatalog(): Promise<Product[] | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("products")
    .select("*, product_variants(sku,label,stock,sort_order)")
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
    variants: [...r.product_variants]
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(({ sku, label, stock }) => ({ sku, label, stock })),
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
    supabase.from("products").select("*, product_variants(sku,label,stock,sort_order)").order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select("id,code,customer_name,district,channel,status,created_at,order_items(product_id,product_name,variant_label,quantity,unit_price)")
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
      district: r.district,
      channel: r.channel,
      status: r.status,
      createdAt: r.created_at,
      items: (r.order_items ?? []).map((i: { product_id: string | null; product_name: string; variant_label: string; quantity: number; unit_price: number | string }) => ({
        productId: i.product_id ?? "",
        productName: i.product_name,
        variantLabel: i.variant_label,
        quantity: i.quantity,
        unitPrice: Number(i.unit_price),
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
  });
  if (error) return error.message;
  const skus = product.variants.map((v) => v.sku);
  const del = await supabase.from("product_variants").delete().eq("product_id", product.id).not("sku", "in", `(${skus.map((s) => `"${s}"`).join(",")})`);
  if (del.error) return del.error.message;
  const up = await supabase.from("product_variants").upsert(
    product.variants.map((v, i) => ({ sku: v.sku, product_id: product.id, label: v.label, stock: v.stock, sort_order: i + 1 })),
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
  items: { productId: string; sku: string; quantity: number }[],
): Promise<{ code: string } | { error: string }> {
  if (!supabase) return { error: "Supabase no está configurado." };
  const { data, error } = await supabase.rpc("create_order", {
    p_items: items.map((i) => ({ product_id: i.productId, sku: i.sku, quantity: i.quantity })),
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
