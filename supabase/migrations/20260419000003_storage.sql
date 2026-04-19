-- ============================================================================
-- Storage: meal images
-- ============================================================================

-- Private bucket. Path convention: {family_id}/{meal_id}.{ext}
insert into storage.buckets (id, name, public)
values ('meal-images', 'meal-images', false)
on conflict (id) do nothing;

-- SELECT: family members and admins.
create policy "meal_images_select"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'meal-images'
    and (
      (storage.foldername(name))[1]::uuid in (select public.auth_family_ids())
      or public.auth_is_admin()
    )
  );

-- INSERT / UPDATE / DELETE: family members only.
create policy "meal_images_insert"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'meal-images'
    and (storage.foldername(name))[1]::uuid in (select public.auth_family_ids())
  );

create policy "meal_images_update"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'meal-images'
    and (storage.foldername(name))[1]::uuid in (select public.auth_family_ids())
  );

create policy "meal_images_delete"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'meal-images'
    and (
      (storage.foldername(name))[1]::uuid in (select public.auth_family_ids())
      or public.auth_is_admin()
    )
  );
