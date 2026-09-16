begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

select has_function(
  'public','admin_upsert_route_map_asset',
  array['uuid','text','text','bigint','numeric','numeric','text','text','text'],
  'admin_upsert_route_map_asset exists'
);
select has_function('public','admin_delete_route_map_asset',array['uuid'],'admin_delete_route_map_asset exists');

select * from finish();
rollback;
