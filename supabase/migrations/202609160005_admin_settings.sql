create table public.app_settings (
  key text primary key,
  value jsonb not null,
  description text not null default '',
  public_readable boolean not null default false,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  check (length(btrim(key)) > 0)
);

alter table public.app_settings enable row level security;

grant select on public.app_settings to anon, authenticated;
grant insert, update on public.app_settings to authenticated;

create policy "public settings are readable"
on public.app_settings for select
to anon, authenticated
using (
  public_readable
  or private.admin_has_capability('settings.manage', auth.uid())
);

create policy "settings admins insert"
on public.app_settings for insert
to authenticated
with check (
  private.admin_has_capability('settings.manage', auth.uid())
  and updated_by = auth.uid()
);

create policy "settings admins update"
on public.app_settings for update
to authenticated
using (private.admin_has_capability('settings.manage', auth.uid()))
with check (
  private.admin_has_capability('settings.manage', auth.uid())
  and updated_by = auth.uid()
);

create trigger audit_app_settings
after insert or update or delete on public.app_settings
for each row execute function private.audit_row_change();

create or replace function private.admin_set_app_setting(
  setting_key text,
  setting_value jsonb,
  setting_description text,
  setting_public_readable boolean,
  actor uuid default auth.uid()
)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not private.admin_has_capability('settings.manage', actor) then
    raise exception 'not authorized';
  end if;
  if length(btrim(setting_key)) = 0 then
    raise exception 'setting key is required';
  end if;

  insert into public.app_settings(key,value,description,public_readable,updated_by,updated_at)
  values(setting_key,setting_value,coalesce(setting_description,''),setting_public_readable,actor,now())
  on conflict(key) do update
    set value=excluded.value,
        description=excluded.description,
        public_readable=excluded.public_readable,
        updated_by=actor,
        updated_at=now();
end;
$$;

revoke all on function private.admin_set_app_setting(text,jsonb,text,boolean,uuid) from public;
grant execute on function private.admin_set_app_setting(text,jsonb,text,boolean,uuid) to authenticated;

create or replace function public.admin_set_app_setting(
  setting_key text,
  setting_value jsonb,
  setting_description text,
  setting_public_readable boolean
)
returns void
language sql
security invoker
set search_path=''
as $$
  select private.admin_set_app_setting(setting_key,setting_value,setting_description,setting_public_readable,auth.uid());
$$;

revoke all on function public.admin_set_app_setting(text,jsonb,text,boolean) from public;
grant execute on function public.admin_set_app_setting(text,jsonb,text,boolean) to authenticated;

insert into public.app_settings(key,value,description,public_readable)
values
  ('features.community','true'::jsonb,'Activa la experiencia de comunidad pública.',true),
  ('features.rewards','true'::jsonb,'Activa el catálogo y canje de premios.',true),
  ('features.weather','true'::jsonb,'Activa la información meteorológica en la app.',true),
  ('app.maintenance_mode','false'::jsonb,'Pone la aplicación en modo mantenimiento.',true),
  ('rewards.reservation_minutes','60'::jsonb,'Minutos de reserva antes de devolver stock y aceitunas.',false),
  ('gps.default_checkpoint_radius_m','30'::jsonb,'Radio GPS por defecto para nuevos checkpoints.',false)
on conflict(key) do nothing;
