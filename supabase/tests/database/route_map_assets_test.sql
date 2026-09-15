begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

select has_table('public', 'route_map_assets', 'route_map_assets exists');
select has_column('public', 'route_map_assets', 'object_key', 'object_key exists');
select has_column('public', 'route_map_assets', 'geometry_version', 'geometry_version exists');
select has_column('public', 'route_map_assets', 'public_url', 'public_url exists');
select has_column('public', 'route_map_assets', 'style_template_url', 'style_template_url exists');
select has_column('public', 'route_map_assets', 'bounds', 'bounds exists');
select ok(
  coalesce((
    select relrowsecurity
    from pg_class
    where oid = to_regclass('public.route_map_assets')
  ), false),
  'RLS enabled on route_map_assets'
);

select * from finish();
rollback;
