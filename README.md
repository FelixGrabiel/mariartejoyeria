# MariArte · Prototipo web de demostración

Tienda online **navegable y funcional** para MariArte | Joyería y Accesorios, hecha con **Next.js (App Router) + React + TypeScript + Tailwind CSS**. Funciona sin backend: el catálogo, los pedidos y el stock son **datos de ejemplo** y el carrito, los favoritos y los cambios del panel se guardan en el `localStorage` del navegador.

> ⚠️ **Prototipo de demostración.** Productos, precios, SKU, stock, pedidos y testimonios son ficticios. No hay cobros, ni autenticación, ni envío de datos a ningún servidor.

---

## Estado actual: conectado a Supabase

Con las variables de entorno definidas, la tienda lee el catálogo de Supabase, registra los pedidos (función `create_order`, que valida precio y stock en el servidor), descuenta stock al confirmar un pedido y permite subir fotos a Storage. El panel `/admin` (también funciona `/admin-demo`) exige iniciar sesión con un usuario que esté en `staff_profiles`. Sin las variables, funciona en modo demostración con `localStorage`.

Crea `.env.local` (no se sube a git):

```bash
NEXT_PUBLIC_SUPABASE_URL=https://<tu-proyecto>.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<tu clave publishable>
```

### Mejoras V2 · Fase A (hecha)

| Qué | Dónde |
|---|---|
| **Arma tu regalo** (joya, ocasión, empaque, dedicatoria, resumen) | `/regalo`, `components/gift/GiftBuilder.tsx`; también desde la ficha («Armar como regalo»), el menú, el pie y la portada |
| **Personalización en el carrito, pedido y WhatsApp** | `lib/gift.ts`, `context/StoreContext.tsx`, `lib/whatsapp.ts`, función SQL `create_order` (valida empaque, límite de dedicatoria, `gift_enabled` y stock total por SKU) |
| **Joyas con significado** (temas editables, filtro `?tema=`, bloque en portada y ficha) | `components/home/MeaningSection.tsx`, `components/catalog/*`, tablas `meaning_themes` y `product_themes` |
| **Panel**: Empaques (con precio opcional, 0 = sin cargo), Significados, límite de dedicatoria, campos de regalo/significado en el formulario de producto, pedidos con empaque/dedicatoria | `components/admin/GiftAdminPanels.tsx`, `ProductForm.tsx`, `OrdersTable.tsx` |

Pruebas: `npm test` (lógica de líneas del carrito y dedicatoria). La función `create_order` se probó con casos válidos e inválidos directamente en la base.

Datos de ejemplo: los dos empaques sembrados se llaman «(demostración)», tienen precio 0 y se editan o eliminan desde el panel. Los textos de los 6 temas son simbólicos y editables.

### Hacia la tienda 100% funcional (hecho)

- **Datos del cliente en el pedido** (nombre, celular peruano, distrito, dirección opcional): obligatorios y validados en el servidor (`create_order`) y en el carrito (`lib/customer.ts`). En el panel, cada pedido muestra el contacto y un enlace «Escribir» a WhatsApp.
- **Límites contra pedidos basura:** máx. 5 pedidos por hora por red (se guarda solo un hash, no la IP), 10 por celular al día y 100 por hora en total.
- **Seguimiento en `/pedido`:** exige código **y** celular (función `track_order`); no devuelve precios ni dirección y limita las consultas.
- **Panel:** revisa pedidos nuevos cada minuto, muestra un contador de pendientes y avisa con un mensaje.
- **SEO:** `sitemap.xml`, `robots.txt`, metadatos y datos estructurados por producto desde el servidor. **La indexación está apagada** mientras haya datos de ejemplo; se activa con la variable `NEXT_PUBLIC_ALLOW_INDEXING=true` (y `NEXT_PUBLIC_SITE_URL` con tu dominio) en Vercel.
- **Esquema en el repositorio:** `supabase/migrations/` (el orden de los archivos es el orden de aplicación).

### Mejoras V2 · Fase B (hecha)

