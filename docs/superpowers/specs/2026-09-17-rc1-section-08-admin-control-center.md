# Mágina Aventura — RC1 Section 08: Centro de Control / Super Admin

Status: **approved product canon**  
Date: 2026-09-17

This section is authoritative for the administrative/control-plane direction of Mágina Aventura unless the product owner explicitly changes it.

## Core principle

The Admin is not a generic dashboard. It is the **Centro de Control de Mágina Aventura**: the operational system used to evolve territory, adventures, discoveries, safety, community and progression without requiring code or a new APK whenever native functionality is unchanged.

The mobile app is for explorers. The Admin is the operating system of the digital territory.

## Primary modules

- Inicio / operational dashboard
- Territorio
- Aventuras / Route Master
- Mapa
- Descubrimientos
- Comunidad
- Usuarios
- Progreso
- Temporadas
- Recompensas
- Seguridad
- Notificaciones
- Multimedia
- Partners
- Configuración / feature flags
- Auditoría

## Dashboard

The home dashboard must prioritize actionable operational state rather than vanity metrics: important incidents, official closures/restrictions, routes/content pending review, moderation queue, recent source-water updates, activity volume and platform health.

## Territory model

Admin must support territory → municipality/area → places/routes/content as an editorial and operational hierarchy. Territory data is the canonical basis for concepts such as `Mágina explorada`.

## Route Master

Each adventure has one master record with tabs/sections for:

- General
- Track / mapa
- Preparación
- POI
- Descubrimientos
- Seguridad
- Contenido
- Multimedia
- Comunidad
- Offline
- Progreso
- Historial

Route data must carry provenance and review metadata.

## Route lifecycle and publication

Critical content never goes directly from edit to production. Preserve a controlled lifecycle such as:

`draft → review → ready → published → archived`

Publication gates validate required fields/assets before a route can become public. Geometry/content versions are immutable historical versions; replacing a published track creates a new version rather than silently mutating the old one.

## Geometry / GPX

Admin supports GPX import, visual inspection, PostGIS-backed canonical geometry, checkpoints/discoveries and deliberate publication of geometry versions. Publishing a geometry change must clearly show downstream impact such as offline package invalidation and users affected.

## Discoveries

Discovery editing must expose human concepts, not internal UUIDs. At minimum:

- name/category/subtype
- visible / hidden / secret
- active state
- activation radius/evidence requirements
- XP / reward linkage
- collection / badge / challenge linkage
- camera / QR / checkpoint requirements
- exact validation location vs public/generalized location
- provenance and sensitivity

Sensitive locations must support private exact coordinates and generalized public geometry.

## Visual map editor

Admin should provide a map-based editor for route geometry context, discoveries, checkpoints, water, POIs and other geospatial content. Moving elements creates unpublished changes until deliberately published.

## Safety

Official restrictions/closures and community incidents are separate entities and remain semantically distinct. Admin provides dedicated review workflows for both.

Water/source status gets an operational history rather than a single mutable boolean.

## Community moderation

Admin handles photos, comments, reviews, incidents, reports and user enforcement through prioritized moderation queues. Moderation remains auditable and supports protected privileged roles.

## Users

User management may support states such as active/warned/suspended and operational profile context. Destructive deletion is not the default enforcement mechanism.

## Progression configuration

XP, levels, badges, collections, challenges, seasons and rankings are configured through Admin rather than hard-coded into the mobile UI where possible.

Changes to progression rules should support draft/config simulation before publication. Admin configures policies; deterministic engines calculate results. Admin must not manually edit leaderboard scores as ordinary content.

## Rewards / olives

XP and olives remain distinct. Reward balances and ledger history are not ordinary editable fields. Valuable changes flow through audited, append-only/transactional operations.

Partners/rewards can define cost, stock, validity and per-user limits. QR redemption remains one-time/atomic where used.

## Notifications

Notifications can target useful segments such as all users, territory, saved routes, affected users or configured segments. Avoid forcing every message into a global push.

## Multimedia

Use a reusable media library with provenance/author/license/use/date/alt metadata rather than duplicating anonymous files across routes and pages.

## Feature flags

Feature flags are first-class beta/rollout controls, e.g. camera discovery, olive rewards, rankings, weather and AR. Functionality can ship disabled until operationally ready.

## Roles and authorization

Preserve explicit roles such as Super Admin, Admin, Route Manager, Moderator and Partner. New capabilities do not become implicitly available merely because a role existed before the capability was created. Capability grants remain explicit.

## Super Admin safeguards

Even Super Admin receives strong confirmation and impact previews for high-risk actions such as geometry publication, official closure publication, economy rule changes, reward cancellation and user suspension.

## Audit

Sensitive actions retain immutable audit evidence: actor, action, time, target and reason/context as appropriate.

## AI in Admin

AI can assist with drafts, duplicate detection, missing-content detection and review queues, but cannot autonomously publish critical route/safety content without the platform's validation/publication workflow.

## Non-negotiable rules

1. Content and operational rules should evolve from Admin without a new APK whenever native capabilities do not change.
2. Critical content is never published directly from an edit; it passes validation/state transitions and audit.
3. Geometry changes are versioned and publish deliberately.
4. Exact sensitive geodata is not automatically public.
5. Official safety information and community reports are never conflated.
6. Admin configures deterministic progression/reward rules; it does not fabricate historical user outcomes.
7. Financial/valuable reward state is transaction/audit driven, not direct field editing.
8. RBAC capabilities are explicit and least-privilege oriented.
9. The existing Admin V1 foundation should be integrated and evolved, not casually rewritten.
