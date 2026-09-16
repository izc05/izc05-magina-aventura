-- Keep the database capability model explicit. An ordinary `admin` must not
-- automatically inherit capabilities introduced in future migrations.
-- Bind actor-bearing authorization to the real JWT user so a caller cannot
-- impersonate another administrator by supplying an arbitrary UUID.

create or replace function private.admin_has_capability(capability text, actor uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select actor is not null
    and actor = auth.uid()
    and exists (
      select 1
      from public.user_admin_roles uar
      where uar.user_id = actor
        and (
          uar.role_id = 'super_admin'
          or (
            uar.role_id = 'admin'
            and capability = any(array[
              'dashboard.read','routes.manage','map.manage','discoveries.manage','media.manage',
              'users.read','community.manage','moderation.manage','gamification.manage','olives.manage',
              'rewards.manage','partners.manage','redemptions.manage','notifications.manage','safety.manage',
              'audit.read','settings.manage'
            ])
          )
          or (
            uar.role_id = 'route_manager'
            and capability = any(array['dashboard.read','routes.manage','map.manage','discoveries.manage','media.manage'])
          )
          or (
            uar.role_id = 'moderator'
            and capability = any(array['dashboard.read','users.read','community.manage','moderation.manage','audit.read'])
          )
          or (
            uar.role_id = 'partner'
            and capability = any(array['dashboard.read','rewards.manage','redemptions.manage'])
          )
        )
    );
$$;

-- Supabase can grant EXECUTE on newly created public functions directly to
-- `anon`. Public RPCs that enter the private Admin layer must remain
-- SECURITY INVOKER and callable only after authentication.
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure::text as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.prokind='f'
      and pg_get_functiondef(p.oid) ilike '%private.%'
  loop
    execute format('alter function public.%s security invoker', fn.signature);
    execute format('revoke execute on function public.%s from anon', fn.signature);
    execute format('grant execute on function public.%s to authenticated', fn.signature);
  end loop;
end $$;
