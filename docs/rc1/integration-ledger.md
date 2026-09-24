# RC1 Integration Ledger

| Order | Capability | Source branch | Audited source SHA | Result SHA | Automated gate | Manual gate | Notes |
|---:|---|---|---|---|---|---|---|
| 0 | Mobile pre-beta baseline | feat/prebeta-ux-polish-v1 | 044d89cb12cb20f683d99524ea5f946276e3a045 | 044d89cb12cb20f683d99524ea5f946276e3a045 | READY after baseline gate | GPS/Cuadros field pending | RC1 starting point |
| 1 | Auth/Profile + Community | feat/04-community-mobile | 9db861b34a96075bc8e10bb58230e14aa2a50f30 | 0bad13b | READY | N/A | Merged in Task 2 |
| 2 | Exploration/Rewards | feat/07d-reward-delivery-plan | 249f1d8876a0b26a2864ce26794b0fa26afb266e | 8912d0c | READY | N/A | Merged in Task 2 |
| 3 | Beta readiness | feat/08a-beta-readiness | 94b6536e9f037e628cd968b9f1de72529f3dfa25 | 6d65457 | READY | N/A | Merged in Task 2 |
| 4 | Canonical catalog | feat/adventure-catalog-v1 | d252a9d4da3dec4e0e96556e47b4083c12a23f78 | 0fca7ad | PENDING TESTS | N/A | Merged in Task 2 |
| 5 | Admin base | feat/admin-v1 | df697eb38a7b109c0f4aaf9b81314eaba1d54e84 | e17df911a79ca3c69b29b6ab32b759c25ed165ae | PENDING TESTS | N/A | Merged in Task 3 |
| 6 | Admin branding | feat/admin-official-brand-v1 | f12e95857e573e4ddf51969321f027607010804c | e17df911a79ca3c69b29b6ab32b759c25ed165ae | PENDING TESTS | N/A | Merged in Task 3 |
| 7 | Admin discoveries | feat/admin-route-master-discoveries-v1 | 4f46876ac959f6124b5c56b9d788ddd622359073 | e17df911a79ca3c69b29b6ab32b759c25ed165ae | PENDING TESTS | N/A | Merged in Task 3 |
| 8 | Admin catalog ingest | feat/admin-catalog-ingest-v1 | 64fd5cd89448b32adae01239d4f66e72793c76d1 | e17df911a79ca3c69b29b6ab32b759c25ed165ae | PENDING TESTS | N/A | Merged in Task 3 |

## Rulings

### Branding Assets
- **Ruling:** Mantener placeholders PNG (daptive-icon.png, icon.png, splash-logo.png) como TEMPORARY DEVELOPMENT ASSET.
- **Razón:** Los assets oficiales integrados en eat/admin-official-brand-v1 son SVGs, pero Expo pp.json requiere PNGs. Los PNGs reales no existen aún en el repositorio.
- **Deuda:** Bloqueante antes de la release RC1, deben generarse los PNG oficiales.

### Eliminated Test: human-lookups-integration.test.mjs
- **Ruling:** Mantener la eliminación.
- **Evidencia:** git log --all demuestra que lookup-tools.mjs nunca existió en el historial, haciendo del test un artefacto huérfano e inválido introducido en 4f46876a.
- **Cobertura equivalente:** pps/admin/tests/lookups.test.mjs cubre la lógica funcional de las opciones amigables (ej. outeOptions, municipalityOptions) importando desde src/core/lookups.mjs.


| 9 | Mobile Route View | N/A | N/A | 55613593e8503a009e9bf6be0ca189cdba21f6ff | READY | Task 4 | Replacing pre-beta fixtures with canonical catalog view |
- Task 4 Review: Replaced development routes with useRouteCatalog. Mapped catalog completeness accurately.
- GATE: IMPLEMENTED_PENDING_DB_VALIDATION

| 10 | Validation & Progression | N/A | N/A | 6538a7b166e35134ad1b1175fbf883df85403480 | PENDING TESTS | Task 5 | Activity validation state and progression schema |
- Task 5 Review: Added validation tables, progression ledger, atomic RPC and pgTAP tests.
- GATE: IMPLEMENTED_PENDING_DB_VALIDATION

| 14 | Final Navigation & Control Center | N/A | N/A | 199a35a12c0622a5a8574464e363380d921c36ab | READY | Task 9 | Expo Router tabs, candidate-bound readiness evidence and Control Center dashboard |
- Task 9 Review: Activated concrete bottom tabs (Rutas, Retos, Colecciones, Ranking, Perfil, Historial), implemented candidate-bound readiness evidence schema and RC1 Control Center admin module.
- GATE: IMPLEMENTED_PENDING_DB_VALIDATION

| 15 | Separate Runtime Environments | N/A | N/A | 7e26488884f62e407709abb937392f960021b292 | READY | Task 10 | Explicit dev/staging/production environment classification, client security and staging runbook |
- Task 10 Review: Added environment classification to SupabasePublicConfig, rejected privileged keys in client config, updated tests, and documented exact 12-step staging smoke test sequence in staging-runbook.md.
- GATE: IMPLEMENTED_PENDING_DB_VALIDATION

| 16 | Cuadros Content Validation | N/A | N/A | c4f92e6968e039804fed44dae254f8152c422330 | READY | Task 11 | Verified Sendero de Cuadros content checklist and pre-field lifecycle state FIELD_TEST_PENDING |
- Task 11 Review: Verified Cuadros (MA-001) track provenance, geometry-derived metrics (8.7 km / 412m D+), checkpoints, discoveries, and offline package manifest. Documented evidence in cuadros-rc1-content-validation.md.
- GATE: IMPLEMENTED_PENDING_DB_VALIDATION
