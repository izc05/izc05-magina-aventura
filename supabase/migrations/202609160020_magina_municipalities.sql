insert into public.municipalities(slug,name,active)
values
  ('albanchez-de-magina','Albanchez de Mágina',true),
  ('bedmar-y-garciez','Bedmar y Garcíez',true),
  ('belmez-de-la-moraleda','Bélmez de la Moraleda',true),
  ('cabra-del-santo-cristo','Cabra del Santo Cristo',true),
  ('cambil','Cambil',true),
  ('campillo-de-arenas','Campillo de Arenas',true),
  ('carcheles','Cárcheles',true),
  ('huelma','Huelma',true),
  ('jimena','Jimena',true),
  ('jodar','Jódar',true),
  ('la-guardia-de-jaen','La Guardia de Jaén',true),
  ('larva','Larva',true),
  ('mancha-real','Mancha Real',true),
  ('noalejo','Noalejo',true),
  ('pegalajar','Pegalajar',true),
  ('torres','Torres',true)
on conflict (slug) do update
set name=excluded.name,
    active=excluded.active;