| Qué | Dónde |
|---|---|
| **Combina y ahorra** (combos de productos reales, variante fija o elegida por el cliente, vigencia, máximo por pedido, descuento % solo si lo configuras) | `/combos`, portada, carrito (`ComboCartLine`), panel → **Combos**; función SQL `place_order` guarda cada componente con su precio y el nombre del combo |
| **Encuentra tu joya ideal** (5 preguntas, 3 a 6 joyas disponibles, sin IA externa) | `/asistente`, `lib/recommend.ts`. El estilo solo se pregunta si algún producto tiene estilos (se asignan en el formulario de producto) |
| **Stock mínimo por variante** con alertas en el panel | formulario de producto (campo «Mín.») y Resumen |
| **Seguimiento de pedidos** con código + celular | `/pedido` (ver arriba) |

No hay combos de ejemplo: se crean en el panel. Un combo pausado, programado o vencido no se ve ni se puede comprar (lo exige la base de datos, no solo la pantalla).

### Avisos de stock (hecho)

En una joya agotada, el cliente puede **consultar por WhatsApp** o **dejar su contacto** («Avísame cuando vuelva», con consentimiento). La tienda ve los avisos en `/admin` → **Avisos de stock** (con contador y botón «Avisar por WhatsApp»); al registrar una entrada de stock, el panel recuerda cuántas personas esperan. Es un aviso **manual**, no automático. En el carrito, una pieza sin stock también ofrece «Consultar disponibilidad por WhatsApp».

### Asistente (bot) y aviso automático (hecho; el envío necesita tus claves)

- **Asistente del sitio** (botón «Asistente», abajo a la izquierda): menú de respuestas fijas con datos reales (stock y precio de una joya, estado de pedido con código + celular, envíos, pagos, cómo comprar) y paso a una persona por WhatsApp. No inventa precios, plazos ni stock. Lógica en `lib/bot.ts`.
- **IA opcional** para preguntas libres: función `assistant` (Supabase Edge Function). Solo responde con el catálogo real y las reglas del sitio. **Se activa solo cuando pones una clave** en Supabase → Edge Functions → Secrets: `ANTHROPIC_API_KEY` (Claude) o `OPENAI_API_KEY`. Opcional: `ASSISTANT_MODEL`. Límites: 20 mensajes por hora por conexión y 800 al día en total.
- **Aviso automático al volver el stock:** al reponer stock, los avisos pendientes quedan «listos para avisar». La función `notify-restock` envía un correo (cada 5 minutos desde `pg_cron`, o con «Enviar correos ahora» en el panel). **Se activa cuando pones** `RESEND_API_KEY` y `FROM_EMAIL` (por ejemplo `MariArte <avisos@tudominio.com>`) en los mismos Secrets. Sin eso, no envía nada y los avisos siguen siendo manuales por WhatsApp.
- Las funciones están en `supabase/functions/`.

**Pendiente (Fase C y cupones):** cupones con código, guías de tallas y cuidados por material, aviso de reposición, video del producto, catálogo en PDF, QR/enlaces compartibles, reseñas autorizadas, indicadores avanzados, historial de inventario con usuario y exportaciones.

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
| `/admin` | Panel de administración (en modo demo sin Supabase): resumen, CRUD de productos y variantes, pedidos con cambio de estado, movimientos de stock, **Restablecer datos de demo** |

## 4. Cómo probar los criterios de aceptación

1. Inicio → **Ver colección** → abre una joya.
2. En `/catalogo` escribe «ojo» o marca *Sets*; prueba *Ocultar agotados*.
3. Agrega dos joyas distintas (una con variante), ve a `/carrito`, cambia cantidades y revisa el subtotal.
4. Recarga la página: el carrito y los favoritos siguen ahí.
5. Abre «Ver mensaje que se enviará» y pulsa **Pedir por WhatsApp**: se abre `wa.me` con el pedido codificado. **No se envía solo**; tú lo envías desde WhatsApp.
6. Ve a `/admin` → Productos → edita el precio o el stock de una joya → vuelve a la tienda y verás el cambio (también en el carrito, que avisa si el stock ya no alcanza).
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

**Importante:** después de editar los archivos de `data/`, pulsa **Restablecer datos de demo** en `/admin` (o borra el `localStorage` del sitio), porque el navegador conserva la copia anterior del catálogo.

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
