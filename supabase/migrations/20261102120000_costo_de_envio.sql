-- Costo de envío: zonas con tarifa en soles, envío gratis desde un monto, recojo y "por confirmar".
-- El servidor (place_order_v2) vuelve a calcular el costo: el navegador no puede alterarlo.

create table public.shipping_zones (
  id text primary key,
  name text not null check (char_length(name) between 2 and 60),
  price numeric(10,2) check (price is null or price >= 0),          -- null = se confirma por WhatsApp
  free_from numeric(10,2) check (free_from is null or free_from > 0),
  eta text not null default '' check (char_length(eta) <= 60),
  pickup boolean not null default false,
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.shipping_zones enable row level security;
create policy "envios_lectura_publica" on public.shipping_zones for select to anon, authenticated using (active);
create policy "admin_envios" on public.shipping_zones for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));

alter table public.orders
  add column shipping_zone_name text,
  add column shipping_cost numeric(10,2) not null default 0 check (shipping_cost >= 0),
  add column shipping_pending boolean not null default false;

create function public.place_order_v2(
  p_items jsonb, p_combos jsonb, p_customer_name text, p_phone text, p_district text,
  p_address text default '', p_shipping_zone text default ''
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text;
  v_order_id text;
  v_subtotal numeric;
  v_zone_id text := nullif(trim(coalesce(p_shipping_zone, '')), '');
  z record;
  v_cost numeric := 0;
  v_pending boolean := false;
  v_zone_name text;
begin
  v_code := public.place_order(p_items, p_combos, p_customer_name, p_phone, p_district, p_address);
  select id into v_order_id from public.orders where code = v_code;
  select coalesce(sum(quantity * (unit_price + coalesce(packaging_price, 0))), 0) into v_subtotal
    from public.order_items where order_id = v_order_id;

  if exists (select 1 from public.shipping_zones where active) then
    if v_zone_id is null then
      raise exception 'Elige tu zona de envío';
    end if;
    select * into z from public.shipping_zones where id = v_zone_id and active;
    if not found then
      raise exception 'La zona de envío elegida ya no está disponible';
    end if;
    v_zone_name := z.name;
    if z.price is null then
      v_pending := true;
    elsif z.free_from is not null and v_subtotal >= z.free_from then
      v_cost := 0;
    else
      v_cost := z.price;
    end if;
    update public.orders set shipping_zone_name = v_zone_name, shipping_cost = v_cost, shipping_pending = v_pending where id = v_order_id;
  end if;
  return v_code;
end;
$$;
revoke all on function public.place_order_v2(jsonb,jsonb,text,text,text,text,text) from public;
grant execute on function public.place_order_v2(jsonb,jsonb,text,text,text,text,text) to anon, authenticated;

-- El seguimiento público ahora incluye subtotal, envío y total.
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
  v_sub numeric;
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

  select coalesce(sum(quantity * (unit_price + coalesce(packaging_price, 0))), 0) into v_sub
    from public.order_items where order_id = o.id;

  return jsonb_build_object(
    'code', o.code,
    'status', o.status,
    'created_at', o.created_at,
    'subtotal', v_sub,
    'shipping_zone', o.shipping_zone_name,
    'shipping_cost', o.shipping_cost,
    'shipping_pending', o.shipping_pending,
    'total', v_sub + o.shipping_cost,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', oi.product_name, 'variant', oi.variant_label, 'quantity', oi.quantity,
        'occasion', oi.occasion, 'packaging', oi.packaging_name, 'combo', oi.combo_name) order by oi.id), '[]'::jsonb)
      from public.order_items oi where oi.order_id = o.id)
  );
end;
$$;
