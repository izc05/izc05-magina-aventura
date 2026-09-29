# ROUTE-01 — Las Huellas de Cuadros / QA Route Simulator

## Alcance

Esta entrega añade contratos puros para `AdventureContentDefinition`, el fixture editorial MOCK de **Las Huellas de Cuadros** y un `@magina-aventura/route-simulator` determinista.

La ruta se mantiene en `simulation_only` porque la fuente oficial de la Junta indica cierre temporal. El fixture no inventa coordenadas: el simulador recibe la geometría verificada como entrada independiente.

## Modos

- **Replay**: reproduce una geometría suministrada a x1, x4 o x10.
- **Walk-to-advance**: convierte pasos en progreso virtual (fallback configurable, 0,75 m/paso por defecto); no reescribe GPS real.
- **Checkpoint-jump**: mueve la posición virtual al progreso editorial del checkpoint y respeta prerrequisitos.

La pantalla móvil está disponible en `/qa/route-simulator`. Se mantiene desactivada salvo en desarrollo o cuando la build define `EXPO_PUBLIC_ENABLE_QA_ROUTE_SIMULATOR=1`; una entrada QA opcional (`EXPO_PUBLIC_QA_ROUTE_SIMULATOR_ENTRY=1`) redirige directamente a esa pantalla sin modificar el flujo de autenticación productivo.

El workflow independiente `.github/workflows/android-route-simulator-qa.yml` genera una APK ARM64 con application id `com.isivolt.maginaaventura.routesim`, etiqueta QA y metadatos que declaran `physical_gps_gate=NOT_APPLICABLE` y recompensas comerciales desactivadas. No modifica ni reutiliza el workflow del candidato de QA físico.

## Frontera QA obligatoria

Cada estado contiene `qaSimulated: true`, watermark visible **`SIMULACIÓN QA`**, `publicEffectsEnabled: false`, `commercialRedemptionEnabled: false` y `physicalQaEvidence: false`. Por diseño, un snapshot QA no puede ser elegible para sponsor redemption, ranking o logros públicos. El sponsor incluido es MOCK, tiene `status: mock` y `maxRedemptions: 0`.

## Fuentes iniciales

- [Ventana del Visitante — Junta de Andalucía](https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante)
- [Ayuntamiento de Bedmar y Garcíez](https://www.bedmargarciez.es/)

Las tarjetas separan `fact`, `tradition` e `interpretation`; no se convierte una leyenda en hecho histórico.

## No tocado

No se modifican Expo Location, `LocationProvider`, TaskManager, GPS productivo, SQLite/persistencia, recuperación, workflows del candidato físico ni `main`. La geometría real y la validación de reapertura siguen siendo entradas/gates externos.
