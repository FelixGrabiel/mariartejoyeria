"use client";

/**
 * Estado central de la demo: catálogo (editable desde /admin-demo), carrito,
 * favoritos, pedidos y movimientos de stock. Todo vive en localStorage.
 *
 * MIGRACIÓN A SUPABASE: sustituye la carga inicial (`initialProducts`, etc.)
 * por consultas a Supabase y las acciones de admin por Server Actions que
 * validen precio/stock en el servidor. La interfaz `StoreContextValue` puede
 * mantenerse para no tocar los componentes.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { initialOrders, initialMovements } from "@/data/orders";
import { initialProducts } from "@/data/products";
import { todayISO } from "@/lib/format";
import {
  checkIsAdmin,
  dbDeletePackaging,
  dbDeleteProduct,
  dbDeleteTheme,
  dbSaveDedicationMax,
  dbSavePackaging,
  dbSaveProduct,
  dbSaveTheme,
  dbSetProductActive,
  dbSetStock,
  dbUpdateOrderStatus,
  fetchAdminData,
  fetchCatalog,
  fetchStoreConfig,
  supabase,
} from "@/lib/supabase";
import { STORAGE_KEYS, readStorage, removeStorage, writeStorage } from "@/lib/storage";
import { DEFAULT_DEDICATION_MAX, sameLine, unitsForSku } from "@/lib/gift";
import type {
  CartItem,
  CartLine,
  GiftOptions,
  MeaningTheme,
  Order,
  OrderStatus,
  PackagingOption,
  Product,
  StockMovement,
  StockMovementType,
} from "@/types";
import { useToast } from "./ToastContext";

interface ActionResult {
  ok: boolean;
  message: string;
}

interface StoreContextValue {
  hydrated: boolean;
  /** Todos los productos (incluye inactivos, para el panel). */
  products: Product[];
  /** Solo productos activos, para la tienda. */
  storeProducts: Product[];
  getProductBySlug: (slug: string) => Product | undefined;

  cart: CartItem[];
  cartLines: CartLine[];
  cartCount: number;
  cartSubtotal: number;
  addToCart: (productId: string, sku: string, quantity: number, gift?: GiftOptions) => ActionResult;
  updateQuantity: (productId: string, sku: string, quantity: number, gift?: GiftOptions) => void;
  removeFromCart: (productId: string, sku: string, gift?: GiftOptions) => void;

  /** Empaques y temas: con sesión de administrador incluyen los inactivos. */
  packaging: PackagingOption[];
  themes: MeaningTheme[];
  activePackaging: PackagingOption[];
  activeThemes: MeaningTheme[];
  dedicationMax: number;
  savePackaging: (option: PackagingOption) => void;
  deletePackaging: (id: string) => void;
  saveTheme: (theme: MeaningTheme) => void;
  deleteTheme: (id: string) => void;
  saveDedicationMax: (value: number) => void;
  clearCart: () => void;
  giftNote: string;
  setGiftNote: (note: string) => void;

  favorites: string[];
  isFavorite: (productId: string) => boolean;
  toggleFavorite: (productId: string) => void;

  orders: Order[];
  movements: StockMovement[];
  saveProduct: (product: Product, isNew: boolean) => void;
  deleteProduct: (productId: string) => void;
  toggleProductActive: (productId: string) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  adjustStock: (productId: string, sku: string, type: StockMovementType, quantity: number, note: string) => ActionResult;
  resetDemo: () => void;

  /** true si hay Supabase configurado: el panel exige iniciar sesión. */
  authRequired: boolean;
  authChecked: boolean;
  isAdmin: boolean;
  adminEmail: string | null;
  signIn: (email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
}

const StoreContext = createContext<StoreContextValue | null>(null);

