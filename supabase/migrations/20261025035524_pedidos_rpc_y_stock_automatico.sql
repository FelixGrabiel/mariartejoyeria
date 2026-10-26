alter table public.order_items add column sku text;
update public.order_items oi set sku = v.sku
  from public.product_variants v
  where v.product_id = oi.product_id and v.label = oi.variant_label;

create sequence public.order_seq start 2001;

-- Versión inicial de create_order (reemplazada más tarde por la que recibe datos del cliente).
create function public.create_order(p_items jsonb, p_customer_name text default 'Cliente web')
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id text;
  v_code text;
  it jsonb;
  r record;
  qty int;
begin
  if jsonb_typeof(p_items) is distinct from 'array'
     or jsonb_array_length(p_items) = 0
     or jsonb_array_length(p_items) > 50 then
    raise exception 'Pedido vacío o inválido';
  end if;

  v_id := 'o-' || nextval('public.order_seq');
  v_code := 'MA-' || substr(v_id, 3);

  insert into public.orders (id, code, customer_name, district, channel, status)
  values (v_id, v_code, left(coalesce(nullif(trim(p_customer_name), ''), 'Cliente web'), 80), '', 'WhatsApp', 'pendiente');

  for it in select * from jsonb_array_elements(p_items) loop
    qty := (it->>'quantity')::int;
    if qty is null or qty <= 0 or qty > 99 then
      raise exception 'Cantidad inválida';
    end if;

    select p.id as product_id, p.name, p.price, pv.sku, pv.label, pv.stock
      into r
      from public.products p
      join public.product_variants pv on pv.product_id = p.id
     where p.active and p.id = it->>'product_id' and pv.sku = it->>'sku';

    if not found then
      raise exception 'Producto no disponible';
    end if;
    if qty > r.stock then
      raise exception 'Stock insuficiente para % (%)', r.name, r.label;
    end if;

    insert into public.order_items (order_id, product_id, product_name, variant_label, sku, quantity, unit_price)
    values (v_id, r.product_id, r.name, r.label, r.sku, qty, r.price);
  end loop;

  return v_code;
end;
$$;

revoke all on function public.create_order(jsonb, text) from public;
grant execute on function public.create_order(jsonb, text) to anon, authenticated;

-- El stock se descuenta al confirmar un pedido y se devuelve si se cancela.
create function public.apply_order_stock()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  was_reserved boolean := old.status not in ('pendiente', 'cancelado');
  is_reserved boolean := new.status not in ('pendiente', 'cancelado');
  sign int;
  it record;
begin
  if was_reserved = is_reserved then
    return new;
  end if;
  sign := case when is_reserved then -1 else 1 end;

  for it in select * from public.order_items where order_id = new.id and sku is not null loop
    update public.product_variants set stock = stock + sign * it.quantity where sku = it.sku;
    insert into public.inventory_movements (id, date, sku, product_name, type, quantity, note)
    values (
      'm-' || substr(gen_random_uuid()::text, 1, 8),
      current_date,
      it.sku,
      it.product_name,
      case when sign < 0 then 'salida' else 'entrada' end,
      sign * it.quantity,
      case when sign < 0 then 'Pedido ' || new.code else 'Cancelación ' || new.code end
    );
  end loop;
  return new;
end;
$$;

create trigger orders_apply_stock
  after update of status on public.orders
  for each row execute function public.apply_order_stock();
