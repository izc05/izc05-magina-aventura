-- Route safety is user-facing information. Anonymous/authenticated users may
-- read only currently active incidents for published routes, while safety
-- administrators retain full access through the existing admin policy.

grant select on public.route_safety_incidents to anon, authenticated;

drop policy if exists "authenticated read open safety" on public.route_safety_incidents;

create policy "public read active safety for published routes"
on public.route_safety_incidents
for select
to anon, authenticated
using (
  status = 'open'
  and starts_at <= now()
  and (ends_at is null or ends_at > now())
  and exists (
    select 1
    from public.routes r
    where r.id = route_safety_incidents.route_id
      and r.status = 'published'
  )
);
