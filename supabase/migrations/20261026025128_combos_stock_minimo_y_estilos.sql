-- Stock mínimo por variante y estilos de producto (para alertas y para el asistente de recomendaciones)
alter table public.product_variants add column min_stock int not null default 2 check (min_stock >= 0);
alter table public.products add column styles text[] not null default '{}';

-- Combos: conjuntos de productos reales con una promoción opcional (0 % = sin descuento)
create table public.combos (
  id text primary key,
  name text not null,
  description text not null default '',
  discount_percent int not null default 0 check (discount_percent between 0 and 90),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  max_per_order int not null default 5 check (max_per_order between 1 and 99),
  sort_order int not null default 0,
  constraint combos_vigencia_valida check (ends_at is null or starts_at is null or ends_at > starts_at)
);

create table public.combo_items (
  id bigint generated always as identity primary key,
  combo_id text not null references public.combos(id) on delete cascade on update cascade,
  product_id text not null references public.products(id) on delete cascade on update cascade,
  sku text references public.product_variants(sku) on delete cascade on update cascade, -- null: el cliente elige la variante
  quantity int not null default 1 check (quantity between 1 and 10),
  position int not null default 0
);
create index combo_items_combo_id_idx on public.combo_items(combo_id);
create index combo_items_product_id_idx on public.combo_items(product_id);
create index combo_items_sku_idx on public.combo_items(sku);

-- Composición del combo guardada en cada línea del pedido
alter table public.order_items
  add column combo_id text references public.combos(id) on delete set null on update cascade,
  add column combo_name text,
  add column combo_group int;
create index order_items_combo_id_idx on public.order_items(combo_id);

alter table public.combos enable row level security;
alter table public.combo_items enable row level security;

create policy "combos_lectura_publica" on public.combos for select to anon, authenticated
  using (active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()));
create policy "combo_items_lectura_publica" on public.combo_items for select to anon, authenticated
  using (exists (select 1 from public.combos c where c.id = combo_id and c.active
                 and (c.starts_at is null or c.starts_at <= now()) and (c.ends_at is null or c.ends_at > now())));
create policy "admin_combos" on public.combos for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_combo_items" on public.combo_items for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));

