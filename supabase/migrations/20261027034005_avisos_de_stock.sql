-- Avisos de stock: el cliente deja su contacto para que la tienda le escriba cuando un producto agotado vuelva.
create table public.restock_requests (
  id bigint generated always as identity primary key,
  product_id text references public.products(id) on delete set null on update cascade,
  sku text,
  product_name text not null,
  variant_label text,
  customer_name text not null,
  customer_phone text not null,
  note text not null default '',
  consent boolean not null default false check (consent),
  status text not null default 'pendiente' check (status in ('pendiente','atendido')),
  ip_hash text,
  created_at timestamptz not null default now()
);
create index restock_requests_product_id_idx on public.restock_requests(product_id);
create index restock_requests_status_idx on public.restock_requests(status, created_at desc);
create index restock_requests_ip_idx on public.restock_requests(ip_hash, created_at desc);

alter table public.restock_requests enable row level security;

-- Solo la administración ve y gestiona los avisos; los clientes los crean únicamente con la función de abajo.
create policy "admin_avisos_stock" on public.restock_requests for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));

create function public.request_restock(
  p_product_id text,
  p_sku text,
  p_name text,
  p_phone text,
  p_note text default '',
  p_consent boolean default false
)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text := trim(coalesce(p_name, ''));
  v_note text := trim(coalesce(p_note, ''));
  v_phone text := regexp_replace(coalesce(p_phone, ''), '\D', '', 'g');
  v_headers text := nullif(current_setting('request.headers', true), '');
  v_ip text := '';
  v_hash text;
  v_product record;
  v_label text;
  v_id bigint;
begin
  if not coalesce(p_consent, false) then
    raise exception 'Debes aceptar que MariArte te escriba por WhatsApp para avisarte';
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
  if char_length(v_note) > 200 then
    raise exception 'La nota es demasiado larga (máximo 200 caracteres)';
  end if;

  select p.id, p.name into v_product from public.products p where p.id = p_product_id and p.active;
  if not found then
    raise exception 'Producto no disponible';
  end if;
  if nullif(p_sku, '') is not null then
    select pv.label into v_label from public.product_variants pv where pv.sku = p_sku and pv.product_id = v_product.id;
    if not found then
      raise exception 'Opción no disponible';
    end if;
  end if;

  if v_headers is not null then
    v_ip := split_part(coalesce((v_headers::json)->>'x-forwarded-for', ''), ',', 1);
  end if;
  v_hash := case when v_ip <> '' then md5(v_ip || ':mariarte') end;
  if v_hash is not null and (select count(*) from public.restock_requests where ip_hash = v_hash and created_at > now() - interval '1 hour') >= 5 then
    raise exception 'Enviaste varios avisos seguidos. Inténtalo más tarde o escríbenos por WhatsApp';
  end if;
  if exists (select 1 from public.restock_requests
              where customer_phone = v_phone and product_id = v_product.id and coalesce(sku, '') = coalesce(nullif(p_sku, ''), '') and status = 'pendiente') then
    raise exception 'Ya tienes un aviso pendiente para este producto';
  end if;

  insert into public.restock_requests (product_id, sku, product_name, variant_label, customer_name, customer_phone, note, consent, ip_hash)
  values (v_product.id, nullif(p_sku, ''), v_product.name, v_label, v_name, v_phone, left(v_note, 200), true, v_hash)
  returning id into v_id;
  return v_id;
end;
$$;

revoke all on function public.request_restock(text, text, text, text, text, boolean) from public;
grant execute on function public.request_restock(text, text, text, text, text, boolean) to anon, authenticated;
