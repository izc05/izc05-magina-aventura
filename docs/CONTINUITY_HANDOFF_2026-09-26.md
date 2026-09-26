# Mágina Aventura — Documento de continuidad

**Fecha:** 2026-09-26 20:07 CEST  
**Repositorio:** `https://github.com/izc05/izc05-magina-aventura`  
**Rama activa:** `fix/gps-expo-sdk57`  
**Directorio local:** `/home/ubuntu/magina-aventura-rc1`

## Estado actual

La app móvil ya tiene conectado el flujo GPS de la ruta piloto MA-001 Cuadros / Las Viñas.

### Cambios publicados

- `9a2f31e` — alinea `expo`, `expo-location` y `expo-task-manager` con Expo SDK 57.
- `489fb0b` — incorpora el KML oficial de la Junta y el mapa piloto de MA-001.
- `43c5975` — conecta el slug oficial `las-vinas` con la aventura activa MA-001.
- `145e199` — muestra el registro de checkpoints en la ficha de ruta.

## Funcionalidad implementada

- KML oficial incorporado en:
  - `data/routes/ma001-cuadros/tracks/MA001_OFFICIAL_JUNTA_LAS_VINAS.kml`
- El mapa usa el trazado oficial con 400 coordenadas.
- El registro de ruta contiene 12 checkpoints:
  - 9 tienen waypoint de control visible.
  - 3 quedan pendientes de campo: `CP02`, `CP03`, `CP06`.
- Los checkpoints pendientes no se dibujan ni se usan como targets GPS.
- El flujo `Las Viñas → Preparar aventura → Aventura activa` resuelve `MA-001`.
- El motor de proximidad GPS detecta provisionalmente los checkpoints con waypoint de control.
- La pantalla activa muestra el número de checkpoints detectados en modo piloto.
- Se ha creado el registro narrativo completo en:
  - `apps/mobile/src/features/routes/ma001-pilot-content.ts`
- La ficha de ruta muestra título, objetivo y estado de cada checkpoint.
- La documentación de contenido, seguridad y validación está en:
  - `docs/rc1/routes/ma001-cuadros/`
  - `data/routes/ma001-cuadros/`

## Validaciones completadas

Última validación completa antes de Android:

- `pnpm typecheck` — correcto.
- `pnpm test` — correcto.
  - 134 tests de `domain`.
  - 16 tests de `geo`.
  - 14 tests de `offline-sync`.
  - 13 tests de `route-import`.
  - 39 tests de `activity-engine`.
  - 116 tests de `mobile`.
  - 84 tests admin.
- `git diff --check` — correcto.
- Expo prebuild Android — correcto.
- Manifest contiene:
  - `ACCESS_FINE_LOCATION`
  - `ACCESS_COARSE_LOCATION`
  - `ACCESS_BACKGROUND_LOCATION`
  - `FOREGROUND_SERVICE`
  - `FOREGROUND_SERVICE_LOCATION`

## APK Android final generada

La build local terminó correctamente usando Android SDK 36, NDK 27.1.12297006 y JDK 17:

```bash
cd /home/ubuntu/magina-aventura-rc1
pnpm --filter @magina-aventura/mobile brand:assets
cd apps/mobile/android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a --no-daemon
```

APK esperada:

```text
apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Tras terminar, verificar:

```bash
stat -c%s apps/mobile/android/app/build/outputs/apk/release/app-release.apk
unzip -Z1 apps/mobile/android/app/build/outputs/apk/release/app-release.apk | awk -F/ '/^lib\// {print $2}' | sort -u
sha256sum apps/mobile/android/app/build/outputs/apk/release/app-release.apk
```

Resultado verificado:

| Campo | Resultado |
|---|---|
| Archivo | `/home/ubuntu/magina-aventura-artifacts/final/magina-aventura-ma001-arm64-release.apk` |
| Tamaño | 55.261.784 bytes (52 MiB) |
| Arquitectura | `arm64-v8a` únicamente |
| Package | `com.isivolt.maginaaventura` |
| Version | `0.1.0` / versionCode `1` |
| SDK mínimo / objetivo | 24 / 36 |
| SHA-256 | `47cd091d9b4edd5702eff6bfdd338a86317f58d7424f95a8ba180842edab4153` |

El APK incluye y declara los cinco permisos de ubicación comprobados en el manifest.

## Cambios publicados

El código de la funcionalidad está publicado en `origin/fix/gps-expo-sdk57` mediante el commit `490ba1c`.
El commit `f4211d4` deja el árbol limpio y revierte sólo la modificación del workflow porque la credencial GitHub no tiene permiso `workflows`.

## Próximos pasos exactos

1. La APK ya está generada y validada en la ruta indicada arriba.
2. Si otra cuenta tiene permiso `workflows`, puede añadir `fix/gps-expo-sdk57` a `on.push.branches` de `.github/workflows/android-preview.yml` y hacer push para activar la build automática:

```bash
git checkout -b ci/android-preview-ma001
# añadir "- fix/gps-expo-sdk57" en .github/workflows/android-preview.yml
git add .github/workflows/android-preview.yml
git commit -m "ci: build Android preview for GPS branch"
git push origin ci/android-preview-ma001
```

3. La build de GitHub no se pudo lanzar desde esta cuenta porque el token no tiene permiso `workflows`; la APK local sí está validada.
4. Para copiar la APK final a otra máquina:

```bash
mkdir -p /home/ubuntu/magina-aventura-artifacts/final
cp apps/mobile/android/app/build/outputs/apk/release/app-release.apk /home/ubuntu/magina-aventura-artifacts/final/
```

5. No marcar MA-001 como ruta publicable todavía. La documentación mantiene estos bloqueos legítimos:
   - cierre oficial temporal;
   - validación física pendiente;
   - tres checkpoints sin posición final;
   - imágenes reales pendientes;
   - paquete offline real pendiente de Supabase/CDN;
   - recompensa local pendiente de partner.

## Nota de seguridad de producto

No convertir las posiciones de control en checkpoints oficiales sin hacer la salida de campo descrita en:

```text
docs/rc1/routes/ma001-cuadros/MA001_FIELD_DAY_RUNBOOK_v0_1.md
```

La app debe seguir mostrando MA-001 como **modo piloto / desarrollo** y no conceder recompensas definitivas hasta la validación oficial.
