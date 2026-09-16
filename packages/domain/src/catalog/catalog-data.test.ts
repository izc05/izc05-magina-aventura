import { describe, expect, it } from 'vitest';
import { deriveOperationalStatus } from './operational-status';
import { validateCatalog } from './validate-catalog';
import { getAdventureBySlug, getCatalogSnapshot } from './catalog-data';

const expectedOfficialSlugs = [
  'adelfal-de-cuadros',
  'cano-del-aguadero',
  'castillo-de-albanchez',
  'castillo-de-mata-bejid',
  'el-peralejo',
  'fuenmayor',
  'gibralberca',
  'hoyalinos',
  'la-cueva-de-la-graja',
  'las-vinas',
  'pinar-de-canava',
  'puerto-de-la-mata',
  'sierra-de-la-cruz',
  'subida-al-hoyo-de-la-laguna',
  'subida-a-pico-magina-y-miramundos',
  'umbria-de-los-corzos',
  'veredon-mojon-blanco',
];

describe('official Sierra Mágina starter catalog', () => {
  it('contains the 17 audited official trail identities without publishing unverified geometry', () => {
    const snapshot = getCatalogSnapshot();
    const slugs = snapshot.adventures.map((adventure) => adventure.slug).sort();

    expect(slugs).toEqual([...expectedOfficialSlugs].sort());
    expect(snapshot.adventures).toHaveLength(17);
    expect(snapshot.adventures.every((adventure) => adventure.publicationState === 'draft')).toBe(true);
    expect(snapshot.adventures.every((adventure) => adventure.trackId === null)).toBe(true);
  });

  it('stores official Las Viñas technical data without inventing detailed difficulty factors', () => {
    const route = getAdventureBySlug('las-vinas');

    expect(route).not.toBeNull();
    expect(route?.shape).toBe('circular');
    expect(route?.metrics.distanceKm).toBe(8.72);
    expect(route?.metrics.durationMinutesMin).toBe(180);
    expect(route?.difficulty.simpleLabel).toBe('moderate');
    expect(route?.difficulty.physicalDemand).toBeNull();
    expect(route?.difficulty.technicalTerrain).toBeNull();
  });

  it('stores official Hoyalinos technical data from its current route sheet', () => {
    const route = getAdventureBySlug('hoyalinos');

    expect(route?.shape).toBe('circular');
    expect(route?.metrics.distanceKm).toBe(2.092);
    expect(route?.metrics.durationMinutesMin).toBe(60);
    expect(route?.difficulty.simpleLabel).toBe('moderate');
  });

  it('derives Las Viñas as closed from the current official temporary closure', () => {
    const snapshot = getCatalogSnapshot();
    const route = getAdventureBySlug('las-vinas');
    expect(route).not.toBeNull();

    expect(
      deriveOperationalStatus(route!.id, snapshot.restrictions, snapshot.sources),
    ).toBe('closed');
  });

  it('passes hard catalog invariants while keeping incomplete routes as drafts', () => {
    const errors = validateCatalog(getCatalogSnapshot()).filter(
      (issue) => issue.severity === 'error',
    );
    expect(errors).toEqual([]);
  });
});
