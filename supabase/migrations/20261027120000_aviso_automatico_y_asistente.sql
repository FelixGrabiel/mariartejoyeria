-- Avisos de stock: correo opcional + estado de envío automático
alter table public.restock_requests
  add column email text,
  add column ready_at timestamptz,
  add column notified_at timestamptz,
  add column notify_status text check (notify_status in ('enviado','fallido','sin_correo')),
  add column notify_error text;
create index restock_requests_ready_idx on public.restock_requests(ready_at) where status = 'pendiente' and notify_status is null;

-- Cuando una variante vuelve a tener stock, los avisos pendientes de esa variante (o del producto) quedan "listos para avisar".
create function public.mark_restock_ready()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(old.stock, 0) <= 0 and new.stock > 0 then
    update public.restock_requests
       set ready_at = now()
     where status = 'pendiente'
       and ready_at is null
       and ((sku = new.sku) or (sku is null and product_id = new.product_id));
  end if;
  return new;
end;
$$;

create trigger variants_mark_restock_ready
  after update of stock on public.product_variants
  for each row execute function public.mark_restock_ready();

-- Nueva versión de la función pública: acepta un correo opcional (la anterior deja de ser invocable desde la web).
revoke all on function public.request_restock(text, text, text, text, text, boolean) from anon, authenticated, public;

create function public.request_restock_v2(
  p_product_id text,
  p_sku text,
  p_name text,
  p_phone text,
  p_email text default '',
  p_note text default '',
  p_consent boolean default false
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_id bigint;
begin
  if v_email <> '' and (char_length(v_email) > 120 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$') then
    raise exception 'Escribe un correo válido o déjalo vacío';
  end if;
  v_id := public.request_restock(p_product_id, p_sku, p_name, p_phone, p_note, p_consent);
  if v_email <> '' then
    update public.restock_requests set email = v_email where id = v_id;
  end if;
  return v_id;
end;
$$;

revoke all on function public.request_restock_v2(text, text, text, text, text, text, boolean) from public;
grant execute on function public.request_restock_v2(text, text, text, text, text, text, boolean) to anon, authenticated;

-- Uso del asistente con IA (límites por red y por día). Solo lo toca la función del servidor.
create table public.assistant_usage (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  at timestamptz not null default now()
);
create index assistant_usage_ip_at_idx on public.assistant_usage(ip_hash, at desc);
create index assistant_usage_at_idx on public.assistant_usage(at desc);
alter table public.assistant_usage enable row level security; -- sin políticas: solo la función del servidor (clave de servicio) escribe aquí
