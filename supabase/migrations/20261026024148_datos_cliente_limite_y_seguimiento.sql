-- Datos de contacto del pedido + marca de tiempo exacta + huella de red (hash) para limitar abusos
alter table public.orders
  add column customer_phone text,
  add column address text not null default '',
  add column ip_hash text,
  add column placed_at timestamptz not null default now();
create index orders_ip_hash_placed_idx on public.orders(ip_hash, placed_at desc);
create index orders_phone_idx on public.orders(customer_phone);

create table public.track_attempts (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  at timestamptz not null default now()
);
create index track_attempts_ip_at_idx on public.track_attempts(ip_hash, at desc);
alter table public.track_attempts enable row level security; -- sin políticas: solo las funciones internas escriben aquí

-- La versión anterior (sin datos de contacto) deja de ser invocable desde la web
revoke all on function public.create_order(jsonb, text) from anon, authenticated, public;

create function public.create_order(
  p_items jsonb,
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
  v_name text := trim(coalesce(p_customer_name, ''));
  v_district text := trim(coalesce(p_district, ''));
  v_address text := trim(coalesce(p_address, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_headers text := nullif(current_setting('request.headers', true), '');
  v_ip text := '';
  v_hash text;
begin
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
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

  -- Límites contra abuso (sin guardar la IP, solo un hash)
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

revoke all on function public.create_order(jsonb, text, text, text, text) from public;
grant execute on function public.create_order(jsonb, text, text, text, text) to anon, authenticated;

-- Seguimiento: exige código Y celular del pedido; no devuelve precios ni dirección
create function public.track_order(p_code text, p_phone text)
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
        'occasion', oi.occasion, 'packaging', oi.packaging_name) order by oi.id), '[]'::jsonb)
      from public.order_items oi where oi.order_id = o.id)
  );
end;
$$;

revoke all on function public.track_order(text, text) from public;
grant execute on function public.track_order(text, text) to anon, authenticated;
