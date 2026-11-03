-- Los pedidos entran solo por place_order_v2 (que valida la zona y calcula el envío).
-- place_order sigue existiendo: place_order_v2 lo llama internamente (SECURITY DEFINER).
revoke execute on function public.place_order(jsonb,jsonb,text,text,text,text) from anon, authenticated, public;
revoke execute on function public.create_order(jsonb,text,text,text,text) from anon, authenticated, public;
