# MA-001 · Cuadros / Las Viñas
## Freeze Checklist v0.1

**Objetivo:** definir qué debe estar resuelto para considerar MA-001 cerrada como primera aventura maestra de contenido.

---

## 1. Cerrado desde escritorio

- [x] Identidad de aventura.
- [x] Tema narrativo `Agua, piedra y frontera`.
- [x] Arco narrativo por capítulos.
- [x] Estructura CP00 → FINAL.
- [x] Diferenciación entre checkpoints, descubrimientos y segmentos.
- [x] Guion jugable v0.2.
- [x] XP piloto sin premio por velocidad.
- [x] Colecciones piloto.
- [x] Concepto de recompensa local.
- [x] Route Master v0.2.
- [x] Nueve segmentos de trabajo.
- [x] Plantilla de validación física.
- [x] Runbook de salida de campo.
- [x] Manifiesto multimedia.
- [x] Registro de fuentes/procedencia.
- [x] Publication Gate estructurado.
- [x] Adventure Content Contract v1 probado contra MA-001.
- [x] Delta v1.1 generado con gaps generales.

---

## 2. Pendiente de fuente oficial

- [ ] Descargar y conservar KML oficial de Junta.
- [ ] Descargar y conservar KML oficial de Jaén Paraíso Interior/Diputación si sigue disponible.
- [ ] Comparar ambas geometrías oficiales.
- [ ] Resolver discrepancia entre coordenada de inicio publicada y track de control.
- [ ] Confirmar reapertura oficial antes de cualquier uso público o salida de validación.
- [ ] Confirmar estado actualizado del acceso por carretera.

Estos elementos no se sustituyen con tracks comunitarios.

---

## 3. Pendiente exclusivamente de campo

- [ ] FIELD_TRACK completo.
- [ ] Punto exacto CP02 Los Sistillos.
- [ ] Punto exacto CP03 cambio de subida.
- [ ] Mejor ubicación segura CP04 panorámica.
- [ ] Mejor lectura visual CP05 paisaje cultivado.
- [ ] Punto exacto CP06 geología.
- [ ] Topónimo real Fresneda/Fresnedilla.
- [ ] Estado/caudal/señalización CP07.
- [ ] Acceso y posición segura CP08 Torreón.
- [ ] Punto público exterior CP09 Santuario.
- [ ] Punto exterior seguro CP10 Cueva del Agua.
- [ ] Identificación Casa Molino.
- [ ] Identificación del waypoint “Túnel”.
- [ ] Radios candidatos de todos los CP.
- [ ] Comprobación de activaciones desde camino incorrecto.
- [ ] Cobertura GPS/móvil por segmentos.
- [ ] Firme, sombra, exposición y riesgos por segmento.
- [ ] Fotografías propias obligatorias.

---

## 4. Pendiente de análisis posterior al campo

- [ ] Comparar `OFFICIAL_TRACK ↔ CONTROL_TRACK ↔ FIELD_TRACK`.
- [ ] Seleccionar geometría canónica o derivada documentada.
- [ ] Calcular distancia canónica.
- [ ] Calcular desnivel positivo/negativo.
- [ ] Calcular altitudes min/max.
- [ ] Calcular km definitivo de cada CP/POI.
- [ ] Calcular pendientes por segmento.
- [ ] Fijar radios definitivos.
- [ ] Resolver todos los `REVIEW`.
- [ ] Resolver/eliminar todos los `FAIL` obligatorios.
- [ ] Completar Media Manifest con archivos reales.
- [ ] Revisar derechos de publicación.
- [ ] Preparar pack offline.

---

## 5. Pendiente de pruebas de juego

- [ ] Probar inicio y finalización real.
- [ ] Probar desbloqueo CP en orden esperado.
- [ ] Probar desvío de ruta.
- [ ] Probar funcionamiento sin cobertura móvil.
- [ ] Probar GPS de calidad mediocre.
- [ ] Probar que ningún CP obligatorio exige una conducta insegura.
- [ ] Fijar `minimum_route_coverage_pct`.
- [ ] Fijar `allowed_route_deviation_m`.
- [ ] Fijar reglas antifraude razonables.
- [ ] Revisar duración añadida por contenido.
- [ ] Ajustar economía XP global cuando exista MA-002.

---

## 6. Pendiente externo / colaboración

- [ ] Negocio o entidad colaboradora para recompensa piloto.
- [ ] Condiciones reales del premio/descuento.
- [ ] Método de canje.
- [ ] Límites y vigencia.

La ausencia de recompensa comercial no debe impedir que la aventura funcione como experiencia gratuita; sólo impide activar esa recompensa concreta.

---

## 7. Condición para `CONTENT_FROZEN`

MA-001 podrá marcarse `CONTENT_FROZEN` cuando:

1. todos los hechos publicados tengan fuente o evidencia de campo;
2. todos los CP tengan ubicación y función definitivas;
3. no haya contenido `SOURCE_PENDING` obligatorio;
4. los elementos `HOLD` estén resueltos o descartados;
5. el guion coincida con lo observable realmente sobre el terreno.

---

## 8. Condición para `READY_TO_PUBLISH`

Además de `CONTENT_FROZEN`:

1. sendero oficialmente abierto;
2. acceso operativo;
3. validación de campo en PASS;
4. geometría canónica cerrada;
5. multimedia obligatoria completa y con derechos claros;
6. reglas de completado probadas;
7. experiencia offline mínima lista;
8. publication gate = `OPEN`.

---

## 9. Test final de plantilla

Antes de congelar el Adventure Content Contract:

- cargar una MA-002 de naturaleza diferente;
- no permitir campos específicos hardcodeados para Cuadros;
- cualquier nuevo campo debe justificar que es generalizable a múltiples aventuras.

> **Cuadros no está terminado cuando el documento está bonito; está terminado cuando el terreno, los datos y la experiencia cuentan la misma historia.**
