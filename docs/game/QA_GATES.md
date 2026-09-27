# Game Kit QA Gates

## Regla

No avanzar de gate con el anterior rojo.

## Checks comunes

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
cd apps/mobile
pnpm exec expo prebuild --platform android --no-install --clean
```

Después volver al root para checks Supabase si el cambio toca contratos/backend.

## Gate A — Pure TypeScript

Requiere:
- typecheck;
- unit tests;
- no cambio de package nativo;
- no cambio de app startup.

## Gate B — Native dependency

Cada nueva dependencia nativa requiere:
- `expo install` cuando esté dentro del ecosistema Expo;
- actualizar lockfile;
- `expo-doctor`;
- prebuild Android;
- compile APK;
- cold start físico;
- reopen;
- navegación Home -> route -> adventure.

Una sola dependencia nativa por PR/gate cuando sea posible.

## Gate C — FX component

Pruebas:
- evento normal;
- evento repetido;
- componente desmontado durante animación;
- reduce motion;
- navegación durante animación;
- background/foreground.

## Gate D — Game map

Pruebas:
- sin payload;
- route payload;
- 0/1/N checkpoints;
- hidden/revealed discoveries;
- heading;
- degraded accuracy;
- layer controls;
- theme switch;
- offline style.

## Gate E — performance

Registrar:
- device/model;
- Android version;
- build SHA;
- duración de prueba;
- startup OK;
- frame drops observables;
- memory abnormality;
- crash buffer/logcat si falla.

## Gate F — field

Antes de V1:
- ruta real;
- permisos;
- background;
- bloqueo de pantalla;
- pérdida de cobertura;
- GPS degradado;
- checkpoint;
- discovery;
- pausa;
- reanudación;
- final;
- summary;
- reward validation.

## Startup invariant

Ningún import de Skia/Lottie/Rive debe convertir el arranque global en requisito de ese runtime si puede cargarse dentro del área de aventura.

Preferir lazy boundaries para FX no esenciales.

## Failure policy

Si una integración causa cierre al abrir:
1. capturar logcat;
2. identificar runtime exacto;
3. revertir/aislar;
4. reproducir con test/build mínimo;
5. no añadir otra librería para “compensar”.

## PR report template

- Gate:
- Base SHA:
- Head SHA:
- Dependencies:
- Files:
- Tests:
- Typecheck:
- Unit:
- Android prebuild:
- APK:
- Cold start:
- Reopen:
- Known issues:
- Next gate:
