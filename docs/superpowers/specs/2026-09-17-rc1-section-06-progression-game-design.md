# Mágina Aventura — RC1 Section 06 · Progression & Game Engine

Status: **APPROVED PRODUCT CANON**  
Date: 2026-09-17  
Parent design: `2026-09-17-rc1-master-design.md`

This section is authoritative for RC1 progression/game design. Future agents and implementations must preserve these principles unless the product owner explicitly changes them.

## 1. Core principle

**Mágina Aventura does not reward using the app. It rewards exploring Sierra Mágina physically.**

Every core progression mechanic must be able to answer:

> What did this person physically explore, discover or complete to earn this?

If that question cannot be answered, the mechanic probably does not belong in the core product.

Do not design addiction through obligation. Design curiosity about the territory. Avoid punitive streaks, artificial daily-open rewards and mechanics that pressure people to go outdoors in unsuitable conditions.

## 2. Progression pipeline

Conceptually:

`verified adventure → validation → progression engine → XP → level → collections → badges → challenges → rankings → optional rewards`

The client may present provisional state, but protected progression/rewards must be derived from validated activity evidence and deterministic server/domain rules.

## 3. XP

XP represents general explorer experience and must be configurable.

Valid sources can include:
- verified activity completion;
- valid distance;
- valid elevation gain;
- new discoveries;
- first/new route;
- first/new municipality or territory;
- checkpoints;
- special challenge completion.

Exploring new content should be more valuable than repeatedly farming the same easy route. Repetition may remain useful for ordinary activity history, but the progression system must include anti-farming/diminishing policies where appropriate.

Principle: **exploration > farming**.

## 4. Levels

Levels represent global experience. A numerical level may be accompanied by an editorial title (e.g. Caminante, Senderista, Explorador, etc.), but titles are content/configuration rather than hard-coded domain rules.

Level is not a substitute for badges:
- **level** = global accumulated experience;
- **badge** = a meaningful specific story/accomplishment.

## 5. Collections

Collections are a primary retention/exploration mechanism and should map to real territory/content families, for example:
- defensive heritage / castles;
- fountains and springs;
- trees / forests / nature;
- summits;
- olive culture;
- stories and legends.

Collection entries may distinguish states such as:
- known/content visible;
- discovered;
- verified through physical activity/evidence.

Exploration can unlock richer knowledge, media and personal visit history.

Secret/hidden entries may initially reveal only hints rather than exact identity/location.

## 6. Badges

Badges must represent meaningful physical exploration, not arbitrary app interaction.

Examples of valid badge families:
- first verified adventure;
- territorial explorer badges;
- defensive heritage discovery;
- water/fountain contribution or exploration;
- summit exploration;
- multi-municipality exploration;
- thematic collection completion.

Multiple criteria can be required for a single badge. Already-earned badges must not be emitted repeatedly.

### 6.1 Secret badges

Secret badges are permitted when they create curiosity and memorable discovery. Their requirements do not necessarily need to be shown beforehand.

## 7. Challenges

Challenges should encourage healthy exploration without creating artificial pressure.

Supported useful scopes:
- weekly;
- municipal/territorial;
- seasonal;
- special editorial campaigns.

Daily challenges are optional and should be light/non-coercive if used at all.

Examples:
- discover several new places;
- complete different adventures;
- explore multiple municipalities;
- complete a themed territorial objective.

## 8. Seasons

Seasons should relate to Sierra Mágina rather than arbitrary videogame resets.

Possible themes include:
- autumn / olive culture;
- spring / flora and water;
- defensive heritage / Tierra de Frontera;
- other territorially meaningful editorial themes.

The system may change available challenges/content emphasis over time while preserving long-term user history.

## 9. Rankings

Preserve distinct ranking meanings rather than one universal leaderboard:

### Senderista
Focus on physical activity such as distance, elevation and completed adventures.

### Explorador
Focus on discoveries, route variety, municipalities/territories and collection progress.

### Mágina
A broader composite of meaningful activity + exploration + territory + challenge/progression signals.

Rankings must keep anti-farming controls and deterministic tie behavior.

Later scopes may include local municipality rankings and friends/followed explorers, but these are secondary to RC1 core stability.

## 10. Deterministic progression cycle

A verified activity should flow through one authoritative progression orchestration rather than screens calculating XP independently.

The progression cycle must be retry-safe/idempotent: processing the same activity again must not duplicate XP, statistics, badges or challenge completion.

## 11. XP versus olives/reward currency

XP and olives are deliberately separate concepts:

- **XP** = experience / level / prestige; never spent.
- **Olives (🫒)** = optional economy/reward currency; can be granted/spent independently.

Spending olives must never reduce XP or level.

## 12. Olive earning policy

Olives should be more restricted than XP because they may later connect to real-world value.

Potential grant sources:
- selected level milestones;
- special challenges;
- selected verified adventures/events;
- territorial promotions;
- other server-approved achievements.

Do not automatically mint unlimited olives per kilometre.

Protected olive/reward grants must pass server authority/anti-fraud checks such as activity verification, route integrity, location integrity, account eligibility and abuse screening.

## 13. Physical/local rewards

Future rewards may involve local partners such as olive mills, restaurants, shops, accommodation, experiences or local products.

RC1 must not depend on a complete partner network. The exploration product must stand on its own before real-world commerce/rewards are required.

## 14. Mi Olivo

Mi Olivo is a secondary visual representation of progress/reward identity, not the core game.

It may visually grow based on exploration history, adventures and territory, but Mágina Aventura must remain coherent and valuable even if Mi Olivo is disabled.

## 15. Adventure completion presentation

The end-of-adventure experience may combine:
- real distance/time/elevation;
- discovery completion;
- XP/level progress;
- new badges;
- collection progress;
- challenge progress;
- pending/validated reward information;
- useful community condition feedback.

Never present protected progression as final before required validation succeeds.

## 16. Map feedback loop

Progression must feed back into exploration: completed areas, discoveries and personal coverage become visible on the personal map and naturally suggest the next adventure.

Approved outcome: the user returns because there is more territory to discover, not because the app threatens to break a streak.
