# MA-001 · Auditoría contra Adventure Content Contract v1

**Objetivo:** comprobar si Cuadros / Las Viñas puede representarse con el contrato de contenido sin crear excepciones específicas.

## Leyenda

- `READY` = campo definido o suficientemente cubierto.
- `PARTIAL` = existe la estructura, faltan valores o validación.
- `PENDING_FIELD` = depende de inspección física.
- `PENDING_SOURCE` = depende de fuente/procedencia adicional.
- `MISSING` = el contrato contempla el campo pero MA-001 aún no tiene valor.
- `CONTRACT_GAP` = MA-001 revela una necesidad no contemplada todavía en el contrato.

---

## 1. Identidad

| Campo/bloque | Estado | Nota |
|---|---|---|
| `adventure_id` | READY | `MA-001` |
| `slug` | MISSING | Propuesta futura: `cuadros-las-vinas` |
| `title` | READY | Cuadros · Las Viñas |
| `subtitle` | READY | Agua, piedra y frontera |
| municipio/provincia/territorio | READY | Bedmar y Garcíez · Jaén · Sierra Mágina |
| `route_type` | READY | Circular |
| `activity_type` | PARTIAL | Senderismo implícito; debe declararse |
| `difficulty` | READY | Media, según fuente oficial |
| `target_audience` | MISSING | Debe definirse tras validar seguridad/familias |

## 2. Métricas

| Campo/bloque | Estado | Nota |
|---|---|---|
| distancia oficial | READY | 8,72 km |
| distancia track control | READY | ~8,987 km |
| duración oficial | READY | ~3 h |
| desnivel + / - canónico | PARTIAL | El control aporta datos, el canónico queda pendiente |
| cota mínima/máxima | PARTIAL | Control disponible; validar contra oficial/campo |
| inicio/final canónicos | PARTIAL | Punto de control disponible; fijar tras contraste |
| pendientes por tramo | MISSING | Deben calcularse del track canónico |

## 3. Tracks

| Tipo | Estado | Nota |
|---|---|---|
| `OFFICIAL` | PARTIAL | Fuente localizada; geometría pendiente de incorporar/contrastar |
| `CONTROL` | READY | KML de 776 puntos analizado |
| `FIELD` | PENDING_FIELD | Se grabará al recorrer la ruta |
| `COMMUNITY` | READY como concepto | No necesario para publicar RC1 |

## 4. Ciclo de vida

| Campo | Estado |
|---|---|
| estado editorial | READY: `FIELD_VALIDATION_PENDING` / publicación bloqueada |
| `created_at` / `updated_at` | MISSING |
| `last_content_review` | MISSING |
| `last_field_validation` | PENDING_FIELD |
| `next_review_due` | MISSING |
| responsables de edición/validación | MISSING |

## 5. Estado operativo y alertas

| Campo | Estado | Nota |
|---|---|---|
| `trail_status` | READY | Cerrado temporalmente según fuente oficial consultada durante preparación |
| `access_status` | PARTIAL | Debe revisarse antes de campo |
| `road_status` | PARTIAL | Se ha identificado necesidad de control de acceso viario |
| `water_status` | PARTIAL | Fuentes identificadas, estado/potabilidad pendiente |
| alerta estructurada | MISSING | Debe crearse como entidad temporal, no como texto incrustado |

## 6. Checkpoints

La estructura CP00–CP10 + FINAL está definida.

### Cubierto
- orden narrativo;
- tipo funcional;
- propósito;
- contenido;
- interacción candidata;
- XP candidato;
- seguridad conceptual;
- fotografía requerida;
- evidencia a recoger.

### Pendiente
- coordenadas finales;
- radios GPS;
- `required=true/false` definitivo;
- posición kilométrica de CP02, CP03, CP06 y CP09;
- activación desde camino incorrecto;
- precisión GPS real;
- punto seguro de parada.

**Estado:** `PARTIAL / PENDING_FIELD`.

## 7. POI y descubrimientos

Inventario avanzado: Adelfal, Los Sistillos, cornicabra, pinar, panorámica, olivar, geología, Fresneda/Fresnedilla, Torreón, Santuario, molino, Cueva del Agua y “túnel” pendiente.

### Pendientes clave
- normalizar categorías;
- convertir cada POI en registro con `poi_id` estable;
- resolver Fresneda/Fresnedilla;
- identificar físicamente molino;
- mantener “túnel” en `HOLD`.

**Estado:** `PARTIAL`.

## 8. Contenido y aprendizaje

**READY a nivel editorial inicial.**

Ya existen microhistorias/interacciones para agua, panorámica, paisaje cultivado, geología, Torreón, Santuario y Cueva del Agua.

Pendiente:
- tiempos de lectura reales;
- versiones cortas/largas definitivas;
- revisión de tono;
- fuente enlazada por pieza de contenido;
- posible versión audio futura.

## 9. Multimedia

**Shot list READY; assets reales MISSING/PENDING_FIELD.**

Faltan:
- portada definitiva;
- fotografías propias de cada MAJOR;
- autor/crédito/licencia;
- permiso de publicación;
- `alt_text`;
- geolocalización/fecha cuando proceda;
- moderación para contenido comunitario.

## 10. Procedencia

La jerarquía `OFICIAL / CONTRASTADO / CAMPO PENDIENTE / HOLD` está conceptualmente resuelta.

Falta convertir las fuentes en registros `source_id` y enlazar cada afirmación publicable con su procedencia concreta.

