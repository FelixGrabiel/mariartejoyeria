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
  /** Debajo o igual a este número se muestra la alerta de stock bajo (por defecto 2). */
  minStock?: number;
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
  /** Permite personalizar la joya como regalo (empaque, ocasión, dedicatoria). */
  giftEnabled?: boolean;
  /** Significado simbólico propio de la joya (texto editable por la administración). */
  meaning?: string;
  /** Temas de «Joyas con significado» a los que pertenece. */
  themeIds?: string[];
  /** Estilos para el asistente de recomendaciones: minimalista, delicado, llamativo, clasico. */
  styles?: string[];
}

export interface ComboItem {
  productId: string;
  /** Variante fija; si falta, el cliente elige. */
  sku?: string;
  quantity: number;
}

export interface Combo {
  id: string;
  name: string;
  description: string;
  /** Descuento entero (0 = sin promoción). */
  discountPercent: number;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
  maxPerOrder: number;
  sortOrder: number;
  items: ComboItem[];
}

/** Combo en el carrito: `picks` tiene un SKU por componente, en el orden de `combo.items`. */
export interface ComboCartItem {
  comboId: string;
  picks: string[];
  quantity: number;
}

export interface ComboLine {
  item: ComboCartItem;
  combo: Combo;
  components: { product: Product; variant: ProductVariant; quantity: number; unitPrice: number }[];
  regular: number;
  total: number;
  savings: number;
  issue?: string;
}

export interface MeaningTheme {
  id: string;
  name: string;
  description: string;
  active: boolean;
  sortOrder: number;
}

export interface PackagingOption {
  id: string;
  name: string;
  description: string;
  /** Costo adicional por regalo, en soles. 0 = sin cargo. */
  price: number;
  active: boolean;
  sortOrder: number;
}

/** Personalización de regalo elegida para una línea del carrito/pedido. */
export interface GiftOptions {
  occasion: string;
  packagingId?: string;
  dedication: string;
  meaningCard: boolean;
}

export interface CartItem {
  productId: string;
  sku: string;
  quantity: number;
  /** Si existe, esta línea es un regalo personalizado y no se mezcla con la misma joya sin personalizar. */
  gift?: GiftOptions;
}

export interface CartLine {
  item: CartItem;
  product: Product;
  variant: ProductVariant;
  unitPrice: number;
  lineTotal: number;
  /** Empaque elegido (si aún está disponible). */
  packaging?: PackagingOption;
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
  /** Personalización guardada al crear el pedido. */
  occasion?: string;
  packagingName?: string;
  packagingPrice?: number;
  dedication?: string;
  meaningCard?: boolean;
  /** Si la pieza forma parte de un combo: nombre y número de grupo dentro del pedido. */
  comboName?: string;
  comboGroup?: number;
}

export interface Order {
  id: string;
  code: string;
  customerName: string;
  customerPhone?: string;
  address?: string;
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

export interface RestockRequest {
  id: number;
  productId: string | null;
  sku?: string;
  productName: string;
  variantLabel?: string;
  customerName: string;
  customerPhone: string;
  note: string;
  status: "pendiente" | "atendido";
  createdAt: string;
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
