create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Secreto interno (generado aquí, nunca sale de la base de datos) para que la tarea programada pueda llamar a la función de avisos.
select vault.create_secret(encode(extensions.gen_random_bytes(24), 'hex'), 'notify_restock_secret', 'Secreto para llamar a la función notify-restock desde pg_cron');

create function public.verify_notify_secret(p_secret text)
returns boolean
language sql
security definer
set search_path = ''
as $$
  select coalesce((select decrypted_secret = p_secret from vault.decrypted_secrets where name = 'notify_restock_secret' limit 1), false);
$$;
revoke all on function public.verify_notify_secret(text) from public, anon, authenticated;
grant execute on function public.verify_notify_secret(text) to service_role;

-- Cada 5 minutos revisa si hay avisos listos y llama a la función (que no hace nada si el correo no está configurado).
-- Cambia la URL por la de tu proyecto si recreas la base en otro proyecto de Supabase.
select cron.schedule(
  'notify-restock',
  '*/5 * * * *',
  $job$
  select net.http_post(
    url := 'https://geszlnloqwvvxsicpnjx.supabase.co/functions/v1/notify-restock',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'notify_restock_secret' limit 1)
    ),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
  $job$
);