**Estado:** `PARTIAL`.

## 11. Seguridad y accesibilidad

### Cubierto conceptualmente
- riesgo de caída;
- agua/resbalón;
- tráfico;
- parada segura;
- cierre oficial;
- necesidad de no entrar en cuevas ni abandonar sendero.

### Sin datos suficientes todavía
- `family_friendly`;
- edad mínima recomendada;
- perros;
- bicicletas;
- sombra;
- superficie por tramos;
- cobertura móvil;
- cobertura GPS;
- vías de escape;
- sensibilidad a lluvia/calor;
- accesibilidad con carrito.

**Estado:** `PENDING_FIELD`.

## 12. Agua y servicios

### Agua
- Los Sistillos: identificado.
- Fresneda/Fresnedilla: identificada.
- Cueva/río: contexto natural, no fuente potable.

Potabilidad: `UNKNOWN` hasta señalización/verificación.

### Servicios
Aparcamiento y área recreativa conocidos documentalmente, pero deben validarse. Aseos, comida cercana, transporte público y acceso de emergencia deben estructurarse.

**Estado:** `PARTIAL`.

## 13. Reglas de completado

**MISSING.**

Antes de premios/ranking deben fijarse tras pruebas reales:
- cobertura mínima de track;
- checkpoints obligatorios;
- tolerancia de desviación;
- calidad GPS mínima;
- saltos permitidos;
- revisión manual excepcional;
- control antifraude.

No deben definirse cifras arbitrarias antes de probar MA-001 en campo.

## 14. Juego

**PARTIAL / diseño piloto.**

- XP candidato: definido.
- insignia `Guardián de Cuadros`: candidata.
- colección `Agua de Mágina`: candidata.
- velocidad: explícitamente sin bonus.

Falta validar la economía global para evitar inflación de XP entre rutas.

## 15. Ranking

La filosofía está definida a nivel de producto, pero MA-001 aún no define su contribución exacta a cada ranking.

Debe decidirse globalmente, no por ruta de forma artesanal.

**Estado:** `MISSING GLOBAL RULES`.

## 16. Recompensas

Existe modelo piloto `He completado Cuadros`, pero:
- partner: pendiente;
- recompensa real: pendiente;
- vigencia: pendiente;
- método de canje: pendiente;
- límites: pendiente;
- antifraude: depende de reglas de completado.

**Estado:** `PARTIAL`.

## 17. Comunidad

La ruta está preparada conceptualmente para recibir:
- tracks GPS;
- fotos;
- incidencias;
- cambios de señalización;
- obstáculos;
- agua;
- cierres;
- nuevos POI.

Falta probar el modelo con actividad real.

## 18. Privacidad

Cubierta a nivel de Biblia de Producto; no necesita valores específicos de MA-001 salvo posibles ubicaciones sensibles futuras.

## 19. Validación de campo

Checklist definido; ejecución pendiente.

**Estado:** `PENDING_FIELD`.

## 20. 2D / 3D / perfil

Requisitos de datos definidos.

Pendiente:
- geometría canónica final;
- perfil de elevación canónico;
- posiciones finales de CP/POI;
- decisión técnica posterior sobre motor 3D, fuera del alcance de este chat.

## 21. Admin/workflow

El contrato ya contempla estados, auditoría y versionado. MA-001 servirá como primer caso real de carga.

---

# GAPS DEL CONTRATO DETECTADOS POR MA-001

Antes de congelar el Content Contract conviene añadir estos campos generales:

## A. Sentido y variantes
- `recommended_direction`
- `route_variant_id`
- `parent_route_id`
- `variant_required`

Motivo: Las Viñas puede incluir pequeños ramales o desvíos como el Torreón.

## B. Offline
- `offline_ready`
- `offline_pack_revision`
- `offline_map_bounds`
- `offline_assets_complete`

Motivo: la cobertura móvil puede ser limitada y la aventura debe funcionar sin conexión.

## C. Idioma
- `default_locale`
- `available_locales`
- `translation_status`

Motivo: separar contenido de interfaz y permitir crecimiento turístico sin rediseñar entidades.

## D. Licencia del dato, no sólo de la imagen
- `data_license`
- `reuse_permission`
- `attribution_required`

Motivo: tracks, POI y contenidos también pueden tener condiciones de reutilización.

## E. Sensibilidad de localización
- `sensitive_location`
- `location_precision_public`

Motivo: algunos futuros puntos naturales/arquelógicos pueden requerir ocultar precisión exacta aunque el sistema interno la conozca.

---

# RESULTADO DE LA AUDITORÍA

MA-001 **encaja en el contrato sin necesitar una excepción específica de Cuadros**. Los huecos detectados son campos generales y reutilizables, por lo que la estrategia sigue siendo escalable.

Estimación actual:
- estructura de datos conceptual: ~90 % cubierta;
- valores reales de MA-001: ~65–75 % cubiertos;
- valores pendientes principales: campo, multimedia, reglas de completado, track oficial final y partner de recompensa.

## Próximo gate

1. incorporar los cinco gaps generales al Content Contract;
2. completar MA-001 con esos campos;
3. probar el contrato con una segunda aventura distinta;
4. congelar `Adventure Content Contract v1.0` sólo si la segunda ruta no obliga a inventar entidades nuevas.

> La prueba de escalabilidad no es que Cuadros funcione. Es que la siguiente aventura pueda crearse usando exactamente el mismo sistema.
