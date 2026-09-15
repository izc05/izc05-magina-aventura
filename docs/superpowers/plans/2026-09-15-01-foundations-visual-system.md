# Mágina Aventura Foundations + Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear la base técnica ejecutable y el primer vertical visual de Mágina Aventura, con navegación móvil y pantalla Inicio/Rutas basada en un sistema de diseño propio de Sierra Mágina.

**Architecture:** Monorepo pnpm con `apps/mobile` como aplicación Expo/React Native principal y paquetes compartidos preparados para dominio, geolocalización y gamificación. En esta primera fase no se conecta Supabase ni se implementa GPS real: se construye una base compilable, testeable y visualmente coherente que permita añadir el backend y el motor de actividad sin rehacer la estructura.

**Tech Stack:** Node 22.13+, pnpm 10, Expo SDK 57, React Native 0.86, React 19.2.3, Expo Router 57, TypeScript 6, Vitest para paquetes puros y Jest/React Native Testing Library en la app cuando entren componentes interactivos.

**Spec:** `docs/superpowers/specs/2026-09-15-magina-aventura-product-design.md`

## Global Constraints

- No trabajar directamente sobre `main`.
- La app abre en catálogo de rutas, no en mapa de juego.
- El modo aventura tipo Pokémon GO aparecerá únicamente después de `Iniciar aventura`.
- Mi Olivo y Mi Campo quedan fuera de este repositorio; solo se reservarán contratos de integración futura.
- No usar contenido ficticio como si fuera producción. Los datos de Bedmar de esta fase son fixtures de desarrollo explícitos.
- Mobile first: ancho de referencia visual 390 px.
- Identidad propia Sierra Mágina: olivo, piedra/caliza, tierra, cielo y dorado AOVE. No copiar assets, marcas ni interfaz propietaria de Pokémon GO o Strava.
- Código fuente de terceros solo se reutiliza cuando la licencia lo permite; si no, se usa únicamente como referencia arquitectónica.

---

## File Structure

```text
/
├── apps/
│   └── mobile/
│       ├── app/
│       │   ├── _layout.tsx
│       │   └── index.tsx
│       ├── src/
│       │   ├── features/routes/
│       │   │   ├── fixtures.ts
│       │   │   └── route-types.ts
│       │   └── theme/tokens.ts
│       ├── app.json
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   ├── domain/
│   ├── geo/
│   ├── game-engine/
│   └── contracts/
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.base.json
└── .gitignore
```

Los paquetes `domain`, `geo`, `game-engine` y `contracts` se crean como límites arquitectónicos; no se rellenarán con lógica ficticia hasta que haya pruebas que definan su comportamiento.

---

