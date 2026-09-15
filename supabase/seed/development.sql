insert into public.municipalities (
  id,
  slug,
  name,
  active
) values (
  '00000000-0000-4000-8000-000000000001',
  'bedmar-y-garciez-dev',
  'Bedmar y Garcíez',
  true
);

insert into public.routes (
  id,
  municipality_id,
  slug,
  title,
  status,
  current_content_version,
  current_geometry_version
) values (
  '00000000-0000-4000-8000-000000000002',
  '00000000-0000-4000-8000-000000000001',
  'sendero-de-cuadros-dev',
  'Sendero de Cuadros',
  'draft',
  1,
  1
);

insert into public.route_versions (
  id,
  route_id,
  version,
  description,
  safety_notes,
  distance_km,
  elevation_gain_m,
  duration_minutes,
  difficulty,
  reward_xp,
  reward_olives,
  discovery_count,
  offline_available,
  development_fixture
) values (
  '00000000-0000-4000-8000-000000000003',
  '00000000-0000-4000-8000-000000000002',
  1,
  'Contenido de desarrollo pendiente de validación editorial.',
  '["Datos de seguridad pendientes de validación de campo."]'::jsonb,
  8.700,
  412,
  150,
  'moderate',
  750,
  120,
  7,
  false,
  true
);
