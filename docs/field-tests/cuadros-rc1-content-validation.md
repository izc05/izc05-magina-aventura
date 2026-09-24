# Validation Evidence — Sendero de Cuadros (Bedmar y Garcíez)

This document records the provenance, geometry verification, checkpoints, discoveries, and pre-field lifecycle state for the canonical **Sendero de Cuadros** route (`MA-001`) in Bedmar y Garcíez (Sierra Mágina).

## 1. Content Evidence Checklist

| Item | Source / Reference | Status | Notes |
|:---|:---|:---:|:---|
| Canonical route identity | `MA-001` (Cuadros - Bedmar y Garcíez) | `VERIFIED` | Stable UUID in canonical catalog |
| Track / Geometry source | Official GPX track (`cuadros-v1.gpx`) | `VERIFIED` | PostGIS WKT LineString SRID 4326 |
| Start / End coordinates | Santuario de Cuadros (37.8184° N, 3.4092° W) | `VERIFIED` | Coordinates verified from geometry |
| Calculated distance / elevation | Geometry-derived: 8.7 km / 412 m D+ | `VERIFIED` | Metrics computed from PostGIS geometry |
| Difficulty / Duration | Moderada (2) / 150 minutos | `VERIFIED` | Mapped to official route V2 revision |
| Access & Parking | Aparcamiento del Santuario de Cuadros | `VERIFIED` | Access notes verified |
| Safety & Restrictions | Tramo de rivera y sendero de montaña | `VERIFIED` | Precaución por crecida del río en lluvias |
| Water claims | Fuente de Cuadros (no clorada) | `VERIFIED` | Provenance recorded; aviso de agua no tratada |
| Checkpoints | 3 Checkpoints activos (Santuario, Adelfal, Torre) | `VERIFIED` | Coordenadas y radio de disparo de 25m |
| Discoveries | 4 Descubrimientos etnológicos y naturales | `VERIFIED` | Adelfal de Cuadros, Torre de Cuadros, Molino |
| Offline package | `OfflineAdventureManifestV1` (pkg-cuadros-rc1) | `VERIFIED` | Content hash hex 64, PMTiles asset bound |
| Media attribution | Archivo de medios Mágina Aventura | `VERIFIED` | Fotos etiquetadas y protegidas bajo RLS |
| Field validation | GPS real en ruta física | `PENDING` | Gate manual `FIELD_TEST_PENDING` (Task 12) |

---

## 2. Lifecycle State Progression

```text
BORRADOR -> REVISIÓN -> CONTENIDO_VERIFICADO -> FIELD_TEST_PENDING
```

- **Estado actual de ciclo de vida**: `FIELD_TEST_PENDING`
- **Regla de autoridad**: La ruta permanece en `FIELD_TEST_PENDING` hasta la ejecución exitosa de la prueba física de campo con GPS real (Task 12). No se proclama `ADVENTURE_READY` o `PUBLICADA` prematuramente.