-- place_order: crea un pedido con productos sueltos Y/O combos. Todo se valida en el servidor.
create function public.place_order(
  p_items jsonb,
  p_combos jsonb,
  p_customer_name text,
  p_phone text,
  p_district text,
  p_address text default ''
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text;
  v_code text;
  it jsonb;
  cmb jsonb;
  g jsonb;
  r record;
  pk record;
  cb record;
  ci record;
  qty int;
  cq int;
  n int;
  idx int;
  v_sku text;
  v_unit numeric;
  v_max int;
  v_occasion text;
  v_dedication text;
  v_pack_id text;
  v_pack_name text;
  v_pack_price numeric := 0;
  v_meaning boolean;
  v_name text := trim(coalesce(p_customer_name, ''));
  v_district text := trim(coalesce(p_district, ''));
  v_address text := trim(coalesce(p_address, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_headers text := nullif(current_setting('request.headers', true), '');
  v_ip text := '';
  v_hash text;
  v_items jsonb := coalesce(p_items, '[]'::jsonb);
  v_combos jsonb := coalesce(p_combos, '[]'::jsonb);
begin
  if jsonb_typeof(v_items) is distinct from 'array' or jsonb_typeof(v_combos) is distinct from 'array'
     or jsonb_array_length(v_items) > 50 or jsonb_array_length(v_combos) > 20
     or jsonb_array_length(v_items) + jsonb_array_length(v_combos) = 0 then
    raise exception 'Pedido vacío o inválido';
  end if;

  if char_length(v_name) < 2 or char_length(v_name) > 80 then
    raise exception 'Escribe tu nombre (2 a 80 caracteres)';
  end if;
  if length(v_phone) = 11 and left(v_phone, 2) = '51' then
    v_phone := substr(v_phone, 3);
  end if;
  if v_phone !~ '^9[0-9]{8}$' then
    raise exception 'Escribe un celular válido de 9 dígitos (empieza con 9)';
  end if;
  if char_length(v_district) < 2 or char_length(v_district) > 80 then
    raise exception 'Escribe tu distrito o ciudad';
  end if;
  if char_length(v_address) > 160 then
    raise exception 'La dirección es demasiado larga (máximo 160 caracteres)';
  end if;

  if v_headers is not null then
    v_ip := split_part(coalesce((v_headers::json)->>'x-forwarded-for', ''), ',', 1);
  end if;
  v_hash := case when v_ip <> '' then md5(v_ip || ':mariarte') end;
  if v_hash is not null and (select count(*) from public.orders where ip_hash = v_hash and placed_at > now() - interval '1 hour') >= 5 then
    raise exception 'Hiciste varios pedidos seguidos. Espera un rato o escríbenos por WhatsApp';
  end if;
  if (select count(*) from public.orders where customer_phone = v_phone and placed_at > now() - interval '24 hours') >= 10 then
    raise exception 'Ese celular ya hizo muchos pedidos hoy. Escríbenos por WhatsApp';
  end if;
  if (select count(*) from public.orders where placed_at > now() - interval '1 hour') >= 100 then
    raise exception 'Estamos recibiendo muchos pedidos. Inténtalo en unos minutos';
  end if;

  select coalesce((select value::int from public.store_settings where key = 'dedication_max_chars'), 150) into v_max;

  v_id := 'o-' || nextval('public.order_seq');
  v_code := 'MA-' || substr(v_id, 3);

  insert into public.orders (id, code, customer_name, customer_phone, district, address, channel, status, ip_hash)
  values (v_id, v_code, v_name, v_phone, v_district, v_address, 'WhatsApp', 'pendiente', v_hash);

  -- Productos sueltos (con o sin personalización de regalo)
  for it in select * from jsonb_array_elements(v_items) loop
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

  -- Combos: cada componente se guarda como línea del pedido con el precio ya promocionado
  for cmb, n in select value, ordinality from jsonb_array_elements(v_combos) with ordinality loop
    select * into cb from public.combos
     where id = cmb->>'combo_id' and active
       and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now());
    if not found then
      raise exception 'Un combo ya no está disponible';
    end if;
    cq := (cmb->>'quantity')::int;
    if cq is null or cq <= 0 or cq > cb.max_per_order then
      raise exception 'Cantidad inválida para el combo % (máximo % por pedido)', cb.name, cb.max_per_order;
    end if;

    idx := 0;
    for ci in select * from public.combo_items where combo_id = cb.id order by position, id loop
      v_sku := coalesce(ci.sku, cmb->'picks'->>idx);
      idx := idx + 1;
      if v_sku is null then
        raise exception 'Elige una opción para cada producto del combo %', cb.name;
      end if;

      select p.id as product_id, p.name, p.price, pv.sku, pv.label
        into r
        from public.products p
        join public.product_variants pv on pv.product_id = p.id
       where p.active and p.id = ci.product_id and pv.sku = v_sku;
      if not found then
        raise exception 'Un producto del combo % no está disponible', cb.name;
      end if;

      v_unit := round(r.price * (100 - cb.discount_percent) / 100.0, 2);
      insert into public.order_items (order_id, product_id, product_name, variant_label, sku, quantity, unit_price,
                                      combo_id, combo_name, combo_group)
      values (v_id, r.product_id, r.name, r.label, r.sku, ci.quantity * cq, v_unit, cb.id, cb.name, n);
    end loop;
    if idx = 0 then
      raise exception 'El combo % no tiene productos', cb.name;
    end if;
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

revoke all on function public.place_order(jsonb, jsonb, text, text, text, text) from public;
grant execute on function public.place_order(jsonb, jsonb, text, text, text, text) to anon, authenticated;

-- La función anterior pasa a ser un envoltorio (mantiene compatible la versión publicada de la tienda)
create or replace function public.create_order(
  p_items jsonb,
  p_customer_name text,
  p_phone text,
  p_district text,
  p_address text default ''
)
returns text
language sql
security definer
set search_path = ''
as $$
  select public.place_order(p_items, '[]'::jsonb, p_customer_name, p_phone, p_district, p_address);
$$;

-- Seguimiento: ahora también indica si la pieza forma parte de un combo
create or replace function public.track_order(p_code text, p_phone text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_headers text := nullif(current_setting('request.headers', true), '');
  v_ip text := '';
  v_hash text;
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  o record;
begin
  if v_headers is not null then
    v_ip := split_part(coalesce((v_headers::json)->>'x-forwarded-for', ''), ',', 1);
  end if;
  v_hash := md5(v_ip || ':mariarte');
  if (select count(*) from public.track_attempts where ip_hash = v_hash and at > now() - interval '1 hour') >= 20 then
    raise exception 'Demasiadas consultas. Inténtalo más tarde';
  end if;
  insert into public.track_attempts (ip_hash) values (v_hash);

  if length(v_phone) = 11 and left(v_phone, 2) = '51' then
    v_phone := substr(v_phone, 3);
  end if;

  select * into o from public.orders
   where upper(code) = upper(trim(coalesce(p_code, ''))) and customer_phone = v_phone;
  if not found then
    return null;
  end if;

  return jsonb_build_object(
    'code', o.code,
    'status', o.status,
    'created_at', o.created_at,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', oi.product_name, 'variant', oi.variant_label, 'quantity', oi.quantity,
        'occasion', oi.occasion, 'packaging', oi.packaging_name, 'combo', oi.combo_name) order by oi.id), '[]'::jsonb)
      from public.order_items oi where oi.order_id = o.id)
  );
end;
$$;
