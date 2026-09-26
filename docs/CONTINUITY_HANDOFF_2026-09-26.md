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

## Compilación Android en curso

Se lanzó una build local con:

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

Debe contener únicamente `arm64-v8a`.

## Cambios locales aún no publicados

En el momento de crear este documento estaban pendientes de commit:

- `.github/workflows/android-preview.yml`
  - se añadió la rama `fix/gps-expo-sdk57` para que la APK se construya automáticamente con cada push.
- `apps/mobile/app/adventure/[slug].tsx`
  - contador de checkpoints detectados en modo piloto.
- `apps/mobile/app/routes/[slug].tsx`
  - contenido narrativo visible de los checkpoints.
- `apps/mobile/src/activity/use-active-adventure.ts`
  - evaluación de proximidad de checkpoints con GPS.
- `apps/mobile/src/features/routes/development-route-map-repository.ts`
  - comentario actualizado.
- `apps/mobile/src/features/routes/route-utils.test.ts`
  - prueba de integridad del registro narrativo.
- `apps/mobile/src/features/routes/ma001-pilot-content.ts`
  - nuevo registro de capítulos y contenido.

## Próximos pasos exactos

1. Esperar la build Android local.
2. Si termina correctamente, hacer commit de los cambios pendientes:

```bash
git add .github/workflows/android-preview.yml apps/mobile/app/adventure/'[slug].tsx' apps/mobile/app/routes/'[slug].tsx' apps/mobile/src/activity/use-active-adventure.ts apps/mobile/src/features/routes/development-route-map-repository.ts apps/mobile/src/features/routes/route-utils.test.ts apps/mobile/src/features/routes/ma001-pilot-content.ts docs/CONTINUITY_HANDOFF_2026-09-26.md
git commit -m "feat(mobile): activate pilot checkpoint progression"
git push origin fix/gps-expo-sdk57
```

3. Verificar si GitHub Actions inicia automáticamente la build. El workflow ya incluye esta rama.
4. Si GitHub no inicia Actions, el token de GitHub no tiene permiso de dispatch manual. La build local sigue siendo válida.
5. Descargar/copiar la APK final a un directorio estable, por ejemplo:

```bash
mkdir -p /home/ubuntu/magina-aventura-artifacts/final
cp apps/mobile/android/app/build/outputs/apk/release/app-release.apk /home/ubuntu/magina-aventura-artifacts/final/
```

6. No marcar MA-001 como ruta publicable todavía. La documentación mantiene estos bloqueos legítimos:
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
