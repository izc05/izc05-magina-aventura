# MÁGINA AVENTURA
## Adventure Content Contract v1
### Diccionario Canónico de Campos de Aventura

**Estado:** BORRADOR CANÓNICO PARA VALIDACIÓN CON MA-001  
**Objetivo:** Definir todos los campos que una aventura debe poder almacenar y gestionar de forma escalable.

---

# 1. IDENTIDAD

## Obligatorios
- `adventure_id`
- `slug`
- `title`
- `subtitle`
- `municipality`
- `province`
- `territory`
- `route_type`
- `activity_type`
- `difficulty`
- `status`

## Opcionales
- `short_description`
- `long_description`
- `cover_image_id`
- `theme`
- `narrative_arc`
- `target_audience`
- `featured`

---

# 2. MÉTRICAS DE RUTA

## Base
- `distance_m`
- `duration_estimated_min`
- `elevation_gain_m`
- `elevation_loss_m`
- `elevation_min_m`
- `elevation_max_m`
- `start_lat`
- `start_lon`
- `end_lat`
- `end_lon`

## Derivados / calculados
- `route_bounds`
- `route_center`
- `max_grade_pct`
- `average_grade_pct`
- `technical_score`
- `exposure_score`

---

# 3. GEOMETRÍA Y TRACKS

Cada aventura puede tener varias geometrías.

## Tipos
- `OFFICIAL`
- `CONTROL`
- `FIELD`
- `COMMUNITY`
- `ARCHIVED`

## Campos por track
- `track_id`
- `adventure_id`
- `track_type`
- `source_name`
- `source_url`
- `source_authority`
- `file_format`
- `file_ref`
- `geometry`
- `track_points_count`
- `distance_m`
- `elevation_gain_m`
- `elevation_loss_m`
- `elevation_min_m`
- `elevation_max_m`
- `created_at`
- `verified_at`
- `confidence`
- `is_canonical`

---

# 4. ESTADO Y CICLO DE VIDA

## Estado editorial
- `DRAFT`
- `CONTENT_READY`
- `FIELD_VALIDATION_PENDING`
- `READY_FOR_REVIEW`
- `PUBLISHED`
- `TEMPORARILY_CLOSED`
- `ARCHIVED`

## Fechas
- `created_at`
- `updated_at`
- `published_at`
- `last_content_review`
- `last_field_validation`
- `next_review_due`

## Responsabilidad
- `created_by`
- `last_edited_by`
- `validated_by`

---

# 5. ESTADO OPERATIVO Y ALERTAS

## Estado
- `access_status`
- `trail_status`
- `road_status`
- `water_status`
- `seasonal_status`

## Alertas
- `alert_id`
- `alert_type`
- `severity`
- `title`
- `message`
- `valid_from`
- `valid_until`
- `source`
- `source_url`
- `verified_at`
- `active`

---

# 6. CHECKPOINTS

## Campos base
- `checkpoint_id`
- `adventure_id`
- `sequence`
- `name`
- `slug`
- `type`
- `lat`
- `lon`
- `elevation_m`
- `km_from_start`
- `activation_radius_m`
- `required`
- `status`

## Tipos
- `START`
- `NAV`
- `DISCOVERY`
- `MAJOR`
- `SAFETY`
- `FINAL`

## Experiencia
- `title`
- `short_text`
- `full_text`
- `interaction_type`
- `interaction_payload`
- `xp_reward`
- `collection_id`
- `badge_id`

## Observabilidad
- `observable`
- `what_to_observe`
- `observation_direction`
- `observation_hint`

## Seguridad
- `safe_stop_area`
- `fall_risk`
- `water_risk`
- `traffic_risk`
- `slip_risk`
- `exposure_level`
- `notes_safety`

## Campo
- `field_validation_status`
- `field_validated_at`
- `gps_accuracy_m`
- `wrong_path_activation_possible`
- `field_notes`

---

# 7. POI / DESCUBRIMIENTOS

