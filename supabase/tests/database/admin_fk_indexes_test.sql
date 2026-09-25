create extension if not exists pgtap with schema extensions;

begin;

select plan(1);

with fk as (
  select
    c.conrelid::regclass::text as table_name,
    c.conname,
    c.conrelid,
    c.conkey
  from pg_constraint c
  where c.contype = 'f'
    and c.connamespace = 'public'::regnamespace
), missing as (
  select fk.*
  from fk
  where not exists (
    select 1
    from pg_index i
    where i.indrelid = fk.conrelid
      and i.indisvalid
      and i.indisready
      and (string_to_array(i.indkey::text, ' ')::smallint[])[1:cardinality(fk.conkey)] = fk.conkey
  )
)
select is(
  (select coalesce(string_agg(table_name || '.' || conname, ', '), '') from missing),
  '',
  'all public foreign keys have a covering leading-column index'
);

select * from finish();
rollback;
