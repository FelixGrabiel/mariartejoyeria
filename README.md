# MariArte · Prototipo web de demostración

Tienda online **navegable y funcional** para MariArte | Joyería y Accesorios, hecha con **Next.js (App Router) + React + TypeScript + Tailwind CSS**. Funciona sin backend: el catálogo, los pedidos y el stock son **datos de ejemplo** y el carrito, los favoritos y los cambios del panel se guardan en el `localStorage` del navegador.

> ⚠️ **Prototipo de demostración.** Productos, precios, SKU, stock, pedidos y testimonios son ficticios. No hay cobros, ni autenticación, ni envío de datos a ningún servidor.

---

## Estado actual: conectado a Supabase

Con las variables de entorno definidas, la tienda lee el catálogo de Supabase, registra los pedidos (función `create_order`, que valida precio y stock en el servidor), descuenta stock al confirmar un pedido y permite subir fotos a Storage. El panel `/admin-demo` exige iniciar sesión con un usuario que esté en `staff_profiles`. Sin las variables, funciona en modo demostración con `localStorage`.

Crea `.env.local` (no se sube a git):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu clave publishable>
```

---

## 1. Requisitos

- **Node.js 18.18 o superior** (recomendado Node 20 o 22 LTS). Comprueba con `node -v`.
- Conexión a internet la primera vez (para `npm install` y para descargar las fuentes Cormorant Garamond e Inter de Google Fonts al compilar).

## 2. Instalación y ejecución

```bash
# 1. Entra a la carpeta del proyecto
cd mariarte-web

# 2. Instala dependencias
npm install

