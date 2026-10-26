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
  useRef,
  useState,
  type ReactNode,
} from "react";
import { initialOrders, initialMovements } from "@/data/orders";
import { initialProducts } from "@/data/products";
import { todayISO } from "@/lib/format";
import {
  checkIsAdmin,
  dbDeleteCombo,
  dbDeletePackaging,
  dbDeleteProduct,
  dbDeleteTheme,
  dbSaveCombo,
  dbSaveDedicationMax,
  dbSavePackaging,
  dbSaveProduct,
  dbSaveTheme,
  dbSetProductActive,
  dbSetStock,
  dbUpdateOrderStatus,
  fetchAdminData,
  fetchCatalog,
  fetchCombos,
  fetchStoreConfig,
  supabase,
} from "@/lib/supabase";
import { STORAGE_KEYS, readStorage, removeStorage, writeStorage } from "@/lib/storage";
import { comboTotals, discountedPrice, isComboLive } from "@/lib/combo";
import { DEFAULT_DEDICATION_MAX, sameLine, unitsForSku } from "@/lib/gift";
import type {
  CartItem,
  CartLine,
  Combo,
  ComboCartItem,
  ComboLine,
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

  /** Combos: con sesión de administrador incluyen pausados y programados; `liveCombos` solo los vigentes. */
  combos: Combo[];
  liveCombos: Combo[];
  comboCart: ComboCartItem[];
  comboLines: ComboLine[];
  addComboToCart: (comboId: string, picks: string[], quantity: number) => ActionResult;
  updateComboQuantity: (index: number, quantity: number) => void;
  removeCombo: (index: number) => void;
  saveCombo: (combo: Combo) => void;
  deleteCombo: (id: string) => void;

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

const COMBO_CART_KEY = "mariarte.v1.comboCart";

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
  const [combos, setCombos] = useState<Combo[]>([]);
  const [comboCart, setComboCart] = useState<ComboCartItem[]>([]);

  const loadConfig = useCallback(async () => {
    const config = await fetchStoreConfig();
    if (!config) return;
    setPackaging(config.packaging);
    setThemes(config.themes);
    setDedicationMax(config.dedicationMax);
    setConfigLoaded(true);
    const remoteCombos = await fetchCombos();
    if (remoteCombos) setCombos(remoteCombos);
  }, []);

  // Carga inicial desde localStorage (solo en el navegador).
  useEffect(() => {
    setProducts(readStorage(STORAGE_KEYS.products, initialProducts));
    setCart(readStorage<CartItem[]>(STORAGE_KEYS.cart, []));
    setFavorites(readStorage<string[]>(STORAGE_KEYS.favorites, []));
    setGiftNote(readStorage(STORAGE_KEYS.giftNote, ""));
    setComboCart(readStorage<ComboCartItem[]>(COMBO_CART_KEY, []));
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

  // Mientras el administrador tiene el panel abierto, se revisan los pedidos cada minuto.
  const knownPending = useRef<number | null>(null);
  useEffect(() => {
    if (!isAdmin) {
      knownPending.current = null;
      return;
    }
    const timer = setInterval(async () => {
      const data = await fetchAdminData();
      if (!data) return;
      setOrders(data.orders);
      setMovements(data.movements);
      setProducts(data.products);
    }, 60_000);
    return () => clearInterval(timer);
  }, [isAdmin]);

  useEffect(() => {
    if (!isAdmin) return;
    const pending = orders.filter((o) => o.status === "pendiente").length;
    if (knownPending.current !== null && pending > knownPending.current) {
      showToast(`Llegó ${pending - knownPending.current === 1 ? "un pedido nuevo" : `${pending - knownPending.current} pedidos nuevos`}.`, { tone: "info" });
    }
    knownPending.current = pending;
    document.title = pending > 0 ? `(${pending}) Panel MariArte` : "Panel MariArte";
  }, [orders, isAdmin, showToast]);

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
    if (hydrated) writeStorage(COMBO_CART_KEY, comboCart);
  }, [comboCart, hydrated]);
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

  const liveCombos = useMemo(() => combos.filter((c) => isComboLive(c)), [combos]);

  /** Unidades de un SKU ya reservadas en el carrito (productos sueltos + componentes de combos). */
  const unitsInCart = useCallback(
    (sku: string, skipCombo = -1) => {
      let total = unitsForSku(cart, sku);
      comboCart.forEach((ci, idx) => {
        if (idx === skipCombo) return;
        const combo = combos.find((c) => c.id === ci.comboId);
        combo?.items.forEach((it, i) => {
          if ((it.sku ?? ci.picks[i]) === sku) total += it.quantity * ci.quantity;
        });
      });
      return total;
    },
    [cart, comboCart, combos],
  );

  const comboLines = useMemo<ComboLine[]>(() => {
    const lines: ComboLine[] = [];
    comboCart.forEach((item) => {
      const combo = combos.find((c) => c.id === item.comboId);
      if (!combo) {
        if (configLoaded) {
          // El combo ya no existe o venció: se muestra como línea con aviso para que el cliente la quite.
          lines.push({
            item,
            combo: { id: item.comboId, name: "Combo no disponible", description: "", discountPercent: 0, active: false, maxPerOrder: 1, sortOrder: 0, items: [] },
            components: [],
            regular: 0,
            total: 0,
            savings: 0,
            issue: "Este combo ya no está disponible.",
          });
        }
        return;
      }
      let issue: string | undefined;
      if (!isComboLive(combo)) issue = "Este combo ya no está vigente.";
      else if (item.quantity > combo.maxPerOrder) issue = `Máximo ${combo.maxPerOrder} por pedido.`;
      const components: ComboLine["components"] = [];
      combo.items.forEach((it, i) => {
        const sku = it.sku ?? item.picks[i];
        const product = products.find((p) => p.id === it.productId);
        const variant = product?.variants.find((v) => v.sku === sku);
        if (!product || !variant) {
          issue = issue ?? "Falta elegir una opción o un producto del combo ya no existe.";
          return;
        }
        if (!product.active) issue = issue ?? `${product.name} ya no está disponible.`;
        else if (variant.stock <= 0) issue = issue ?? `${product.name} (${variant.label}) se agotó.`;
        else if (unitsInCart(sku) > variant.stock) issue = issue ?? `Solo quedan ${variant.stock} unidad(es) de ${product.name} (${variant.label}).`;
        components.push({ product, variant, quantity: it.quantity, unitPrice: discountedPrice(product.price, combo.discountPercent) });
      });
      const totals = comboTotals(components.map((c) => ({ price: c.product.price, quantity: c.quantity })), combo.discountPercent);
      lines.push({
        item,
        combo,
        components,
        regular: totals.regular * item.quantity,
        total: Math.round(totals.total * item.quantity * 100) / 100,
        savings: Math.round(totals.savings * item.quantity * 100) / 100,
        issue,
      });
    });
    return lines;
  }, [comboCart, combos, products, configLoaded, unitsInCart]);

  const cartLines = useMemo<CartLine[]>(() => {
    const lines: CartLine[] = [];
    for (const item of cart) {
      const product = products.find((p) => p.id === item.productId);
      const variant = product?.variants.find((v) => v.sku === item.sku);
      if (!product || !variant) continue;
      const pack = item.gift?.packagingId ? packaging.find((o) => o.id === item.gift?.packagingId && o.active) : undefined;
      const packUnit = pack?.price ?? 0;
      const totalUnits = unitsInCart(item.sku);
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
  }, [cart, products, packaging, configLoaded, unitsInCart]);

  const cartCount = useMemo(
    () => cart.reduce((sum, i) => sum + i.quantity, 0) + comboCart.reduce((sum, i) => sum + i.quantity, 0),
    [cart, comboCart],
  );
  const cartSubtotal = useMemo(
    () =>
      Math.round(
        (cartLines.filter((l) => !l.issue).reduce((sum, l) => sum + l.lineTotal, 0) +
          comboLines.filter((l) => !l.issue).reduce((sum, l) => sum + l.total, 0)) *
          100,
      ) / 100,
    [cartLines, comboLines],
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
      const inCart = unitsInCart(sku);
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
    [cart, products, unitsInCart],
  );

  const updateQuantity = useCallback(
    (productId: string, sku: string, quantity: number, gift?: GiftOptions) => {
      const variant = products.find((p) => p.id === productId)?.variants.find((v) => v.sku === sku);
      const target = { productId, sku, gift };
      const own = cart.find((i) => sameLine(i, target))?.quantity ?? 0;
      const others = unitsInCart(sku) - own;
      const max = Math.max(1, (variant?.stock ?? 1) - others);
      const next = Math.min(Math.max(1, Math.round(quantity)), max);
      setCart((list) => list.map((i) => (sameLine(i, target) ? { ...i, quantity: next } : i)));
    },
    [products, cart, unitsInCart],
  );

  const removeFromCart = useCallback((productId: string, sku: string, gift?: GiftOptions) => {
    const target = { productId, sku, gift };
    setCart((list) => list.filter((i) => !sameLine(i, target)));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    setComboCart([]);
  }, []);

  const addComboToCart = useCallback(
    (comboId: string, picks: string[], quantity: number): ActionResult => {
      const combo = combos.find((c) => c.id === comboId);
      if (!combo || !isComboLive(combo)) return { ok: false, message: "Este combo no está disponible." };
      if (combo.items.length === 0) return { ok: false, message: "Este combo no tiene productos." };
      const needed = new Map<string, number>();
      for (let i = 0; i < combo.items.length; i += 1) {
        const it = combo.items[i];
        const sku = it.sku ?? picks[i];
        const product = products.find((p) => p.id === it.productId);
        const variant = product?.variants.find((v) => v.sku === sku);
        if (!sku) return { ok: false, message: "Elige una opción para cada producto del combo." };
        if (!product || !product.active || !variant) return { ok: false, message: "Un producto del combo no está disponible." };
        needed.set(sku, (needed.get(sku) ?? 0) + it.quantity * quantity);
      }
      for (const [sku, units] of needed) {
        const variant = products.flatMap((p) => p.variants).find((v) => v.sku === sku);
        if (!variant || unitsInCart(sku) + units > variant.stock) {
          return { ok: false, message: `No hay stock suficiente de «${variant?.label ?? sku}» para este combo.` };
        }
      }
      const resolved = combo.items.map((it, i) => it.sku ?? picks[i]);
      const same = (c: ComboCartItem) => c.comboId === comboId && c.picks.join("|") === resolved.join("|");
      const inCart = comboCart.find(same)?.quantity ?? 0;
      if (inCart + quantity > combo.maxPerOrder) {
        return { ok: false, message: `Máximo ${combo.maxPerOrder} de este combo por pedido.` };
      }
      setComboCart((list) =>
        list.some(same)
          ? list.map((c) => (same(c) ? { ...c, quantity: c.quantity + quantity } : c))
          : [...list, { comboId, picks: resolved, quantity }],
      );
      return { ok: true, message: `Combo «${combo.name}» agregado al carrito.` };
    },
    [combos, products, comboCart, unitsInCart],
  );

  const updateComboQuantity = useCallback(
    (index: number, quantity: number) => {
      const item = comboCart[index];
      const combo = item && combos.find((c) => c.id === item.comboId);
      if (!item || !combo) return;
      let max = combo.maxPerOrder;
      combo.items.forEach((it, i) => {
        const sku = it.sku ?? item.picks[i];
        const variant = products.flatMap((p) => p.variants).find((v) => v.sku === sku);
        if (variant) max = Math.min(max, Math.floor((variant.stock - unitsInCart(sku, index)) / it.quantity));
      });
      const next = Math.min(Math.max(1, Math.round(quantity)), Math.max(1, max));
      setComboCart((list) => list.map((c, i) => (i === index ? { ...c, quantity: next } : c)));
    },
    [comboCart, combos, products, unitsInCart],
  );

  const removeCombo = useCallback((index: number) => setComboCart((list) => list.filter((_, i) => i !== index)), []);

  const saveCombo = useCallback(
    (combo: Combo) => {
      setCombos((list) => (list.some((c) => c.id === combo.id) ? list.map((c) => (c.id === combo.id ? combo : c)) : [...list, combo]));
      if (isAdmin) persist(dbSaveCombo(combo), true);
    },
    [isAdmin, persist],
  );
  const deleteCombo = useCallback(
    (id: string) => {
      setCombos((list) => list.filter((c) => c.id !== id));
      setComboCart((list) => list.filter((c) => c.comboId !== id));
      if (isAdmin) persist(dbDeleteCombo(id), true);
    },
    [isAdmin, persist],
  );

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
    setComboCart([]);
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
    combos,
    liveCombos,
    comboCart,
    comboLines,
    addComboToCart,
    updateComboQuantity,
    removeCombo,
    saveCombo,
    deleteCombo,
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