- `poi_id`
- `adventure_id`
- `name`
- `category`
- `lat`
- `lon`
- `elevation_m`
- `km_from_start`
- `mandatory`
- `visible_on_map`
- `unlock_mode`
- `short_story`
- `full_story`
- `xp_reward`
- `collection_id`
- `status`

## Categorías ejemplo
- agua
- patrimonio
- geología
- flora
- fauna
- mirador
- historia
- leyenda
- servicio
- seguridad
- cultura
- gastronomía

---

# 8. CONTENIDO Y APRENDIZAJE

Cada contenido debe poder existir como unidad reutilizable.

- `content_id`
- `content_type`
- `title`
- `body`
- `reading_time_sec`
- `difficulty_level`
- `audience`
- `source_id`
- `fact_status`
- `published`

## Tipos
- `MICRO_STORY`
- `HISTORY`
- `LEGEND`
- `NATURE`
- `GEOLOGY`
- `CULTURE`
- `SAFETY`
- `QUIZ`
- `TIMELINE`
- `PHOTO_HOTSPOT`
- `AUDIO`

---

# 9. MULTIMEDIA

- `media_id`
- `media_type`
- `file_ref`
- `source`
- `author`
- `credit`
- `license`
- `publication_permission`
- `captured_at`
- `lat`
- `lon`
- `alt_text`
- `caption`
- `moderation_status`
- `usage_role`

## Roles
- `COVER`
- `HERO`
- `CONTEXT`
- `DETAIL`
- `NAV`
- `EVIDENCE`
- `COMMUNITY`

---

# 10. PROCEDENCIA Y CONFIANZA

## Fuente
- `source_id`
- `source_type`
- `authority`
- `title`
- `url`
- `publication_date`
- `verified_at`

## Confianza
- `A` = oficial / comprobado
- `B` = contrastado
- `C` = comunitario fiable
- `D` = pendiente

## Estado factual
- `VERIFIED`
- `CONTRASTED`
- `FIELD_PENDING`
- `SOURCE_PENDING`
- `HOLD`
- `NOT_PUBLISHABLE`

---

# 11. SEGURIDAD Y ACCESIBILIDAD

- `family_friendly`
- `recommended_min_age`
- `stroller_access`
- `bike_allowed`
- `dog_policy`
- `technical_skill`
- `exposure_level`
- `shade_level`
- `surface_type`
- `mobile_coverage`
- `gps_coverage`
- `escape_routes`
- `emergency_notes`
- `season_restrictions`
- `weather_sensitivity`

---

# 12. AGUA Y SERVICIOS

## Agua
- `water_point_id`
- `type`
- `lat`
- `lon`
- `potability_status`
- `flow_status`
- `seasonal`
- `last_checked_at`

## Servicios
- `parking`
- `toilets`
- `food_nearby`
- `public_transport`
- `emergency_access`
- `visitor_center`
- `rest_area`

---

# 13. REGLAS DE COMPLETADO

- `completion_rule`
- `minimum_route_coverage_pct`
- `required_checkpoint_ids`
- `minimum_required_checkpoints`
- `allowed_route_deviation_m`
- `gps_quality_required`
- `maximum_checkpoint_skip`
- `manual_review_required`
- `anti_spoof_required`

---

# 14. JUEGO

## XP
- `base_completion_xp`
- `checkpoint_xp`
- `discovery_xp`
- `bonus_xp`

## Insignias
- `badge_id`
- `name`
- `description`
- `condition`

## Colecciones
- `collection_id`
- `name`
- `description`
- `required_items`

## Progreso
- `user_adventure_progress`
- `checkpoint_progress`
- `discovery_progress`
- `completion_status`

---

# 15. RANKING

- `ranking_scope`
- `ranking_period`
- `ranking_metric`
- `eligible_activity_types`
- `minimum_validation_level`
- `anti_fraud_rules`
- `tie_break_rule`

## Principio
La velocidad no debe ser el criterio principal de recompensa.

