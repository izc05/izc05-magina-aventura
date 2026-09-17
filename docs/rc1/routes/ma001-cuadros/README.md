# MA-001 · Cuadros / Las Viñas — índice de trabajo RC1

Rama documental: `docs/ma001-cuadros-rc1-content`

## Regla de esta rama

Esta rama **NO modifica** la Master Spec RC1 ni el plan de integración aprobados. Su función es preparar el contenido canónico, datos, procedencia y validación de campo de la primera aventura maestra.

## Documentos

- `MA001_CUADROS_FICHA_MAESTRA_RC1.md` — identidad, track, checkpoints, POI, imágenes, juego, 3D, seguridad y checklist físico.
- `MA001_CUADROS_GUION_JUGABLE_RC1_v02_PART1.md` — concepto, activaciones y CP00–CP05.
- `MA001_CUADROS_GUION_JUGABLE_RC1_v02_PART2.md` — CP06–CP10 + descubrimientos opcionales.
- `MA001_CUADROS_GUION_JUGABLE_RC1_v02_PART3.md` — final, XP, fotografía, procedencia, fuentes y gate de publicación.
- `MA001_CONTENT_CONTRACT_AUDIT_v1.md` — cruce de MA-001 contra el Adventure Content Contract para localizar campos pendientes.
- `MA001_FIELD_DAY_RUNBOOK_v0_1.md` — protocolo humano para la futura jornada de validación física.

## Documentos globales relacionados

- `docs/product/BIBLIA_MAGINA_AVENTURA_CANONICA.md`
- `docs/product/MAGINA_AVENTURA_ADVENTURE_CONTENT_CONTRACT_v1.md`
- `docs/product/MAGINA_AVENTURA_ADVENTURE_CONTENT_CONTRACT_v1_1_DRAFT_DELTA.md`

## Datos estructurados MA-001

- `data/routes/ma001-cuadros/MA001_CUADROS_DATA_RECORD_v0_1.json` — registro estructurado base.
- `data/routes/ma001-cuadros/MA001_ROUTE_MASTER_v0_2.json` — Route Master de trabajo que conecta identidad, tracks, narrativa, checkpoints, gates y requisitos de admin.
- `data/routes/ma001-cuadros/MA001_ROUTE_SEGMENTS_v0_1.json` — nueve segmentos físicos del recorrido.
- `data/routes/ma001-cuadros/validation/MA001_FIELD_VALIDATION_TEMPLATE_v0_1.json` — formulario estructurado para validación física.
- `data/routes/ma001-cuadros/media/MA001_MEDIA_MANIFEST_v0_1.json` — inventario de imágenes requeridas, roles y gate multimedia.
- `data/routes/ma001-cuadros/control/MA001_Cuadros_LasVinas_CONTROL_summary.json` — resumen técnico del track comunitario de control.

El track comunitario de Wikiloc se considera exclusivamente `CONTROL_ONLY`. La geometría canónica deberá proceder del track oficial contrastado y de la posterior validación de campo.

## Estado

- Identidad: definida.
- Biblia de producto: definida.
- Content Contract: v1 + delta v1.1 en validación.
- Route Master: v0.2 creado.
- Track de control: analizado.
- Track oficial: localizado, incorporación/contraste pendiente.
- Segmentos: 9 segmentos de trabajo definidos.
- Checkpoints: candidatos avanzados.
- Narrativa: avanzada.
- Imágenes: manifiesto definido; producción/permiso pendiente.
- Juego: XP e insignias en modo piloto.
- Plantilla de validación física: lista.
- Runbook de salida de campo: listo.
- Validación física: pendiente.
- Publicación: bloqueada hasta reapertura oficial y validación.

## Gates actuales

`MA001_PUBLICATION = BLOCKED_MULTIPLE`

Bloqueos:

1. reapertura oficial pendiente de confirmar;
2. track oficial pendiente de incorporar/contrastar;
3. FIELD_TRACK pendiente;
4. checkpoints obligatorios pendientes de PASS;
5. multimedia obligatoria pendiente de captura.

## Próximos pasos

1. obtener e incorporar el track oficial íntegro;
2. preparar comparación `OFFICIAL_TRACK ↔ CONTROL_TRACK`;
3. cuando exista reapertura, ejecutar el Field Day Runbook;
4. comparar `OFFICIAL_TRACK ↔ CONTROL_TRACK ↔ FIELD_TRACK`;
5. resolver radios, coordenadas y POI pendientes;
6. congelar reglas de completado tras prueba real;
7. probar el contrato con MA-002 sin añadir lógica específica.

## Principio

> MA-001 debe convertirse en la plantilla que permita crear MA-002 y siguientes como nuevo contenido, no como nuevo código.
