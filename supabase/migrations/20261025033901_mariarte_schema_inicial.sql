create table public.categories (
  id text primary key,
  name text not null,
  description text not null default '',
  image text,
  sort_order int not null default 0
);

create table public.products (
  id text primary key,
  slug text not null unique,
  name text not null,
  description text not null default '',
  category_id text not null references public.categories(id) on update cascade,
  material text not null default '',
  material_type text not null check (material_type in ('Hilo tejido','Cuentas','Metal (por confirmar)')),
  price numeric(10,2) not null check (price >= 0),
  images text[] not null default '{}',
  featured boolean not null default false,
  active boolean not null default true,
  is_new boolean not null default false,
  variant_name text,
  care text,
  created_at date not null default current_date
);
create index products_category_id_idx on public.products(category_id);

create table public.product_variants (
  sku text primary key,
  product_id text not null references public.products(id) on delete cascade on update cascade,
  label text not null,
  stock int not null default 0 check (stock >= 0),
  sort_order int not null default 0
);
create index product_variants_product_id_idx on public.product_variants(product_id);

create table public.orders (
  id text primary key,
  code text not null unique,
  customer_name text not null,
  district text not null default '',
  channel text not null check (channel in ('WhatsApp','Instagram')),
  status text not null default 'pendiente' check (status in ('pendiente','confirmado','preparado','enviado','entregado','cancelado')),
  created_at date not null default current_date
);

create table public.order_items (
  id bigint generated always as identity primary key,
  order_id text not null references public.orders(id) on delete cascade,
  product_id text references public.products(id) on delete set null on update cascade,
  product_name text not null,
  variant_label text not null,
  quantity int not null check (quantity > 0),
  unit_price numeric(10,2) not null check (unit_price >= 0)
);
create index order_items_order_id_idx on public.order_items(order_id);
create index order_items_product_id_idx on public.order_items(product_id);

create table public.inventory_movements (
  id text primary key,
  date date not null default current_date,
  sku text not null,
  product_name text not null,
  type text not null check (type in ('entrada','salida','ajuste')),
  quantity int not null check (quantity <> 0),
  note text not null default ''
);
create index inventory_movements_sku_idx on public.inventory_movements(sku);
create index inventory_movements_date_idx on public.inventory_movements(date desc);

create table public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role in ('admin'))
);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.staff_profiles enable row level security;

-- Lectura pública solo del catálogo activo.
create policy "categorias_lectura_publica" on public.categories for select to anon, authenticated using (true);
create policy "productos_lectura_publica" on public.products for select to anon, authenticated using (active = true);
create policy "variantes_lectura_publica" on public.product_variants for select to anon, authenticated
  using (exists (select 1 from public.products p where p.id = product_id and p.active = true));

-- Cada usuario solo ve su propio perfil de staff (base para las políticas de admin).
create policy "staff_ve_su_perfil" on public.staff_profiles for select to authenticated
  using (user_id = (select auth.uid()));

-- Escritura y lectura completa solo para administradores.
create policy "admin_categorias" on public.categories for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_productos" on public.products for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_variantes" on public.product_variants for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_pedidos" on public.orders for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_items_pedido" on public.order_items for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_movimientos" on public.inventory_movements for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
