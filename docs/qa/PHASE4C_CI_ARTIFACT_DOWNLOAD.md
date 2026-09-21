# Fase 4C — Artefacto Android generado por GitHub Actions

## Estado de cierre

Se detuvo la compilación Android local. No se continúa instalando ni corrigiendo SDK/JDK en este entorno. La validación física de Fase 4C debe usar el artefacto de GitHub Actions, no la APK Debug local.

El workflow relevante es [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml). Se ejecuta en `pull_request`, por lo que una nueva ejecución se crea cuando los cambios de la rama se publican en el PR. La revisión local actual es `0006d53be35e7d1d1815b4a254a47875a2fa4236`; la API de GitHub no permitió confirmar un run nuevo desde este entorno al cerrar la tarea, así que no se afirma que el artefacto QA ya esté disponible para esa revisión.

## Qué produce CI

El workflow conserva el APK Debug anterior y añade el APK autónomo de QA. Los nombres son deterministas respecto a `github.run_number`:

| Artefacto CI | Contenido | Uso |
| --- | --- | --- |
| `magina-aventura-gps-v1-debug-<run_number>` | `apps/mobile/android/app/build/outputs/apk/debug/app-debug.apk` | Desarrollo/debug conectado a Metro. **No usar para la prueba física standalone.** |
| `magina-aventura-phase4c-qa-standalone-<run_number>` | `magina-aventura-phase4c-qa-standalone.apk`, `SHA256SUMS.txt`, `BUILD_INFO.txt` | APK release interna de QA para Fase 4C, con bundle JavaScript y Hermes embebidos. **Este es el artefacto correcto.** |

La variante QA se genera con `APP_VARIANT=phase4c-qa` y `EXPO_PUBLIC_ENABLE_QA_HARNESS=true`. CI exige dentro de la APK `assets/index.android.bundle` y una biblioteca `libhermes.so`; además escribe en `BUILD_INFO.txt` el commit, rama, run, package ID y tipo de build. El package ID esperado es `com.isivolt.maginaaventura.qa`. La firma es un debug keystore interno de QA, no una firma productiva.

El job también ejecuta `pnpm qa:verify-product-bundle`: el bundle QA debe contener los datos sintéticos de prueba, mientras que el bundle de producto no debe contener marcadores de TEST DATA ni la ruta `dev-adventure-engine-test`.

## Run histórico confirmado

El último run histórico confirmado durante el diagnóstico fue:

- **CI run:** [35558722291](https://github.com/izc05/izc05-magina-aventura/actions/runs/35558722291)
- **Resultado:** `success`
- **Commit de ese run:** `750a35a46a96e9627a14595a12d76fbd9e7be3e2`
- **Artefacto confirmado:** `magina-aventura-gps-v1-debug-824`
- **Archivo dentro del ZIP:** `app-debug.apk`
- **Artifact ID histórico:** `10621402502`
- **Descarga API histórica:** `https://api.github.com/repos/izc05/izc05-magina-aventura/actions/artifacts/10621402502/zip`

Ese artefacto histórico es el APK Debug y explica el splash observado fuera de Metro; **no es todavía el APK standalone QA** definido por el workflow actualizado.

## Cómo descargar el APK QA cuando termine el run

### Interfaz web

1. Abrir la pestaña [Actions del repositorio](https://github.com/izc05/izc05-magina-aventura/actions).
2. Abrir el run de `CI` asociado al PR y al commit de la rama.
3. Esperar a que el run termine en verde.
4. En la sección **Artifacts**, descargar `magina-aventura-phase4c-qa-standalone-<run_number>`.
5. Descomprimir el ZIP y conservar juntos los tres archivos.
6. Ejecutar `sha256sum -c SHA256SUMS.txt` antes de instalar.

### API o CLI con sesión autenticada

La descarga de artefactos requiere estar autenticado si GitHub lo solicita. Con GitHub CLI:

```bash
gh run list --repo izc05/izc05-magina-aventura \
  --workflow CI --branch feat/adventure-engine-v2 --limit 10

gh run download <RUN_ID> \
  --repo izc05/izc05-magina-aventura \
  --name 'magina-aventura-phase4c-qa-standalone-*' \
  --dir phase4c-ci-artifact
```

Con la API, listar primero los artefactos del run y descargar el `archive_download_url` del artefacto cuyo nombre empiece por `magina-aventura-phase4c-qa-standalone-`:

```bash
run_id=<RUN_ID>
curl -L \
  -H 'Accept: application/vnd.github+json' \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/repos/izc05/izc05-magina-aventura/actions/runs/$run_id/artifacts" \
  | jq '.artifacts[] | select(.name | startswith("magina-aventura-phase4c-qa-standalone-")) | {id,name,expired,archive_download_url}'

curl -L \
  -H 'Accept: application/vnd.github+json' \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  "https://api.github.com/repos/izc05/izc05-magina-aventura/actions/artifacts/<ARTIFACT_ID>/zip" \
  -o phase4c-ci-artifact.zip
unzip -q phase4c-ci-artifact.zip -d phase4c-ci-artifact
sha256sum -c phase4c-ci-artifact/SHA256SUMS.txt
```

No se debe descargar `app-debug.apk` para esta prueba: esa variante está destinada a desarrollo con Metro. La validación de instalación, arranque, permisos de localización, background, bloqueo de pantalla, force-stop, recovery y GPS sigue siendo física y debe registrar logcat según [`PHASE4C_ANDROID_LOGCAT_AND_EVIDENCE.md`](./PHASE4C_ANDROID_LOGCAT_AND_EVIDENCE.md).

## Bloqueador conocido

Al cerrar esta fase, GitHub confirmó públicamente la existencia del repositorio y de los runs históricos mediante la página web, pero la consulta API devolvió `404` para la lectura nueva. Por ello se conservan como hechos confirmados el run histórico y la definición exacta del workflow, pero no se declara un número de run ni un `SHA256` para el nuevo APK QA hasta que GitHub complete una ejecución del workflow actualizado.
