# Sierra Mágina Catalog Source Ledger

Checked baseline: 2026-09-16

This ledger documents the human-readable provenance behind the canonical catalog. Machine-readable source metadata lives in `packages/domain/src/catalog/catalog-data.ts`.

| Source ID | Publisher | Authority family | Scope | URL | Published | Checked | Verification | License/reuse | Claims |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `junta-sierra-magina-directory` | Junta de Andalucía · Ventana del Visitante | Parque Natural / Junta | Sierra Mágina sendero identities and municipalities | https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/es6160007-sierra-m%C3%81gina | — | 2026-09-16 | official_verified | Reuse terms not yet recorded; link/reference only in V1 | Current official directory entries for 16 signposted trails used as identity/municipality provenance. |
| `junta-las-vinas` | Junta de Andalucía · Ventana del Visitante | Parque Natural / Junta | Las Viñas technical sheet and current service state | https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/las-vi%C3%B1as/255035 | — | 2026-09-16 | official_verified | Reuse terms not yet recorded; link/reference only in V1 | Circular route; 8,720 m; 3 h; medium difficulty; Bedmar y Garcíez; currently shown as temporarily closed/out of service. Page exposes official KML and GML downloads backed by REDIAM WFS. |
| `junta-hoyalinos` | Junta de Andalucía · Ventana del Visitante | Parque Natural / Junta | Hoyalinos identity and technical sheet | https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/hoyalinos/255035 | — | 2026-09-16 | official_verified | Reuse terms not yet recorded; link/reference only in V1 | Torres; circular; 2,092 m; 1 h; medium difficulty. Used separately because Hoyalinos is not present in the current aggregated Sierra Mágina equipment listing returned by the portal. |
| `junta-cuadros-closure` | Junta de Andalucía · Ventana del Visitante | Parque Natural / Junta | Cuadros operational notice | https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/cuadros/null | 2026-02-24 | 2026-09-16 | official_verified | Reuse terms not yet recorded; link/reference only in V1 | Official temporary-closure notice affecting Cuadros equipment; used together with the live Las Viñas page for the current blocking restriction. |

## Current official identity baseline

The canonical draft set contains the following 17 official trail identities: Adelfal de Cuadros, Caño del Aguadero, Castillo de Albanchez, Castillo de Mata Bejid, El Peralejo, Fuenmayor, Gibralberca, Hoyalinos, La Cueva de la Graja, Las Viñas, Pinar de Cánava, Puerto de la Mata, Sierra de la Cruz, Subida al Hoyo de la Laguna, Subida a Pico Mágina y Miramundos, Umbría de los Corzos, and Veredón-Mojón Blanco.

All 17 remain `draft` until route-level geometry and the remaining technical fields are verified. No community track is promoted as official geometry.

## Geometry note

The Las Viñas official page exposes KML/GML downloads from the REDIAM WFS (`senderos:senderos`, `CODIGOEQUI=724`, source CRS shown as EPSG:25830). V1 records this as a geometry source lead, but does not yet commit a derived track asset until the file can be fetched, transformed, and validated reproducibly.

## Operational-status rule

The absence of a closure record is not evidence that a route is open. `open` is reserved for explicit current authoritative confirmation. The Las Viñas canonical record therefore derives `closed` while its current official page remains marked temporarily closed/out of service.
