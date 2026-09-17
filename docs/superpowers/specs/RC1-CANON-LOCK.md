# Mágina Aventura — RC1 Canon Lock

Status: **OWNER-LOCKED PRODUCT CANON**  
Date: 2026-09-17

## Authority

The approved RC1 design is controlled by the product owner. No agent, contributor, refactor, implementation convenience, branch integration or automated process may silently reinterpret, replace or weaken an approved canon section.

## Change rule

An approved canon section may only change when the product owner explicitly requests that change.

When such a change occurs:

1. preserve the previous version in Git history;
2. document the reason and affected section;
3. create a new version/revision rather than silently rewriting product intent;
4. review downstream consequences before implementation;
5. do not infer approval from unrelated implementation requests.

## Locked documents

The following documents are authoritative design inputs for RC1 and subsequent compatible releases:

- `2026-09-17-rc1-master-design.md` — approved core sections / product canon;
- `2026-09-17-rc1-section-06-progression-game-design.md` — progression/game canon;
- `2026-09-17-rc1-section-07-map-navigation-design.md` — map/navigation/weather/safety canon;
- `2026-09-17-rc1-section-08-admin-control-center.md` — Admin/Super Admin canon;
- `2026-09-17-rc1-section-09-data-backend-canon.md` — data/backend/storage/sync canon;
- `2026-09-17-rc1-section-10-beta-quality-canon.md` — beta/quality/release-gate canon.

Additional sections explicitly approved by the owner become part of this locked canon even before this manifest is updated; this manifest is a governance aid, not the source of product authority.

## Conflict rule

If implementation code, an old PR, an old spec, generated code, AI suggestion or historical branch conflicts with the approved RC1 canon, the canon wins unless the owner explicitly approves a product-direction change.

Technical implementation may choose a different internal mechanism only when the externally observable behavior, safety guarantees, privacy guarantees and product principles remain equivalent or stronger.

## Non-negotiable summary

Mágina Aventura is a physical exploration experience for Sierra Mágina. The route is the medium; the product is the adventure: discover, choose, prepare, walk, explore, capture, earn, share, progress and return to explore.

Safety, offline reliability, privacy, provenance, server validation of protected outcomes, honest uncertainty, useful community contributions and territorial exploration cannot be traded away for faster implementation.