---

# 16. RECOMPENSAS E INCENTIVOS

- `reward_id`
- `partner_id`
- `title`
- `description`
- `reward_type`
- `condition_type`
- `condition_payload`
- `valid_from`
- `valid_until`
- `max_redemptions`
- `per_user_limit`
- `redemption_method`
- `qr_or_code`
- `status`

---

# 17. NEGOCIOS COLABORADORES

- `partner_id`
- `name`
- `category`
- `municipality`
- `address`
- `lat`
- `lon`
- `contact`
- `website`
- `active`
- `rewards`
- `sponsor_status`

---

# 18. COMUNIDAD

## Actividad
- `activity_id`
- `user_id`
- `adventure_id`
- `track`
- `distance_m`
- `duration_sec`
- `elevation_gain_m`
- `started_at`
- `finished_at`
- `privacy`

## Aportaciones
- `contribution_id`
- `type`
- `user_id`
- `adventure_id`
- `checkpoint_id`
- `poi_id`
- `lat`
- `lon`
- `text`
- `media_id`
- `created_at`
- `moderation_status`
- `confidence`

## Tipos
- foto
- incidencia
- señalización
- obstáculo
- agua
- cierre
- cambio de trazado
- nuevo POI
- comentario de campo

---

# 19. PRIVACIDAD

- `activity_visibility`
- `share_track`
- `share_photos`
- `allow_data_improvement_use`
- `hide_start_end`
- `privacy_radius_m`
- `community_profile_visibility`

---

# 20. VALIDACIÓN DE CAMPO

- `validation_id`
- `adventure_id`
- `date`
- `validator`
- `field_track_id`
- `weather`
- `route_pass`
- `checkpoint_pass`
- `safety_pass`
- `signage_pass`
- `access_pass`
- `photos_complete`
- `discrepancies`
- `notes`
- `result`

## Resultado
- `PASS`
- `REVIEW`
- `FAIL`

---

# 21. 2D / 3D / PERFIL

## Datos requeridos
- `geometry`
- `elevation_profile`
- `distance_profile`
- `checkpoint_positions`
- `poi_positions`

## Visualización
- `map_2d_enabled`
- `map_3d_enabled`
- `elevation_profile_enabled`
- `route_replay_enabled`
- `terrain_exaggeration`
- `camera_presets`

---

# 22. ADMIN / WORKFLOW

Cada elemento editable debe soportar:
- `draft`
- `review`
- `approved`
- `published`
- `archived`

## Auditoría
- `created_at`
- `created_by`
- `updated_at`
- `updated_by`
- `version`
- `change_note`

---

# 23. CAMPOS CALCULADOS

No deben introducirse manualmente si pueden obtenerse del track:

- distancia
- bounding box
- centro
- perfil de elevación
- máximo/mínimo
- desnivel acumulado
- km de cada checkpoint
- km de cada POI
- pendiente por segmento
- proximidad a track
- desviación de actividad respecto al track

---

# 24. CAMPOS OBLIGATORIOS PARA PUBLICAR

Una aventura no puede publicarse sin:

- identidad
- geometría canónica
- inicio/final
- distancia
- dificultad
- duración estimada
- estado operativo
- fuentes principales
- seguridad mínima
- checkpoints obligatorios definidos
- validación de campo vigente
- imágenes mínimas
- contenido revisado
- reglas de completado
- estado `PUBLISHED`

---

# 25. TEST DE ESCALABILIDAD

Este contrato se considerará estable cuando:

1. MA-001 Cuadros pueda representarse sin excepciones.
2. Una segunda ruta distinta pueda cargarse sin inventar campos nuevos.
3. El admin pueda crear ambas sin modificar código.
4. El mapa 2D/3D consuma los mismos tipos de datos.
5. Juego, ranking y recompensas funcionen con las mismas entidades.

---

# PRINCIPIO FINAL

> Una nueva aventura debe ser **nuevo contenido**, no nuevo código.
