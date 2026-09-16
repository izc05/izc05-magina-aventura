-- Keep the database capability model explicit. An ordinary `admin` must not
-- automatically inherit capabilities introduced in future migrations.

create or replace function private.admin_has_capability(capability text, actor uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
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

revoke all on function private.admin_has_capability(text,uuid) from public;
grant execute on function private.admin_has_capability(text,uuid) to authenticated;