# 3. Arranca el servidor de desarrollo
npm run dev
```

Abre **http://localhost:3000** en tu navegador.

Para probar la versión optimizada:

```bash
npm run build   # compila y revisa TypeScript
npm start       # sirve la versión compilada en http://localhost:3000
```

Si `npm run build` muestra algún error de TypeScript, ejecuta `npm run typecheck` para ver el detalle.

## 3. Rutas

| Ruta | Qué incluye |
|---|---|
| `/` | Hero, categorías, destacados, regalos, beneficios, historia, testimonios de ejemplo, CTA WhatsApp/Instagram |
| `/catalogo` | Búsqueda instantánea, filtros (categoría, material, precio, disponibilidad), orden, vista rápida, estado vacío. Acepta `?categoria=pulseras` y `?q=ojo` |
| `/producto/[slug]` | Galería, variantes, cantidad validada contra stock, carrito, WhatsApp, favoritos, cuidados/empaque/entrega, relacionados |
| `/carrito` | Cantidades, eliminar, dedicatoria, subtotal, «Envío por confirmar», vista previa del mensaje y **Pedir por WhatsApp** |
| `/favoritos` | Joyas guardadas (persisten al recargar) |
| `/nosotros` | Historia y valores (texto editable de demostración) |
| `/contacto` | WhatsApp, Instagram, formulario demo con validación, preguntas frecuentes |
| `/politicas` | Términos, privacidad, envíos, cambios, Libro de Reclamaciones — **provisional** |
| `/admin-demo` | Panel demo: resumen, CRUD de productos y variantes, pedidos con cambio de estado, movimientos de stock, **Restablecer datos de demo** |

## 4. Cómo probar los criterios de aceptación

1. Inicio → **Ver colección** → abre una joya.
2. En `/catalogo` escribe «ojo» o marca *Sets*; prueba *Ocultar agotados*.
3. Agrega dos joyas distintas (una con variante), ve a `/carrito`, cambia cantidades y revisa el subtotal.
4. Recarga la página: el carrito y los favoritos siguen ahí.
5. Abre «Ver mensaje que se enviará» y pulsa **Pedir por WhatsApp**: se abre `wa.me` con el pedido codificado. **No se envía solo**; tú lo envías desde WhatsApp.
6. Ve a `/admin-demo` → Productos → edita el precio o el stock de una joya → vuelve a la tienda y verás el cambio (también en el carrito, que avisa si el stock ya no alcanza).
7. Prueba en el teléfono (o con las herramientas de desarrollador en 360 px / 768 px / 1440 px).

## 5. Estructura

```text
mariarte-web/
├─ app/                 Rutas (App Router), layout, estilos globales, favicon
├─ components/
│  ├─ layout/           Header, MobileNav, Footer, TopBar, SiteShell, Logo
│  ├─ home/             HeroSection, CategoryCard, secciones del inicio
│  ├─ product/          ProductCard, ProductGrid, ProductGallery, VariantSelector, QuantitySelector, ProductDetail…
│  ├─ catalog/          SearchBar, FilterPanel, SortSelect, CatalogView
│  ├─ cart/             CartItem, CartSummary, WhatsAppCheckoutButton, CartView
│  ├─ admin/            AdminSidebar, StatCard, ProductForm, OrdersTable, ProductsTable, InventoryPanel
│  ├─ contact/          ContactForm
│  └─ ui/               Toast, EmptyState, Badge, Modal, iconos, ProductImage, avisos demo
├─ context/             StoreContext (catálogo, carrito, favoritos, admin) y ToastContext
├─ data/                site.ts, products.ts, categories.ts, orders.ts, content.ts  ← datos editables
├─ lib/                 catálogo (filtros/orden), WhatsApp, formato, localStorage
├─ types/               Tipos TypeScript del dominio
└─ public/images/       Fotografías
```

Los iconos están incluidos en `components/ui/icons.tsx` (trazos estilo Lucide) para no añadir dependencias. Si prefieres `lucide-react`, instálalo y cambia los imports: los nombres coinciden.

## 6. Reemplazar datos de demostración por los reales

| Qué | Dónde |
|---|---|
| **WhatsApp, Instagram, frase de marca, aviso de barra superior** | `data/site.ts` (`whatsappNumber` sin `+` ni espacios, p. ej. `51981360835`) |
| **Productos, precios, materiales, variantes, SKU y stock** | `data/products.ts`. Cada producto: `id`, `slug`, `name`, `description`, `categoryId`, `material`, `materialType`, `price`, `images`, `featured`, `active`, `variants[]` (`sku`, `label`, `stock`) |
| **Categorías y sus fotos de portada** | `data/categories.ts` (si una no tiene `image`, se muestra «Categoría de muestra») |
| **Testimonios y preguntas frecuentes** | `data/content.ts` — usa solo reseñas reales y con permiso |
| **Historia de la marca** | `app/nosotros/page.tsx` y `StoryTeaser` en `components/home/HomeSections.tsx` |
| **Políticas** | `app/politicas/page.tsx` — sustituir por textos aprobados |
| **Logo** | `components/layout/Logo.tsx` (hoy es un logotipo en texto provisional) |
| **Fotos** | Copia los archivos a `public/images/` y usa la ruta `/images/archivo.jpg` en `products.ts`. Las fotos actuales son recortes de capturas de Instagram en baja resolución: reemplázalas por originales (ideal ≥ 1200 px, proporción 4:5). |
| **Pedidos de ejemplo y movimientos** | `data/orders.ts` |

**Importante:** después de editar los archivos de `data/`, pulsa **Restablecer datos de demo** en `/admin-demo` (o borra el `localStorage` del sitio), porque el navegador conserva la copia anterior del catálogo.

## 7. Cómo evolucionar a una tienda real con Supabase (no implementado)

Esta entrega **no** se conecta a Supabase ni procesa pagos. Pasos recomendados para la siguiente fase:

1. **Proyecto Supabase** independiente con PostgreSQL, Auth y Storage. Variables en `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y, solo en el servidor, `SUPABASE_SERVICE_ROLE_KEY` (nunca en el cliente).
2. **Tablas sugeridas:** `categories`, `products`, `product_variants` (sku, label, stock), `product_images`, `inventory_movements`, `customers`, `orders`, `order_items`, `payments`, `staff_profiles` (rol `admin`). Los tipos de `types/index.ts` sirven como punto de partida.
3. **Seguridad:** activar **RLS** en todas las tablas; lectura pública solo de productos `active = true`; escritura solo para `staff_profiles.role = 'admin'`. Autenticación real del panel con Supabase Auth (no la simulación actual).
4. **Lectura del catálogo:** en `app/producto/[slug]/page.tsx` y `app/catalogo/page.tsx` consultar Supabase en el servidor y pasar los datos a los componentes. `StoreContext` puede seguir manejando solo carrito y favoritos.
5. **Acciones del panel:** sustituir `saveProduct`, `adjustStock`, `updateOrderStatus` (en `context/StoreContext.tsx`) por **Server Actions** que validen precio y stock en el servidor y registren cada movimiento en `inventory_movements` dentro de una transacción.
6. **Imágenes:** subir a un bucket de Supabase Storage y agregar su dominio en `images.remotePatterns` de `next.config.ts`.
7. **Pedidos:** fase 1 por WhatsApp (actual). Si se registran en base de datos, recalcular totales en el servidor; nunca confiar en el precio enviado por el navegador.
8. **Pagos (fase 2):** integrar un proveedor (p. ej. Culqi, Mercado Pago, Niubiz o Izipay, que ofrecen tarjetas y Yape) previa contratación. Confirmar pagos **solo** por webhook verificado en el servidor, con idempotencia; no mostrar «pago aprobado» desde el cliente.
9. **Antes de publicar:** políticas aprobadas, Libro de Reclamaciones virtual, datos del titular (RUC), dominio propio, `robots` habilitado en `app/layout.tsx` y hosting apto para uso comercial.

## 8. Pendientes comerciales por confirmar

- Fotografías originales y logotipo auténtico.
- Nombres, descripciones, materiales exactos, precios y stock reales.
- Confirmar número de WhatsApp y horario de atención.
- Costos, zonas y plazos de envío; política de cambios; medios de pago.
- Reseñas reales con autorización.
- Textos legales y Libro de Reclamaciones.