function movementId(): string {
  return `m-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { showToast } = useToast();
  const [hydrated, setHydrated] = useState(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [giftNote, setGiftNote] = useState("");
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [movements, setMovements] = useState<StockMovement[]>(initialMovements);
  const [authChecked, setAuthChecked] = useState(!supabase);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const authRequired = !!supabase;
  const [packaging, setPackaging] = useState<PackagingOption[]>([]);
  const [themes, setThemes] = useState<MeaningTheme[]>([]);
  const [dedicationMax, setDedicationMax] = useState(DEFAULT_DEDICATION_MAX);
  const [configLoaded, setConfigLoaded] = useState(!supabase);

  const loadConfig = useCallback(async () => {
    const config = await fetchStoreConfig();
    if (!config) return;
    setPackaging(config.packaging);
    setThemes(config.themes);
    setDedicationMax(config.dedicationMax);
    setConfigLoaded(true);
  }, []);

  // Carga inicial desde localStorage (solo en el navegador).
  useEffect(() => {
    setProducts(readStorage(STORAGE_KEYS.products, initialProducts));
    setCart(readStorage<CartItem[]>(STORAGE_KEYS.cart, []));
    setFavorites(readStorage<string[]>(STORAGE_KEYS.favorites, []));
    setGiftNote(readStorage(STORAGE_KEYS.giftNote, ""));
    setOrders(readStorage(STORAGE_KEYS.orders, initialOrders));
    setMovements(readStorage(STORAGE_KEYS.movements, initialMovements));
    setHydrated(true);
    // Si hay Supabase configurado, el catálogo (y su stock) viene de la base de datos.
    fetchCatalog().then((remote) => {
      if (remote && remote.length) setProducts(remote);
    });
    loadConfig();
  }, [loadConfig]);

  // Sesión de administrador: al iniciar sesión se cargan productos (incluye ocultos), pedidos y movimientos de la base.
  const loadAdminData = useCallback(async () => {
    const data = await fetchAdminData();
    if (!data) {
      showToast("No se pudieron cargar los datos del panel.", { tone: "error" });
      return;
    }
    setProducts(data.products);
    setOrders(data.orders);
    setMovements(data.movements);
    loadConfig();
  }, [showToast, loadConfig]);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    async function apply(userId: string | undefined, email: string | undefined) {
      const admin = userId ? await checkIsAdmin(userId) : false;
      if (cancelled) return;
      setIsAdmin(admin);
      setAdminEmail(admin ? (email ?? null) : null);
      setAuthChecked(true);
      if (admin) loadAdminData();
    }
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user.id, data.session?.user.email));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      // Diferido: evita llamar a Supabase dentro del callback de auth.
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") setTimeout(() => apply(session?.user.id, session?.user.email), 0);
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, [loadAdminData]);

  const signIn = useCallback(async (email: string, password: string): Promise<string | null> => {
    if (!supabase) return "Supabase no está configurado.";
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return "Correo o contraseña incorrectos.";
    if (!(await checkIsAdmin(data.user.id))) {
      await supabase.auth.signOut();
      return "Esta cuenta no tiene permisos de administrador.";
    }
    return null;
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setIsAdmin(false);
    setAdminEmail(null);
    const remote = await fetchCatalog();
    if (remote) setProducts(remote);
    setOrders(initialOrders);
    setMovements(initialMovements);
    loadConfig();
  }, [loadConfig]);

  // Ejecuta una escritura en la base; si falla, avisa y recarga el estado real.
  const persist = useCallback(
    (write: Promise<string | null>, reloadOnSuccess = false) => {
      write.then((error) => {
        if (error) showToast(`No se pudo guardar en la base de datos: ${error}`, { tone: "error" });
        if (error || reloadOnSuccess) loadAdminData();
      });
    },
    [showToast, loadAdminData],
  );

  // Sincroniza cambios hechos en otra pestaña (p. ej. admin abierto aparte).
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (!event.key) return;
      if (event.key === STORAGE_KEYS.products) setProducts(readStorage(STORAGE_KEYS.products, initialProducts));
      if (event.key === STORAGE_KEYS.cart) setCart(readStorage<CartItem[]>(STORAGE_KEYS.cart, []));
      if (event.key === STORAGE_KEYS.favorites) setFavorites(readStorage<string[]>(STORAGE_KEYS.favorites, []));
      if (event.key === STORAGE_KEYS.orders) setOrders(readStorage(STORAGE_KEYS.orders, initialOrders));
      if (event.key === STORAGE_KEYS.movements) setMovements(readStorage(STORAGE_KEYS.movements, initialMovements));
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  useEffect(() => {
    if (hydrated && !authRequired) writeStorage(STORAGE_KEYS.products, products);
  }, [products, hydrated, authRequired]);
  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_KEYS.cart, cart);
  }, [cart, hydrated]);
  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_KEYS.favorites, favorites);
  }, [favorites, hydrated]);
  useEffect(() => {
    if (hydrated) writeStorage(STORAGE_KEYS.giftNote, giftNote);
  }, [giftNote, hydrated]);
  useEffect(() => {
    if (hydrated && !authRequired) writeStorage(STORAGE_KEYS.orders, orders);
  }, [orders, hydrated, authRequired]);
  useEffect(() => {
    if (hydrated && !authRequired) writeStorage(STORAGE_KEYS.movements, movements);
  }, [movements, hydrated, authRequired]);

  const storeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const getProductBySlug = useCallback(
    (slug: string) => products.find((p) => p.slug === slug),
    [products],
  );

  const cartLines = useMemo<CartLine[]>(() => {
    const lines: CartLine[] = [];
    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.sku === item.sku);
      if (!product || !variant) continue;
      const pack = item.gift?.packagingId ? packaging.find((o) => o.id === item.gift?.packagingId && o.active) : undefined;
      const packUnit = pack?.price ?? 0;
      const totalUnits = unitsForSku(cart, item.sku);
      let issue: string | undefined;
      if (!product.active) issue = "Esta joya ya no está disponible en la tienda.";
      else if (variant.stock === 0) issue = "Esta opción se agotó.";
      else if (totalUnits > variant.stock) issue = `Solo quedan ${variant.stock} unidad(es) de esta opción en total. Ajusta las cantidades.`;
      else if (item.gift && !product.giftEnabled) issue = "Esta joya ya no admite personalización de regalo.";
      else if (item.gift?.packagingId && configLoaded && !pack) issue = "El empaque elegido ya no está disponible. Quita la línea y vuelve a armar el regalo.";
      lines.push({
        item,
        product,
        variant,
        unitPrice: product.price,
        lineTotal: (product.price + packUnit) * item.quantity,
        packaging: pack,
        issue,
      });
    }
    return lines;
  }, [cart, products, packaging, configLoaded]);

  const cartCount = useMemo(() => cart.reduce((sum, i) => sum + i.quantity, 0), [cart]);
  const cartSubtotal = useMemo(
    () => cartLines.filter((l) => !l.issue).reduce((sum, l) => sum + l.lineTotal, 0),
    [cartLines],
  );

  const addToCart = useCallback(
    (productId: string, sku: string, quantity: number, gift?: GiftOptions): ActionResult => {
      const product = products.find((p) => p.id === productId);
      const variant = product?.variants.find((v) => v.sku === sku);
      if (!product || !variant || !product.active) {
        return { ok: false, message: "Esta joya no está disponible." };
      }
      if (variant.stock <= 0) {
        return { ok: false, message: "Esta opción está agotada." };
      }
      if (gift && !product.giftEnabled) {
        return { ok: false, message: "Esta joya no admite personalización de regalo." };
      }
      const inCart = unitsForSku(cart, sku);
      if (inCart + quantity > variant.stock) {
        const left = Math.max(0, variant.stock - inCart);
        return {
          ok: false,
          message: left
            ? `Solo puedes agregar ${left} unidad(es) más de esta opción.`
            : "Ya tienes en el carrito todo el stock disponible de esta opción.",
        };
      }
      const target = { productId, sku, gift };
      setCart((list) => {
        const exists = list.some((i) => sameLine(i, target));
        return exists
          ? list.map((i) => (sameLine(i, target) ? { ...i, quantity: i.quantity + quantity } : i))
          : [...list, { productId, sku, quantity, ...(gift ? { gift } : {}) }];
      });
      return { ok: true, message: gift ? `Regalo con ${product.name} agregado al carrito.` : `${product.name} se agregó al carrito.` };
    },
    [cart, products],
  );

  const updateQuantity = useCallback(
    (productId: string, sku: string, quantity: number, gift?: GiftOptions) => {
      const variant = products.find((p) => p.id === productId)?.variants.find((v) => v.sku === sku);
      const target = { productId, sku, gift };
      const others = cart.filter((i) => i.sku === sku && !sameLine(i, target)).reduce((sum, i) => sum + i.quantity, 0);
      const max = Math.max(1, (variant?.stock ?? 1) - others);
      const next = Math.min(Math.max(1, Math.round(quantity)), max);
      setCart((list) => list.map((i) => (sameLine(i, target) ? { ...i, quantity: next } : i)));
    },
    [products, cart],
  );

  const removeFromCart = useCallback((productId: string, sku: string, gift?: GiftOptions) => {
    const target = { productId, sku, gift };
    setCart((list) => list.filter((i) => !sameLine(i, target)));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  const toggleFavorite = useCallback(
    (productId: string) => {
      const wasFavorite = favorites.includes(productId);
      setFavorites((list) => (wasFavorite ? list.filter((id) => id !== productId) : [...list, productId]));
      showToast(wasFavorite ? "Quitado de favoritos." : "Guardado en favoritos.", {
        tone: "info",
        action: wasFavorite ? undefined : { label: "Ver favoritos", href: "/favoritos" },
      });
    },
    [favorites, showToast],
  );

  // ---------- Acciones del panel demo ----------

  const saveProduct = useCallback(
    (product: Product, isNew: boolean) => {
      const previous = products.find((p) => p.id === product.id);
      const newMovements: StockMovement[] = [];
      for (const variant of product.variants) {
        const before = previous?.variants.find((v) => v.sku === variant.sku)?.stock ?? 0;
        const diff = variant.stock - before;
        if (diff !== 0) {
          newMovements.push({
            id: movementId(),
            date: todayISO(),
            sku: variant.sku,
            productName: product.name,
            type: isNew ? "entrada" : "ajuste",
            quantity: diff,
            note: isNew ? "Stock inicial (producto nuevo)" : "Edición desde el panel",
          });
        }
      }
      setProducts((list) => (isNew ? [product, ...list] : list.map((p) => (p.id === product.id ? product : p))));
      if (newMovements.length) setMovements((list) => [...newMovements, ...list]);
      if (isAdmin) persist(dbSaveProduct(product, newMovements));
    },
    [products, isAdmin, persist],
  );

  const deleteProduct = useCallback(
    (productId: string) => {
      setProducts((list) => list.filter((p) => p.id !== productId));
      setCart((list) => list.filter((i) => i.productId !== productId));
      setFavorites((list) => list.filter((id) => id !== productId));
      if (isAdmin) persist(dbDeleteProduct(productId));
    },
    [isAdmin, persist],
  );

  const toggleProductActive = useCallback(
    (productId: string) => {
      const current = products.find((p) => p.id === productId);
      setProducts((list) => list.map((p) => (p.id === productId ? { ...p, active: !p.active } : p)));
      if (isAdmin && current) persist(dbSetProductActive(productId, !current.active));
    },
    [products, isAdmin, persist],
  );

  const updateOrderStatus = useCallback(
    (orderId: string, status: OrderStatus) => {
      setOrders((list) => list.map((o) => (o.id === orderId ? { ...o, status } : o)));
      if (isAdmin) persist(dbUpdateOrderStatus(orderId, status), true);
    },
    [isAdmin, persist],
  );

  const adjustStock = useCallback(
    (productId: string, sku: string, type: StockMovementType, quantity: number, note: string): ActionResult => {
      const product = products.find((p) => p.id === productId);
      const variant = product?.variants.find((v) => v.sku === sku);
      if (!product || !variant) return { ok: false, message: "Selecciona un producto y una variante." };
      if (!Number.isInteger(quantity) || quantity === 0) {
        return { ok: false, message: "Ingresa una cantidad entera distinta de cero." };
      }
      const delta = type === "salida" ? -Math.abs(quantity) : type === "entrada" ? Math.abs(quantity) : quantity;
      const nextStock = variant.stock + delta;
      if (nextStock < 0) {
        return { ok: false, message: `El stock no puede quedar negativo (actual: ${variant.stock}).` };
      }
      setProducts((list) =>
        list.map((p) =>
          p.id === productId
            ? { ...p, variants: p.variants.map((v) => (v.sku === sku ? { ...v, stock: nextStock } : v)) }
            : p,
        ),
      );
      const movement: StockMovement = {
        id: movementId(),
        date: todayISO(),
        sku,
        productName: product.name,
        type,
        quantity: delta,
        note: note.trim() || "Movimiento manual",
      };
      setMovements((list) => [movement, ...list]);
      if (isAdmin) persist(dbSetStock(sku, nextStock, movement));
      return { ok: true, message: `Stock actualizado: ${variant.label} queda con ${nextStock} unidad(es).` };
    },
    [products, isAdmin, persist],
  );

  const savePackaging = useCallback(
    (option: PackagingOption) => {
      setPackaging((list) => (list.some((o) => o.id === option.id) ? list.map((o) => (o.id === option.id ? option : o)) : [...list, option]));
      if (isAdmin) persist(dbSavePackaging(option), true);
    },
    [isAdmin, persist],
  );
  const deletePackaging = useCallback(
    (id: string) => {
      setPackaging((list) => list.filter((o) => o.id !== id));
      if (isAdmin) persist(dbDeletePackaging(id), true);
    },
    [isAdmin, persist],
  );
  const saveTheme = useCallback(
    (theme: MeaningTheme) => {
      setThemes((list) => (list.some((t) => t.id === theme.id) ? list.map((t) => (t.id === theme.id ? theme : t)) : [...list, theme]));
      if (isAdmin) persist(dbSaveTheme(theme), true);
    },
    [isAdmin, persist],
  );
  const deleteTheme = useCallback(
    (id: string) => {
      setThemes((list) => list.filter((t) => t.id !== id));
      if (isAdmin) persist(dbDeleteTheme(id), true);
    },
    [isAdmin, persist],
  );
  const saveDedicationMax = useCallback(
    (value: number) => {
      setDedicationMax(value);
      if (isAdmin) persist(dbSaveDedicationMax(value), true);
    },
    [isAdmin, persist],
  );

  const activePackaging = useMemo(() => packaging.filter((o) => o.active).sort((a, b) => a.sortOrder - b.sortOrder), [packaging]);
  const activeThemes = useMemo(() => themes.filter((t) => t.active).sort((a, b) => a.sortOrder - b.sortOrder), [themes]);

  const resetDemo = useCallback(() => {
    for (const key of Object.values(STORAGE_KEYS)) removeStorage(key);
    setProducts(initialProducts);
    setOrders(initialOrders);
    setMovements(initialMovements);
    setCart([]);
    setFavorites([]);
    setGiftNote("");
  }, []);

  const value: StoreContextValue = {
    hydrated,
    products,
    storeProducts,
    getProductBySlug,
    cart,
    cartLines,
    cartCount,
    cartSubtotal,
    addToCart,
    updateQuantity,
    removeFromCart,
    packaging,
    themes,
    activePackaging,
    activeThemes,
    dedicationMax,
    savePackaging,
    deletePackaging,
    saveTheme,
    deleteTheme,
    saveDedicationMax,
    clearCart,
    giftNote,
    setGiftNote,
    favorites,
    isFavorite,
    toggleFavorite,
    orders,
    movements,
    saveProduct,
    deleteProduct,
    toggleProductActive,
    updateOrderStatus,
    adjustStock,
    resetDemo,
    authRequired,
    authChecked,
    isAdmin,
    adminEmail,
    signIn,
    signOut,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}
