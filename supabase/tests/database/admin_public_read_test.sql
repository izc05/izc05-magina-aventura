begin;

create extension if not exists pgtap with schema extensions;
select plan(5);

set local role anon;

select lives_ok(
  $$ select count(*) from public.app_settings $$,
  'anon can read public app settings without private admin function privileges'
);

select lives_ok(
  $$ select count(*) from public.community_chat_channels $$,
  'anon can read active community chat channels'
);

select lives_ok(
  $$ select count(*) from public.community_chat_messages $$,
  'anon can read visible community chat messages'
);

select lives_ok(
  $$ select count(*) from public.gamification_seasons $$,
  'anon can read active gamification seasons'
);

select lives_ok(
  $$ select count(*) from public.discovery_collections $$,
  'anon can read active discovery collections'
);

reset role;
select * from finish();
rollback;