### Task 1: Bootstrap del monorepo

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`

**Interfaces:**
- Produces: workspace pnpm con `apps/*` y `packages/*`.

- [ ] **Step 1:** definir Node >= 22.13 y pnpm >= 10.
- [ ] **Step 2:** añadir scripts raíz `dev:mobile`, `typecheck`, `test`.
- [ ] **Step 3:** crear `tsconfig.base.json` estricto.
- [ ] **Step 4:** comprobar que la estructura no contiene dependencias duplicadas innecesarias.
- [ ] **Step 5:** commit `chore: bootstrap magina aventura monorepo`.

### Task 2: App móvil Expo 57

**Files:**
- Create: `apps/mobile/package.json`
- Create: `apps/mobile/app.json`
- Create: `apps/mobile/tsconfig.json`
- Create: `apps/mobile/app/_layout.tsx`

**Interfaces:**
- Produces: aplicación Expo Router iniciable mediante `pnpm dev:mobile`.

- [ ] **Step 1:** fijar Expo SDK 57 / React Native 0.86 / React 19.2.3.
- [ ] **Step 2:** configurar `expo-router` como entrypoint.
- [ ] **Step 3:** definir identificadores Android/iOS provisionales `com.isivolt.maginaaventura`.
- [ ] **Step 4:** activar orientación portrait y esquema visual claro inicialmente.
- [ ] **Step 5:** validar `tsc --noEmit`.

### Task 3: Design tokens V1

**Files:**
- Create: `apps/mobile/src/theme/tokens.ts`

**Interfaces:**
- Produces: `colors`, `spacing`, `radius`, `typography`, `shadow`.

Paleta inicial:
- Olivo profundo `#203A2B`
- Olivo activo `#476A45`
- Hoja joven `#789A64`
- AOVE oro `#C89A3D`
- Tierra `#8A6648`
- Caliza `#E7E1D4`
- Fondo cálido `#F7F4ED`
- Tinta `#172019`
- Cielo `#8FB8C8`
- Blanco `#FFFFFF`

- [ ] **Step 1:** crear tokens como objetos TypeScript `as const`.
- [ ] **Step 2:** prohibir colores hex directos en componentes de nueva creación salvo fotografía/imagen.
- [ ] **Step 3:** documentar que estos valores son V1 y se sincronizarán con Figma cuando el archivo tenga permisos de edición.

### Task 4: Contrato de RouteCard y fixtures explícitos

**Files:**
- Create: `apps/mobile/src/features/routes/route-types.ts`
- Create: `apps/mobile/src/features/routes/fixtures.ts`

**Interfaces:**
- Produces: `AdventureRouteCard` y `developmentRoutes`.

```ts
export type RouteDifficulty = 'easy' | 'moderate' | 'hard';

export interface AdventureRouteCard {
  id: string;
  slug: string;
  title: string;
  municipality: string;
  distanceKm: number;
  elevationGainM: number;
  durationMinutes: number;
  difficulty: RouteDifficulty;
  discoveries: number;
  rewardXp: number;
  rewardOlives: number;
  developmentFixture: true;
}
```

- [ ] **Step 1:** escribir tipos antes de la UI.
- [ ] **Step 2:** crear un fixture marcado como desarrollo para `Sendero de Cuadros`.
- [ ] **Step 3:** no inventar descripción histórica ni datos turísticos; solo métricas de demostración claramente etiquetadas.

### Task 5: Pantalla Inicio/Rutas V1

**Files:**
- Create: `apps/mobile/app/index.tsx`

**Interfaces:**
- Consumes: `colors`, `spacing`, `radius`, `typography`, `developmentRoutes`.
- Produces: primer vertical visual navegable de la app.

La pantalla debe incluir:
- cabecera `Mágina Aventura`;
- claim `Camina. Descubre. Conquista Mágina.`;
- bloque hero de Sierra Mágina preparado para fotografía futura;
- buscador visual;
- filtros visuales `Todos`, `Fácil`, `Moderada`, `Difícil`;
- sección `Rutas destacadas`;
- tarjeta del fixture de Bedmar con km, desnivel, duración, descubrimientos, XP y aceitunas;
- navegación inferior conceptual `Rutas · Retos · Colecciones · Ranking · Perfil`.

- [ ] **Step 1:** crear estructura responsive móvil sin dependencias UI externas.
- [ ] **Step 2:** usar únicamente design tokens.
- [ ] **Step 3:** incluir etiqueta visible `Datos de desarrollo` en el fixture.
- [ ] **Step 4:** validar que el modo mapa/juego no aparece en esta pantalla.
- [ ] **Step 5:** typecheck.

### Task 6: Gate inicial de calidad

**Files:**
- Modify: scripts raíz y app si fuera necesario.

- [ ] **Step 1:** instalar dependencias con `pnpm install`.
- [ ] **Step 2:** ejecutar `pnpm typecheck`.
- [ ] **Step 3:** ejecutar `pnpm test` cuando exista la primera prueba de dominio; hasta entonces el script debe terminar de forma explícita sin fingir tests inexistentes.
- [ ] **Step 4:** iniciar Expo y comprobar que la ruta `/` renderiza.
- [ ] **Step 5:** abrir Draft PR contra `main`.

## Exit Criteria

La fase se considera lista cuando:

1. el monorepo instala sin errores;
2. la app Expo 57 arranca;
3. TypeScript está verde;
4. existe una primera pantalla Inicio/Rutas con identidad Mágina Aventura;
5. el catálogo no muestra el mapa de juego antes de iniciar una aventura;
6. el fixture de Bedmar está identificado como desarrollo;
7. `main` permanece intacta y todo el trabajo está en Draft PR.
