# Protocolo de Prueba Física de Campo — Sendero de Cuadros (RC1)

Este documento registra la especificación y plantilla de evidencias para la ejecución del gate físico manual en el **Sendero de Cuadros** (`MA-001`, Bedmar y Garcíez).

## 1. Identidad Única del Candidato (Candidate Identity)

El gate físico manual es estrictamente vinculante al SHA exacto del candidato compilado por CI:

- **Source Commit SHA**: `887993b` (o descendiente directo verificado)
- **Rama local**: `integration/rc1`
- **Entorno objetivo**: `staging`
- **Artefacto APK**: Generado vía GitHub Actions ARM64 preview workflow
- **Ruta de prueba**: Sendero de Cuadros (`MA-001`, versión de geometría 1, versión de contenido 2)
- **Manifiesto Offline**: `OfflineAdventureManifestV1` (`pkg-cuadros-rc1`)

---

## 2. Secuencia de Ejecución del Recorrido Crítico de Campo

```text
1. Instalación limpia del APK ARM64 en dispositivo Android de prueba.
2. Registro / Inicio de sesión de cuenta en entorno Staging.
3. Localización de la ruta Sendero de Cuadros en el catálogo.
4. Carga de la vista detallada de la ruta.
5. Descarga y verificación atómica del paquete offline (PMTiles + metadatos).
6. Verificación de permisos de GPS en primer y segundo plano en la pantalla de Preparación.
7. Inicio de la aventura ("Comenzar Aventura").
8. Caminata en ruta real registrando muestras de ubicación GPS.
9. Bloqueo de pantalla por un periodo continuo de al menos 5 minutos (prueba de background task).
10. Conmutación a otras aplicaciones y retorno a Mágina Aventura.
11. Simulación de pérdida de red (Modo Avión) durante el recorrido.
12. Alcance de checkpoint y activación de notificación de proximidad (radio de 25m).
13. Activación de hallazgo / descubrimiento etnológico.
14. Captura de fotografía privada con la cámara integrada.
15. Finalización y guardado de la aventura.
16. Restablecimiento de red y sincronización de lotes (`activity_track_batches`).
17. Verificación de validación por el servidor (`VERIFIED`) y asignación de XP/olivas.
```

---

## 3. Registro de Resultado de Gate

- **Estado del Gate Físico**: `MANUAL` (Pendiente de ejecución física sobre APK de CI)
- **Resultado Esperado**: `PASSED` registrado en `rc1_readiness_evidence` vinculado al SHA exacto.
