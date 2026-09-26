# MÁGINA AVENTURA
## Adventure Content Contract v1.1 — Draft Delta

**Estado:** BORRADOR DE AMPLIACIÓN
**Motivo:** gaps detectados al cruzar el contrato v1 con MA-001 Cuadros / Las Viñas.

Este documento **no sustituye todavía** al contrato v1. Registra únicamente los campos generales que deben añadirse antes de congelar el contrato.

---

## 1. SENTIDO, RAMALES Y VARIANTES

Añadir a `Adventure` / `Track`:

- `recommended_direction`: `CLOCKWISE | COUNTERCLOCKWISE | BIDIRECTIONAL | NONE`
- `route_variant_id`
- `parent_route_id`
- `variant_type`: `OPTIONAL_BRANCH | ALTERNATIVE | SHORTCUT | SEASONAL | ACCESS`
- `variant_required`
- `variant_start_km`
- `variant_end_km`

**Motivo:** una aventura puede tener ramales como el acceso al Torreón sin convertirse en una ruta completamente distinta.

---

## 2. SEGMENTOS DE RUTA

Nueva entidad reutilizable: `RouteSegment`.

Campos mínimos:

- `segment_id`
- `adventure_id`
- `sequence`
- `from_checkpoint_id`
- `to_checkpoint_id`
- `start_km`
- `end_km`
- `distance_m`
- `elevation_gain_m`
- `elevation_loss_m`
- `average_grade_pct`
- `max_grade_pct`
- `surface_type`
- `shade_level`
- `technical_level`
- `exposure_level`
- `water_crossing`
- `traffic_exposure`
- `navigation_complexity`
- `safety_notes`
- `geometry_ref`
- `field_validation_status`

**Motivo:** MA-001 cambia claramente de carácter entre río, subida, zona alta y retorno. El detalle por tramo será necesario para navegación, seguridad, 3D y perfil.

---

## 3. OFFLINE

Añadir a `Adventure`:

- `offline_ready`
- `offline_pack_revision`
- `offline_map_bounds`
- `offline_track_complete`
- `offline_content_complete`
- `offline_media_policy`
- `offline_pack_size_bytes`

**Motivo:** una aventura de montaña no debe depender de cobertura móvil constante.

---

## 4. IDIOMAS Y TRADUCCIONES

Añadir a entidades con contenido textual:

- `default_locale`
- `available_locales`
- `translation_status`
- `translation_revision`

Preferencia: los textos traducibles deben separarse del dato físico de ruta para evitar duplicar geometría por idioma.

---

## 5. LICENCIA DE DATOS

Añadir a tracks, fuentes, POI y contenidos cuando proceda:

- `data_license`
- `reuse_permission`
- `attribution_required`
- `attribution_text`
- `derivative_allowed`

**Motivo:** los derechos no afectan sólo a fotografías. Tracks, cartografía, textos y datos externos también pueden tener condiciones de reutilización.

---

## 6. LOCALIZACIONES SENSIBLES

Añadir a POI/checkpoints/descubrimientos:

- `sensitive_location`
- `internal_location_precision_m`
- `public_location_precision_m`
- `location_visibility_rule`

**Motivo:** futuras rutas pueden incluir yacimientos, fauna/flora sensible o patrimonio vulnerable cuya coordenada exacta no deba publicarse.

---

## 7. ANCLAJE MULTIMEDIA A LA RUTA

Ampliar `Media` con:

- `adventure_id`
- `checkpoint_id`
- `poi_id`
- `segment_id`
- `route_distance_m`
- `capture_heading_deg`
- `capture_pitch_deg`
- `is_reference_view`

**Motivo:** permite que las fotografías aparezcan exactamente en el punto del recorrido, como referencia visual o hotspot, y posibilita sincronización con mapa/perfil/3D.

---

## 8. CAPÍTULOS NARRATIVOS

Nueva entidad opcional: `AdventureChapter`.

Campos:

- `chapter_id`
- `adventure_id`
- `sequence`
- `title`
- `subtitle`
- `start_checkpoint_id`
- `end_checkpoint_id`
- `theme`
- `intro_content_id`
- `completion_content_id`

**Motivo:** MA-001 ya se divide naturalmente en Agua, Subida, Paisaje/Piedra, Frontera y Memoria/Regreso. Debe poder representarse sin hardcodear capítulos específicos.

---

## 9. REGLAS METEOROLÓGICAS / ESTACIONALES

Ampliar seguridad con:

- `season_recommendation`
- `heat_sensitivity`
- `rain_sensitivity`
- `flood_sensitivity`
- `snow_ice_sensitivity`
- `wind_sensitivity`
- `weather_rule_source`

No implica automatizar alertas todavía; sólo garantizar que el modelo puede expresar la relación entre ruta y condiciones.

---

## 10. PUBLICATION GATE ESTRUCTURADO

Añadir:

- `publication_gate_status`
- `publication_gate_reasons[]`
- `blocking_validation_ids[]`
- `blocking_alert_ids[]`
- `gate_last_evaluated_at`

Estados:

- `OPEN`
- `BLOCKED_OFFICIAL_CLOSURE`
- `BLOCKED_FIELD_VALIDATION`
- `BLOCKED_CONTENT`
- `BLOCKED_SAFETY`
- `BLOCKED_MULTIPLE`

**Motivo:** MA-001 demuestra que contenido completo no equivale a ruta publicable.

---

# CONCLUSIÓN

Con estas ampliaciones, el contrato cubre mejor una aventura real sin introducir campos específicos de Cuadros.

El siguiente test será cargar una segunda aventura de naturaleza distinta. Si no aparecen nuevas entidades estructurales, este delta se integrará en la siguiente versión estable del contrato.
