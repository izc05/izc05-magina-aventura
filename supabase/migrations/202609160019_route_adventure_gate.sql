-- Temporary route closures are represented by active safety incidents instead
-- of archiving/deleting a published route.

alter table public.route_safety_incidents
  add column blocks_adventure boolean not null default false;

create or replace function public.route_adventure_gate(target_route_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path=''
as $$
  select jsonb_build_object(
    'route_id', target_route_id,
    'published', exists(
      select 1 from public.routes r
      where r.id=target_route_id and r.status='published'
    ),
    'can_start',
      exists(select 1 from public.routes r where r.id=target_route_id and r.status='published')
      and not exists(
        select 1
        from public.route_safety_incidents s
        where s.route_id=target_route_id
          and s.status='open'
          and s.blocks_adventure
          and s.starts_at <= now()
          and (s.ends_at is null or s.ends_at > now())
      ),
    'blocking_incidents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,
        'title',s.title,
        'description',s.description,
        'severity',s.severity,
        'starts_at',s.starts_at,
        'ends_at',s.ends_at
      ) order by s.starts_at desc)
      from public.route_safety_incidents s
      where s.route_id=target_route_id
        and s.status='open'
        and s.blocks_adventure
        and s.starts_at <= now()
        and (s.ends_at is null or s.ends_at > now())
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.route_adventure_gate(uuid) from public;
grant execute on function public.route_adventure_gate(uuid) to anon, authenticated;
