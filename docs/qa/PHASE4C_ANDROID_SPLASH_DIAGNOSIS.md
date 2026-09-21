# Fase 4C — Diagnóstico del splash Android y APK autónoma

**Fecha de diagnóstico:** 2026-09-21  
**Rama analizada:** `feat/adventure-engine-v2`  
**HEAD analizado:** `0006d53be35e7d1d1815b4a254a47875a2fa4236`  
**APK observado en dispositivo:** `magina-aventura-gps-v1-debug-824` del workflow `35558722291`

## Conclusión

La causa raíz del splash persistente en el dispositivo es que el artefacto instalado fue una **build Android Debug** creada mediante `./gradlew :app:assembleDebug`. El proyecto Android generado por Expo/React Native declara `debug` como variante depurable y, por diseño, el plugin React Native **omite** el bundling de JavaScript y assets para esa variante. El APK Debug necesita recuperar el bundle JavaScript desde Metro. Fuera del ordenador o sin `expo start`/Metro accesible, React Native no puede montar la aplicación y el splash nativo queda visible.

La corrección no sustituye ni elimina el APK Debug. Se mantiene para desarrollo conectado a Metro y se añade una APK `release` interna de QA, con paquete `com.isivolt.maginaaventura.qa`, bundle JavaScript embebido, Hermes incluido y una bandera explícita de TEST DATA. Esta APK no es productiva ni se publica en Google Play.

## Evidencia de diagnóstico

| Pregunta | Resultado | Evidencia |
| --- | --- | --- |
| ¿El APK Debug requiere Metro? | **Sí.** | El `android/app/build.gradle` generado documenta que las variantes depurables omiten bundle JS y assets, y `debug` es la variante depurable por defecto. La CI usó `:app:assembleDebug`. |
| ¿El Debug contiene bundle JS? | **No como parte de su diseño de variante.** | La configuración Gradle generada usa `bundleCommand = "export:embed"`, pero excluye el bundling para Debug. La CI anterior no ejecutó una tarea de bundle release. |
| ¿La QA standalone contiene bundle JS? | **Sí, requerido y verificado en CI.** | La nueva validación exige `assets/index.android.bundle` no vacío en la APK release QA. |
| ¿Hermes está configurado? | **Sí.** | `android/gradle.properties` generado contiene `hermesEnabled=true`; la nueva validación exige una `libhermes.so` dentro de la APK QA. |
| ¿El splash nativo está configurado? | **Sí.** | `expo-splash-screen` genera `Theme.App.SplashScreen`, `SplashScreenManager.registerOnActivity(this)`, `splashscreen_logo` y fondo `#FAF9F6`. No se detectó una configuración que fuerce el splash indefinidamente. |
| ¿RootLayout llega a registrar la tarea de fondo? | **Sólo si arranca JS.** | `_layout.tsx` importa el registro de `expo-task-manager`, pero eso sucede tras cargar el bundle JS. El Debug aislado no llega a ese punto. |
| ¿`background-location-task` bloquea startup? | **No hay evidencia de que sea la causa observada.** | Define la tarea al cargar JS, no espera promesas y captura errores del handler. Aun así, logcat QA debe comprobar excepciones nativas reales. |
| ¿onboarding puede dejar un launch screen eterno? | **No tras este cambio.** | La consulta de almacenamiento ya tenía fallback de error; ahora se limita además a 4 segundos para un `Promise` que no resuelva. |
| ¿MapLibre/SQLite/TaskManager son causa confirmada? | **No confirmada.** | Son módulos de runtime que se cargan después de disponer del bundle. No hubo dispositivo/emulador conectado para observar logcat. |

## Cadena de arranque revisada

El entry point es `expo-router/entry`. `app/_layout.tsx` registra la tarea de localización en background y monta `SafeAreaProvider` + `Stack`. La ruta inicial consulta el marcador de onboarding y muestra `LaunchScreen` únicamente mientras se resuelve ese trabajo. La navegación de onboarding usa `router.replace('/')` en `finally`, de forma que un error de escritura no captura la navegación.

El proyecto utiliza Expo SDK `57.0.23`, React Native `0.86.2`, Expo Router `57.0.21`, Expo Splash Screen `57.0.5`, Expo Location `56.0.25`, Expo SQLite `57.0.3` y Expo Task Manager `56.0.27`. El prebuild Android completó correctamente tras generar los assets de marca. El manifiesto generado contiene los permisos de localización foreground/background y servicio foreground exigidos por el proyecto.

## Limitación de reproducción

No hubo `adb`, Android SDK ni emulador disponibles al iniciar este diagnóstico, y la descarga API del artefacto histórico de GitHub Actions exige autenticación. Por tanto, no se obtuvo logcat del APK ya instalado ni se desensambló ese archivo exacto localmente. La conclusión se apoya en la configuración Gradle generada, en el comando CI que produjo el artefacto y en el comportamiento estándar explícitamente documentado dentro de la configuración generada.

La validación local añade Android SDK cuando esté disponible; el gate definitivo de arranque, permisos, GPS, background y recovery continúa siendo la prueba física Phase 4C con la APK QA standalone y captura logcat.

## Controles añadidos

La bandera `EXPO_PUBLIC_ENABLE_QA_HARNESS=true` sólo se inyecta en la build QA. La decisión se centraliza en `qa-harness.ts`: Development y QA explícita pueden mostrar TEST DATA; una build productiva queda cerrada por defecto. Para evitar que Metro conserve módulos sintéticos sólo por existir `require` condicionales, `metro.config.js` resuelve el grafo QA a stubs vacíos en producto. La CI exporta un bundle JS legible QA y uno productivo para comprobar que el QA contiene `dev-adventure-engine-test` y que el productivo no contiene ningún marcador de TEST DATA, Cuadros o Bedmar.

La tarjeta QA muestra tipo de build, versión, SHA de commit y número de CI cuando se inyectan por el workflow. En producción no se muestra esa tarjeta, no existe inventario de fixtures y la interfaz declara honestamente que aún no hay rutas verificadas.
