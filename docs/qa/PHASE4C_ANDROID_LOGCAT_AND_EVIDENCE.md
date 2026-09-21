# Fase 4C — Logcat y recogida de evidencias Android

La APK para pruebas físicas es el artefacto `magina-aventura-phase4c-qa-standalone-<run>`. Descomprimirlo y conservar juntos el APK, `SHA256SUMS.txt` y `BUILD_INFO.txt`. Esta APK lleva bundle JavaScript y Hermes embebidos, por lo que no necesita Metro ni un ordenador para funcionar después de instalarse. Está firmada con el **debug keystore generado por Android**, únicamente para QA interna; no representa firma ni distribución productiva.

## Antes de empezar

Verificar la integridad del APK antes de instalarlo. En macOS/Linux, ejecutar `sha256sum -c SHA256SUMS.txt`; en PowerShell, comparar `Get-FileHash .\magina-aventura-phase4c-qa-standalone.apk -Algorithm SHA256` con el valor de `SHA256SUMS.txt`. Registrar el commit, tipo de build, versión, package ID y número de workflow que muestra `BUILD_INFO.txt`, además de la tarjeta `QA ONLY · TEST DATA` de la app.

La única identidad de paquete esperada es `com.isivolt.maginaaventura.qa`. Antes de probar objetivos, comprobar que la pantalla principal muestra `QA ONLY · TEST DATA` y que la única ruta QA se identifica como `Adventure Engine v2 · TEST DATA`. Detener la prueba si aparece MA-001, Cuadros, Bedmar o contenido editorial/productivo.

## Captura completa recomendada

La captura completa es la fuente principal porque conserva errores no previstos. Iniciar la sesión justo antes de abrir la app y detenerla al terminar:

```bash
adb logcat -c
adb logcat -v threadtime > phase4c-logcat-full.txt
```

En otra terminal, abrir la aplicación con:

```bash
adb shell monkey -p com.isivolt.maginaaventura.qa 1
```

Cerrar la captura con `Ctrl+C`. Anotar hora de inicio y final en el informe; redactor tokens, correos, identificadores de usuario y ubicaciones que no pertenezcan al circuito sintético antes de compartir el archivo.

## Filtro complementario

El filtro siguiente sirve para lectura rápida, pero no sustituye al log completo. Conserva React Native, runtime Android, Expo y localización, además de los errores de cualquier tag:

```bash
adb logcat -v threadtime \
  ReactNativeJS:V ReactNative:V AndroidRuntime:E Expo:V ExpoModulesCore:V \
  ExpoLocation:V ExpoTaskManager:V ActivityTaskManager:V *:E \
  > phase4c-logcat-filtered.txt
```

Si una etiqueta no existe en el dispositivo, no es un fallo. Para buscar el intervalo de prueba posteriormente, usar `rg -n -i 'ReactNativeJS|AndroidRuntime|expo|location|task|sqlite|hermes|fatal|exception' phase4c-logcat-full.txt`.

## Datos mínimos no destructivos

```bash
adb devices -l
adb shell getprop ro.product.manufacturer
adb shell getprop ro.product.model
adb shell getprop ro.build.version.release
adb shell getprop ro.build.version.security_patch
adb shell dumpsys package com.isivolt.maginaaventura.qa
adb shell dumpsys activity activities
```

Estas consultas no borran datos ni cambian permisos. Para abrir la app no hace falta root. No ejecutar `pm clear`, no desinstalar sin registrar previamente evidencias y no extraer datos personales del dispositivo.

## Scripts de ayuda

`scripts/qa/phase4c-device-check.sh` y `scripts/qa/phase4c-device-check.ps1` crean una carpeta de evidencias, registran datos básicos del dispositivo y paquete, calculan SHA-256 opcional del APK, limpian logcat, inician captura completa y lanzan la app. Se detienen con `Ctrl+C` o `Enter` y guardan un dump de actividad. Son herramientas de asistencia: los permisos, desplazamientos, bloqueo de pantalla, force-stop y controles CP/DISC siguen siendo acciones explícitas del protocolo principal.

## Limitación conocida

No hay emulador ni dispositivo Android conectado en el entorno de CI. La CI valida que la APK release QA existe, no está vacía, contiene `assets/index.android.bundle` y una biblioteca `libhermes.so`; el smoke de arranque, permisos y GPS sigue siendo el gate físico de Fase 4C.
