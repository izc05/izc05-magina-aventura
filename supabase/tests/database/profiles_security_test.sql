begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table('public', 'profiles', 'profiles exists');
select has_column('public', 'profiles', 'id', 'profiles.id exists');
select has_column('public', 'profiles', 'display_name', 'profiles.display_name exists');
select has_column('public', 'profiles', 'avatar_url', 'profiles.avatar_url exists');
select has_column('public', 'profiles', 'home_municipality_id', 'profiles.home_municipality_id exists');
select ok(
  coalesce((
    select relrowsecurity
    from pg_class
    where oid = to_regclass('public.profiles')
  ), false),
  'RLS enabled on profiles'
);
select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_select_own'
  ),
  'profiles_select_own policy exists'
);
select ok(
  exists(
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'profiles'
      and policyname = 'profiles_update_own'
  ),
  'profiles_update_own policy exists'
);

select * from finish();
rollback;
