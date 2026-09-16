# Collections Foundation Implementation Plan

**Goal:** Build a pure deterministic projection for the six Mágina Aventura discovery collections so mobile/admin/server code can show album progress and history without embedding collection math in UI.

**Base:** `feat/05-discoveries-collections-foundation`; branch `feat/05b-collections-foundation`.

## Constraints
- Do not touch Community Mobile, Supabase migrations, GPS mobile integration or `main`.
- Keep collection logic in `@magina-aventura/domain`.
- Canonical categories follow the existing database: `flora`, `fauna`, `heritage`, `olive`, `tradition`, `landscape`.
- Rarity is catalog metadata, not a hard-coded tier system in this foundation.
- Duplicate unlock observations count once; unknown discovery ids never increase progress.
- Empty catalog percentages are `0`, never NaN.

## TDD tasks
1. RED: tests for de-duplication, unknown ids, per-category totals and overall percentage.
2. GREEN: catalog/unlock types + deterministic projection.
3. RED/GREEN: history keeps earliest unlock for a discovery and sorts deterministically.
4. Export from `packages/domain/src/index.ts`.
5. Full CI and Draft PR stacked on Plan 05A.
