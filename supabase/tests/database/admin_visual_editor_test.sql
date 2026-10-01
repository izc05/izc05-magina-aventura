begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

select has_function(
  'public',
  'admin_get_route_geometry',
  array['uuid'],
  'admin_get_route_geometry exists'
);

select has_function(
  'public',
  'admin_route_editor_snapshot',
  array['uuid'],
  'admin_route_editor_snapshot exists'
);

select * from finish();
rollback;
