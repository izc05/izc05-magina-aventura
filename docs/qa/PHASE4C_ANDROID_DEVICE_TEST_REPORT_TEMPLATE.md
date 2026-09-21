# Fase 4C — Informe de prueba Android física

> **Uso:** crear una copia de esta plantilla para cada APK probada. No incluir ubicaciones personales, tokens ni identificadores de cuenta. Esta prueba sólo admite la ruta sintética `dev-adventure-engine-test`; si aparece contenido editorial o productivo, marcar **BLOCKED** y detener la sesión.

## Identidad de la prueba

| Campo | Valor |
| --- | --- |
| Fecha y zona horaria | |
| Responsable | |
| Evidencia/carpeta | |
| Resultado final | `PASS` / `PASS WITH RISKS` / `BLOCKED` |

## Dispositivo

| Campo | Valor |
| --- | --- |
| Fabricante | |
| Modelo | |
| Serial/identificador redactado | |
| Android | |
| Parche de seguridad | |
| Batería inicial/final | |
| Espacio libre | |
| Red durante la prueba | |

## Identidad de build

| Campo | Valor |
| --- | --- |
| Archivo APK | |
| SHA-256 | |
| Package ID | `com.isivolt.maginaaventura.qa` esperado |
| Tipo | `phase4c-qa-standalone-release` esperado |
| Versión | |
| Commit SHA | |
| Rama | `feat/adventure-engine-v2` esperado |
| CI workflow/run | |
| Firma | Debug keystore interna; **no es firma productiva** |
| Pantalla QA / captura | |

## Resultados de ejecución

| Caso | PASS / FAIL / BLOCKED | Evidencia | Observaciones y pasos ejecutados |
| --- | --- | --- | --- |
| INSTALL | | | |
| BOOT | | | |
| FOREGROUND LOCATION | | | |
| BACKGROUND LOCATION | | | |
| FOREGROUND-ONLY | | | |
| GPS OFF | | | |
| AdventureDefinition pinned | | | slug, versión, routeId y geometryVersion |
| CP1 | | | |
| CP1 DUPLICATE | | | un solo unlock/observación |
| CP2 | | | prerrequisito CP1 |
| DISCOVERY | | | provisional; sin recompensa local |
| CP3 | | | prerrequisito discovery |
| PAUSE | | | |
| LOCK SCREEN | | | |
| FORCE STOP | | | |
| RECOVERY | | | misma definición y actividad |
| OFFLINE | | | |
| SQLITE | | | no exportar datos personales |
| FINISH | | | sólo acción explícita |
| POST-FINISH REOPEN | | | no retoma actividad finalizada |
| REWARDS STILL PROVISIONAL | | | sin XP/aceitunas/inventario/logros definitivos |

## Registros y capturas

| Tipo | Archivo/enlace | Hora de inicio/fin | Notas de privacidad |
| --- | --- | --- | --- |
| Logcat completo | | | Redactado antes de compartir |
| Logcat filtrado | | | Complementario, no sustituye completo |
| Capturas de inicio/harness | | | |
| Capturas HUD/objetivos | | | |
| Capturas pausa/recovery/resumen | | | |
| Dumps de paquete/actividad | | | Sin datos de usuario |
| Consulta autorizada SQLite | | | Sólo circuito sintético |

## Incidencias y riesgos

| ID | Severidad | Pasos mínimos de reproducción | Resultado esperado | Resultado observado | Estado |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Cierre

**Resultado:** `PASS` / `PASS WITH RISKS` / `BLOCKED`

**Riesgos aceptados o bloqueadores pendientes:**


**Siguiente acción:**


**Aprobación QA:**

