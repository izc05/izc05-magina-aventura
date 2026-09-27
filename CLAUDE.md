# Claude Code — Mágina Aventura

Lee primero `AGENTS.md`. La documentación canónica del Game Kit está en `docs/game/`.

## Objetivo del trabajo

Evolucionar Mágina Aventura desde senderismo gamificado a una experiencia de exploración más jugable sin perder precisión, seguridad ni funcionamiento offline.

No reinventar motores si existe una librería mantenida y compatible, pero tampoco convertir una dependencia externa en el dominio central.

## Método

1. Identifica el gate actual.
2. Revisa compatibilidad con Expo 57 / RN 0.86.2 / React 19.2.3.
3. Implementa solo ese gate.
4. Añade pruebas.
5. Ejecuta typecheck/test/prebuild.
6. No inicies el siguiente gate con el actual rojo.
7. Deja informe exacto en el PR.

## Prohibido

- Cambiar `main` directamente.
- Migrar a Unity/Godot.
- Reemplazar MapLibre.
- Inventar POIs/rutas/áreas reales.
- Meter Rive/Skia/Lottie en splash o startup obligatorio.
- Añadir un framework de estado global solo para FX sin necesidad demostrada.
- Copiar assets o código sin licencia trazable.
