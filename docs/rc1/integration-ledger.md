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

