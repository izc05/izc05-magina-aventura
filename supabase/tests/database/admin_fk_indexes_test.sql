create extension if not exists pgtap with schema extensions;

begin;

select plan(1);

with fk as (
  select c.conrelid, c.conname, c.conkey
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
      and (i.indkey::smallint[])[1:cardinality(fk.conkey)] = fk.conkey
  )
)
select is((select count(*)::int from missing), 0, 'all public foreign keys have a covering leading-column index');

select * from finish();
rollback;
