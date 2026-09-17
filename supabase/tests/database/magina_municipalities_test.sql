begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

with expected(slug) as (
  values
    ('albanchez-de-magina'),
    ('bedmar-y-garciez'),
    ('belmez-de-la-moraleda'),
    ('cabra-del-santo-cristo'),
    ('cambil'),
    ('campillo-de-arenas'),
    ('carcheles'),
    ('huelma'),
    ('jimena'),
    ('jodar'),
    ('la-guardia-de-jaen'),
    ('larva'),
    ('mancha-real'),
    ('noalejo'),
    ('pegalajar'),
    ('torres')
)
select is(
  (select count(*)::integer from public.municipalities m join expected e using(slug) where m.active),
  16,
  'canonical Magina territory includes all 16 active municipalities'
);

with expected(slug,name) as (
  values
    ('albanchez-de-magina','Albanchez de Mágina'),
    ('bedmar-y-garciez','Bedmar y Garcíez'),
    ('belmez-de-la-moraleda','Bélmez de la Moraleda'),
    ('cabra-del-santo-cristo','Cabra del Santo Cristo'),
    ('cambil','Cambil'),
    ('campillo-de-arenas','Campillo de Arenas'),
    ('carcheles','Cárcheles'),
    ('huelma','Huelma'),
    ('jimena','Jimena'),
    ('jodar','Jódar'),
    ('la-guardia-de-jaen','La Guardia de Jaén'),
    ('larva','Larva'),
    ('mancha-real','Mancha Real'),
    ('noalejo','Noalejo'),
    ('pegalajar','Pegalajar'),
    ('torres','Torres')
)
select is(
  (select count(*)::integer
     from expected e
     join public.municipalities m on m.slug=e.slug and m.name=e.name
    where m.active),
  16,
  'canonical Magina municipality names match the product catalogue'
);

select * from finish();
rollback;
