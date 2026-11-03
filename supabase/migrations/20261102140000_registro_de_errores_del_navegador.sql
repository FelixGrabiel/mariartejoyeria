-- Registro de errores del navegador (sin datos personales). NO aplicada aún: ejecútala en Supabase → SQL Editor.
-- Mientras no exista la función, el sitio sigue funcionando: el envío del error falla en silencio.
create table public.client_errors (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  message text not null,
  stack text,
  url text,
  user_agent text,
  ip_hash text
);
create index client_errors_at_idx on public.client_errors(at desc);
create index client_errors_ip_idx on public.client_errors(ip_hash, at desc);
alter table public.client_errors enable row level security;
create policy "admin_errores" on public.client_errors for all to authenticated
  using (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'))
  with check (exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));

create function public.log_client_error(p_message text, p_stack text default '', p_url text default '')
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_headers text := nullif(current_setting('request.headers', true), '');
  v_ip text := '';
  v_hash text;
  v_ua text := '';
begin
  if char_length(trim(coalesce(p_message, ''))) = 0 then return; end if;
  if v_headers is not null then
    v_ip := split_part(coalesce((v_headers::json)->>'x-forwarded-for', ''), ',', 1);
    v_ua := left(coalesce((v_headers::json)->>'user-agent', ''), 200);
  end if;
  v_hash := case when v_ip <> '' then md5(v_ip || ':mariarte') end;
  if v_hash is not null and (select count(*) from public.client_errors where ip_hash = v_hash and at > now() - interval '1 hour') >= 20 then return; end if;
  if (select count(*) from public.client_errors where at > now() - interval '1 day') >= 500 then return; end if;
  if exists (select 1 from public.client_errors where message = left(p_message, 500) and url is not distinct from left(p_url, 300) and at > now() - interval '1 hour') then return; end if;
  insert into public.client_errors (message, stack, url, user_agent, ip_hash)
  values (left(p_message, 500), left(nullif(p_stack, ''), 2000), left(nullif(p_url, ''), 300), nullif(v_ua, ''), v_hash);
  delete from public.client_errors where at < now() - interval '30 days';
end;
$$;
revoke all on function public.log_client_error(text,text,text) from public;
grant execute on function public.log_client_error(text,text,text) to anon, authenticated;
