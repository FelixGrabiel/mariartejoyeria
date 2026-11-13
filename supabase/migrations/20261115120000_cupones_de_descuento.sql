-- Cupones de descuento. El servidor valida y calcula el descuento (place_order_v3): el navegador no puede alterarlo.
-- Los códigos NO son legibles públicamente (sin política de lectura): solo se consultan con preview_coupon / place_order_v3,
-- que además limitan los intentos por IP para que no se puedan adivinar.

create table public.coupons (
  code text primary key check (code = upper(code) and code ~ '^[A-Z0-9_-]{3,24}$'),
  kind text not null check (kind in ('percent', 'amount')),
  value numeric(10,2) not null check (value > 0),
  min_subtotal numeric(10,2) not null default 0 check (min_subtotal >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  max_uses int check (max_uses is null or max_uses > 0),
  uses int not null default 0 check (uses >= 0),
  active boolean not null default true,
  note text not null default '' check (char_length(note) <= 120),
  created_at timestamptz not null default now(),
  check (kind <> 'percent' or value <= 100)
);
alter table public.coupons enable row level security;
create policy "admin_cupones" on public.coupons for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));

alter table public.orders
  add column coupon_code text,
  add column discount_amount numeric(10,2) not null default 0 check (discount_amount >= 0);

-- Descuento de un cupón para un subtotal. Lanza una excepción con un mensaje claro si no se puede usar.
create function public.coupon_discount(p_code text, p_subtotal numeric)
returns numeric
language plpgsql
security definer
set search_path = ''
as $$
declare
  c record;
  d numeric;
begin
  select * into c from public.coupons where code = upper(trim(coalesce(p_code, '')));
  if not found or not c.active then
    raise exception 'El cupón no es válido';
  end if;
  if c.starts_at is not null and now() < c.starts_at then
    raise exception 'El cupón aún no está vigente';
  end if;
  if c.ends_at is not null and now() > c.ends_at then
    raise exception 'El cupón ya venció';
  end if;
  if c.max_uses is not null and c.uses >= c.max_uses then
    raise exception 'El cupón ya alcanzó su límite de usos';
  end if;
  if p_subtotal < c.min_subtotal then
    raise exception 'Este cupón requiere una compra mínima de S/ %', to_char(c.min_subtotal, 'FM999990.00');
  end if;
  if c.kind = 'percent' then
    d := round(p_subtotal * c.value / 100, 2);
  else
    d := c.value;
  end if;
  return least(d, p_subtotal);
end;
$$;
revoke all on function public.coupon_discount(text, numeric) from public, anon, authenticated;

-- Límite de intentos por IP (compartido por la vista previa y el pedido): 20 por hora.
create function public.coupon_rate_limit()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_headers text := nullif(current_setting('request.headers', true), '');
  v_ip text := '';
  v_hash text;
begin
  if v_headers is not null then
    v_ip := split_part(coalesce((v_headers::json)->>'x-forwarded-for', ''), ',', 1);
  end if;
  v_hash := md5(v_ip || ':cupon');
  if (select count(*) from public.track_attempts where ip_hash = v_hash and at > now() - interval '1 hour') >= 20 then
    raise exception 'Demasiados intentos con cupones. Inténtalo más tarde';
  end if;
  insert into public.track_attempts (ip_hash) values (v_hash);
end;
$$;
revoke all on function public.coupon_rate_limit() from public, anon, authenticated;

-- Vista previa en el carrito: devuelve { code, discount } o lanza un error legible.
create function public.preview_coupon(p_code text, p_subtotal numeric)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_code text := upper(trim(coalesce(p_code, '')));
begin
  perform public.coupon_rate_limit();
  return jsonb_build_object('code', v_code, 'discount', public.coupon_discount(v_code, coalesce(p_subtotal, 0)));
end;
$$;
revoke all on function public.preview_coupon(text, numeric) from public;
grant execute on function public.preview_coupon(text, numeric) to anon, authenticated;

-- Pedido con cupón opcional. Si el cupón no es válido, TODO el pedido se revierte (no queda un pedido a medias).
create function public.place_order_v3(
  p_items jsonb, p_combos jsonb, p_customer_name text, p_phone text, p_district text,
  p_address text default '', p_shipping_zone text default '', p_coupon text default ''
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
  v_coupon text := upper(nullif(trim(coalesce(p_coupon, '')), ''));
  v_discount numeric;
begin
  v_code := public.place_order_v2(p_items, p_combos, p_customer_name, p_phone, p_district, p_address, p_shipping_zone);
  if v_coupon is null then
    return v_code;
  end if;

  perform public.coupon_rate_limit();
  select id into v_order_id from public.orders where code = v_code;
  select coalesce(sum(quantity * (unit_price + coalesce(packaging_price, 0))), 0) into v_subtotal
    from public.order_items where order_id = v_order_id;

  v_discount := public.coupon_discount(v_coupon, v_subtotal);
  -- Suma un uso de forma atómica: dos pedidos simultáneos no pueden pasarse del límite.
  update public.coupons set uses = uses + 1 where code = v_coupon and (max_uses is null or uses < max_uses);
  if not found then
    raise exception 'El cupón ya alcanzó su límite de usos';
  end if;
  update public.orders set coupon_code = v_coupon, discount_amount = v_discount where id = v_order_id;
  return v_code;
end;
$$;
revoke all on function public.place_order_v3(jsonb,jsonb,text,text,text,text,text,text) from public;
grant execute on function public.place_order_v3(jsonb,jsonb,text,text,text,text,text,text) to anon, authenticated;

-- El seguimiento público incluye el descuento y el total ya con descuento.
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
    'coupon', o.coupon_code,
    'discount', o.discount_amount,
    'shipping_zone', o.shipping_zone_name,
    'shipping_cost', o.shipping_cost,
    'shipping_pending', o.shipping_pending,
    'total', v_sub - o.discount_amount + o.shipping_cost,
    'items', (
      select coalesce(jsonb_agg(jsonb_build_object(
        'name', oi.product_name, 'variant', oi.variant_label, 'quantity', oi.quantity,
        'occasion', oi.occasion, 'packaging', oi.packaging_name, 'combo', oi.combo_name) order by oi.id), '[]'::jsonb)
      from public.order_items oi where oi.order_id = o.id)
  );
end;
$$;

-- place_order_v2 sigue existiendo para la versión anterior de la tienda; cuando la nueva esté publicada
-- se puede cerrar con:  revoke execute on function public.place_order_v2(jsonb,jsonb,text,text,text,text,text) from anon, authenticated;
