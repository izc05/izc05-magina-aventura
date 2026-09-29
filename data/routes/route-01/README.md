# ROUTE-01 — Procedencia de la geometría oficial de Las Viñas

## Estado de producto

Esta geometría se conserva para **QA, simulación y preparación editorial**.

La ruta permanece:

- `availability: simulation_only`
- `officialRouteStatus: temporarily_closed`

La presencia de geometría oficial en el repositorio **no autoriza ni recomienda** realizar físicamente el sendero mientras la fuente oficial mantenga el cierre temporal.

## Fuente

**Titular/fuente:** Junta de Andalucía · Consejería de Sostenibilidad y Medio Ambiente.

**Página oficial de origen:**

https://www.juntadeandalucia.es/medioambiente/portal/areas-tematicas/biodiversidad-geodiversidad-habitats/geodiversidad/geoturismo-andalucia

**Activo KML oficial utilizado para la verificación:**

https://www.juntadeandalucia.es/medioambiente/portal/documents/20151/91693279/18_Las_Vinas.kml/3a861247-00ee-0c65-c0d0-7b304acc9ff3?t=1675942382809

El KML original se usa como evidencia de ingestión y **no se versiona como archivo fuente** en esta rama. La copia que se conserva en Git es una representación GeoJSON derivada y atribuida.

## Identidad y verificación

- nombre oficial del feature: `LAS VIÑAS`
- `CODIGOEQUI`: `724`
- dificultad incluida en el KML: `Media`
- modalidad: `Sendero señalizado`
- `shape_leng` oficial del KML: `8719.688440057627 m`
- tamaño del KML descargado: `15190 bytes`
- SHA-256 del KML:
  `126ddddb1eb9ec62297e66be9138dd51b6a7042ff80fc06fd2d2fb24043faa59`
- fecha de adquisición/verificación: `2026-09-29`
- puntos del LineString: `400`
- longitud calculada por el verificador: `8720.382 m`
- longitud publicada usada para reconciliación: `8720 m`
- diferencia: `+0.382 m / +0.004 %`
- distancia inicio-fin: `4.278 m`
- trazado plausiblemente circular: `sí`
- saltos >250 m: `0`
- `geometryVersion`: `1`

No se concatenaron líneas, no se interpolaron huecos y no se sustituyó ningún tramo con fuentes comunitarias.

## Bounds WGS84

- oeste: `-3.42768246777392`
- sur: `37.7788030212631`
- este: `-3.40662306017906`
- norte: `37.7934379160086`

## Reutilización y atribución

La Consejería indica que permite la reutilización de contenidos y datos de su sitio web, con las condiciones generales de no alterar/desnaturalizar la información, citar la fuente/titular y mencionar la fecha de actualización, salvo que exista una licencia o aviso específico que prevalezca.

Referencia:

https://www.juntadeandalucia.es/medioambiente/portal/servicios/servicio-informacion-atencion-ciudadania/preguntas-frecuentes/generales

También se mantiene la atribución visible:

> Información obtenida del Portal de la Junta de Andalucía

No se reproducen logotipos, escudos ni marcas institucionales.

## Protección frente a cambios remotos

El workflow de ingestión está fijado al SHA-256 anterior. Si los bytes oficiales cambian, la ingestión falla y exige una revisión manual y una nueva versión de geometría en lugar de sustituir silenciosamente el trazado.
