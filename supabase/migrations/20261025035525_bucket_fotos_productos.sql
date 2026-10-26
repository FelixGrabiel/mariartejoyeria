insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "admin_sube_fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images'
    and exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_edita_fotos" on storage.objects for update to authenticated
  using (bucket_id = 'product-images'
    and exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
create policy "admin_borra_fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'product-images'
    and exists (select 1 from public.staff_profiles s where s.user_id = (select auth.uid()) and s.role = 'admin'));
