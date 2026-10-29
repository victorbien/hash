drop policy if exists "Volunteers read their training progress"
  on public.volunteer_training_progress;
create policy "Approved volunteers read their training progress"
  on public.volunteer_training_progress
  for select to authenticated using (
    public.is_hash_admin()
    or (
      volunteer_id = (select auth.uid())
      and exists (
        select 1
        from public.volunteer_applications application
        where application.user_id = (select auth.uid())
          and application.status = 'approved'
      )
    )
  );

drop policy if exists "Volunteers record their own training progress"
  on public.volunteer_training_progress;
create policy "Approved volunteers record their own training progress"
  on public.volunteer_training_progress
  for insert to authenticated with check (
    volunteer_id = (select auth.uid())
    and status = 'in_progress'
    and exists (
      select 1
      from public.volunteer_applications application
      where application.user_id = (select auth.uid())
        and application.status = 'approved'
    )
  );

drop policy if exists "Volunteers update their own training progress"
  on public.volunteer_training_progress;
create policy "Approved volunteers update their own training progress"
  on public.volunteer_training_progress
  for update to authenticated using (
    public.is_hash_admin()
    or (
      volunteer_id = (select auth.uid())
      and exists (
        select 1
        from public.volunteer_applications application
        where application.user_id = (select auth.uid())
          and application.status = 'approved'
      )
    )
  )
  with check (
    public.is_hash_admin() or (
      volunteer_id = (select auth.uid())
      and status = 'in_progress'
      and exists (
        select 1
        from public.volunteer_applications application
        where application.user_id = (select auth.uid())
          and application.status = 'approved'
      )
    )
  );

drop policy if exists "Volunteers read published permitted training resources"
  on public.training_resources;
create policy "Approved volunteers read published training resources"
  on public.training_resources
  for select to authenticated using (
    status = 'published'
    and exists (
      select 1
      from public.volunteer_applications application
      where application.user_id = (select auth.uid())
        and application.status = 'approved'
    )
  );

drop policy if exists "Volunteers read permitted private volunteer resources"
  on storage.objects;
create policy "Approved volunteers read permitted private volunteer resources"
  on storage.objects
  for select to authenticated using (
    bucket_id = 'volunteer-resources'
    and exists (
      select 1
      from public.training_resources resource
      join public.volunteer_applications application
        on application.user_id = (select auth.uid())
      where resource.resource_path = name
        and resource.status = 'published'
        and application.status = 'approved'
    )
  );
