begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

select ok(
  to_regprocedure('public.handle_new_user()') is not null,
  'handle_new_user function exists'
);

select ok(
  exists(
    select 1
    from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'auth'
      and c.relname = 'users'
      and t.tgname = 'on_auth_user_created'
      and not t.tgisinternal
  ),
  'auth user creation trigger exists'
);

select * from finish();
rollback;
