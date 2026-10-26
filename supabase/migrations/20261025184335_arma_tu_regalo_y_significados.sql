-- Productos: personalización de regalo y significado simbólico editable
alter table public.products
  add column gift_enabled boolean not null default false,
  add column meaning text;

create table public.meaning_themes (
  id text primary key,
  name text not null,
  description text not null default '',
  active boolean not null default true,
  sort_order int not null default 0
);

create table public.product_themes (
  product_id text not null references public.products(id) on delete cascade on update cascade,
  theme_id text not null references public.meaning_themes(id) on delete cascade on update cascade,
  primary key (product_id, theme_id)
);
create index product_themes_theme_id_idx on public.product_themes(theme_id);

create table public.packaging_options (
  id text primary key,
  name text not null,
  description text not null default '',
  price numeric(10,2) not null default 0 check (price >= 0),
  active boolean not null default true,
  sort_order int not null default 0
);

create table public.store_settings (
  key text primary key,
  value text not null
);

-- Copia de la personalización elegida en cada línea del pedido (historial inmutable)
alter table public.order_items
  add column occasion text,
  add column packaging_id text references public.packaging_options(id) on delete set null on update cascade,
  add column packaging_name text,
  add column packaging_price numeric(10,2) not null default 0 check (packaging_price >= 0),
  add column dedication text,
  add column meaning_card boolean not null default false;
create index order_items_packaging_id_idx on public.order_items(packaging_id);

alter table public.meaning_themes enable row level security;
alter table public.product_themes enable row level security;
alter table public.packaging_options enable row level security;
alter table public.store_settings enable row level security;

create policy "temas_lectura_publica" on public.meaning_themes for select to anon, authenticated using (active = true);
create policy "producto_temas_lectura_publica" on public.product_themes for select to anon, authenticated using (true);
create policy "empaques_lectura_publica" on public.packaging_options for select to anon, authenticated using (active = true);
create policy "ajustes_lectura_publica" on public.store_settings for select to anon, authenticated using (true);

create policy "admin_temas" on public.meaning_themes for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_producto_temas" on public.product_themes for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_empaques" on public.packaging_options for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_ajustes" on public.store_settings for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));

-- Datos iniciales editables desde el panel (sin cargos hasta que la administración los configure)
insert into public.store_settings (key, value) values ('dedication_max_chars', '150');

insert into public.meaning_themes (id, name, description, sort_order) values
 ('amor','Amor y cariño','Un símbolo para expresar afecto. Es un significado simbólico y personal, no una promesa de efectos.',1),
 ('amistad','Amistad','Para recordar un vínculo especial. Es un significado simbólico, no una promesa de efectos.',2),
 ('proteccion','Protección','En muchas culturas, estos amuletos se llevan como símbolo de cuidado. Es una tradición simbólica; no garantiza efectos reales.',3),
 ('fe','Fe','Piezas con símbolos de fe y esperanza para quien las lleva. Significado simbólico y personal.',4),
 ('suerte','Buena suerte','Un detalle para desear buenos momentos. Es un símbolo de buenos deseos, no una promesa de resultados.',5),
 ('regalos-especiales','Regalos especiales','Piezas pensadas para entregar en una ocasión importante.',6);

insert into public.packaging_options (id, name, description, price, sort_order) values
 ('bolsita-tela','Bolsita de tela (demostración)','Opción de ejemplo. Edita nombre, descripción y precio en el panel.',0,1),
 ('caja-regalo','Caja de regalo (demostración)','Opción de ejemplo. Edita nombre, descripción y precio en el panel.',0,2);

-- create_order: acepta la personalización de regalo y valida todo en el servidor
-- (esta versión fue reemplazada después por la que recibe los datos de contacto).
create or replace function public.create_order(p_items jsonb, p_customer_name text default 'Cliente web')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text;
  v_code text;
  it jsonb;
  g jsonb;
  r record;
  pk record;
  qty int;
  v_max int;
  v_occasion text;
  v_dedication text;
  v_pack_id text;
  v_pack_name text;
  v_pack_price numeric := 0;
  v_meaning boolean;
begin
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'Pedido vacío o inválido';
  end if;

  select coalesce((select value::int from public.store_settings where key = 'dedication_max_chars'), 150) into v_max;

  v_id := 'o-' || nextval('public.order_seq');
  v_code := 'MA-' || substr(v_id, 3);

  insert into public.orders (id, code, customer_name, district, channel, status)
  values (v_id, v_code, left(coalesce(nullif(trim(p_customer_name), ''), 'Cliente web'), 80), '', 'WhatsApp', 'pendiente');

  for it in select * from jsonb_array_elements(p_items) loop
    qty := (it->>'quantity')::int;
    if qty is null or qty <= 0 or qty > 99 then
      raise exception 'Cantidad inválida';
    end if;

    select p.id as product_id, p.name, p.price, p.gift_enabled, pv.sku, pv.label
      into r
      from public.products p
      join public.product_variants pv on pv.product_id = p.id
     where p.active and p.id = it->>'product_id' and pv.sku = it->>'sku';

    if not found then
      raise exception 'Producto no disponible';
    end if;

    v_occasion := null; v_dedication := null; v_pack_id := null; v_pack_name := null; v_pack_price := 0; v_meaning := false;
    g := it->'gift';
    if g is not null and jsonb_typeof(g) = 'object' then
      if not r.gift_enabled then
        raise exception '% no admite personalización de regalo', r.name;
      end if;
      v_occasion := left(nullif(trim(g->>'occasion'), ''), 40);
      v_dedication := nullif(trim(coalesce(g->>'dedication', '')), '');
      if v_dedication is not null and char_length(v_dedication) > v_max then
        raise exception 'La dedicatoria supera los % caracteres', v_max;
      end if;
      v_meaning := coalesce((g->>'meaning_card')::boolean, false);
      if nullif(g->>'packaging_id', '') is not null then
        select id, name, price into pk from public.packaging_options where id = g->>'packaging_id' and active;
        if not found then
          raise exception 'Empaque no disponible';
        end if;
        v_pack_id := pk.id; v_pack_name := pk.name; v_pack_price := pk.price;
      end if;
    end if;

    insert into public.order_items (order_id, product_id, product_name, variant_label, sku, quantity, unit_price,
                                    occasion, packaging_id, packaging_name, packaging_price, dedication, meaning_card)
    values (v_id, r.product_id, r.name, r.label, r.sku, qty, r.price,
            v_occasion, v_pack_id, v_pack_name, v_pack_price, v_dedication, v_meaning);
  end loop;

  -- Stock: la suma de todas las líneas con el mismo SKU no puede superar las existencias
  perform 1
    from (select oi.sku, sum(oi.quantity) as total from public.order_items oi where oi.order_id = v_id group by oi.sku) s
    join public.product_variants pv on pv.sku = s.sku
   where s.total > pv.stock;
  if found then
    raise exception 'Stock insuficiente para completar el pedido';
  end if;

  return v_code;
end;
$$;
