export type CategoryId = "pulseras" | "collares" | "anillos" | "sets" | "regalos";

export interface Category {
  id: CategoryId;
  name: string;
  description: string;
  /** Imagen de portada. Si falta, se muestra un marcador "foto pendiente". */
  image?: string;
}

export type MaterialType = "Hilo tejido" | "Cuentas" | "Metal (por confirmar)";

export interface ProductVariant {
  sku: string;
  label: string;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  categoryId: CategoryId;
  /** Descripción del material tal como lo confirme la marca. */
  material: string;
  /** Agrupación usada por el filtro de material del catálogo. */
  materialType: MaterialType;
  /** Precio referencial en soles (S/). */
  price: number;
  images: string[];
  featured: boolean;
  active: boolean;
  /** Nombre del selector de variante: "Color de hilo", "Talla", "Dije", etc. */
  variantName?: string;
  variants: ProductVariant[];
  isNew?: boolean;
  /** Fecha ISO usada para ordenar por novedades. */
  createdAt: string;
  care?: string;
}

export interface CartItem {
  productId: string;
  sku: string;
  quantity: number;
}

export interface CartLine {
  item: CartItem;
  product: Product;
  variant: ProductVariant;
  unitPrice: number;
  lineTotal: number;
  /** Mensaje cuando el stock ya no alcanza o el producto se desactivó. */
  issue?: string;
}

export type OrderStatus =
  | "pendiente"
  | "confirmado"
  | "preparado"
  | "enviado"
  | "entregado"
  | "cancelado";

export interface OrderItem {
  productId: string;
  productName: string;
  variantLabel: string;
  quantity: number;
  unitPrice: number;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  district: string;
  channel: "WhatsApp" | "Instagram";
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
}

export type StockMovementType = "entrada" | "salida" | "ajuste";

export interface StockMovement {
  id: string;
  date: string;
  sku: string;
  productName: string;
  type: StockMovementType;
  /** Positivo suma stock, negativo descuenta. */
  quantity: number;
  note: string;
}

export interface Testimonial {
  id: string;
  name: string;
  text: string;
  product: string;
}

export interface Faq {
  question: string;
  answer: string;
}
