begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

select has_function(
  'public','admin_update_route_content',
  array['uuid','text','jsonb','numeric','integer','integer','text','integer','integer','boolean'],
  'admin_update_route_content exists'
);

select has_function('public','admin_save_route_geometry',array['uuid','text'],'versioned admin_save_route_geometry exists');

select * from finish();
rollback;
