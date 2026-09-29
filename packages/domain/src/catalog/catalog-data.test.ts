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

type ExpectedTechnicalSheet = {
  slug: string;
  shape: 'circular' | 'linear';
  distanceKm: number;
  durationMinutes: number;
  difficulty: 'easy' | 'moderate' | 'hard';
};

const verifiedTechnicalSheets: ExpectedTechnicalSheet[] = [
  { slug: 'adelfal-de-cuadros', shape: 'linear', distanceKm: 0.453, durationMinutes: 20, difficulty: 'easy' },
  { slug: 'cano-del-aguadero', shape: 'linear', distanceKm: 14.306, durationMinutes: 300, difficulty: 'hard' },
  { slug: 'castillo-de-albanchez', shape: 'linear', distanceKm: 0.206, durationMinutes: 20, difficulty: 'moderate' },
  { slug: 'castillo-de-mata-bejid', shape: 'linear', distanceKm: 3.55, durationMinutes: 75, difficulty: 'easy' },
  { slug: 'el-peralejo', shape: 'circular', distanceKm: 2.268, durationMinutes: 60, difficulty: 'easy' },
  { slug: 'fuenmayor', shape: 'linear', distanceKm: 6.405, durationMinutes: 140, difficulty: 'moderate' },
  { slug: 'gibralberca', shape: 'circular', distanceKm: 5.653, durationMinutes: 120, difficulty: 'moderate' },
  { slug: 'hoyalinos', shape: 'circular', distanceKm: 2.092, durationMinutes: 60, difficulty: 'moderate' },
  { slug: 'la-cueva-de-la-graja', shape: 'linear', distanceKm: 0.575, durationMinutes: 30, difficulty: 'moderate' },
  { slug: 'las-vinas', shape: 'circular', distanceKm: 8.72, durationMinutes: 180, difficulty: 'moderate' },
  { slug: 'pinar-de-canava', shape: 'linear', distanceKm: 2.35, durationMinutes: 60, difficulty: 'hard' },
  { slug: 'puerto-de-la-mata', shape: 'linear', distanceKm: 13.17, durationMinutes: 290, difficulty: 'moderate' },
  { slug: 'sierra-de-la-cruz', shape: 'circular', distanceKm: 7.292, durationMinutes: 150, difficulty: 'moderate' },
  { slug: 'subida-al-hoyo-de-la-laguna', shape: 'linear', distanceKm: 5.475, durationMinutes: 180, difficulty: 'hard' },
  { slug: 'subida-a-pico-magina-y-miramundos', shape: 'linear', distanceKm: 14.773, durationMinutes: 300, difficulty: 'hard' },
  { slug: 'umbria-de-los-corzos', shape: 'linear', distanceKm: 2.63, durationMinutes: 60, difficulty: 'easy' },
  { slug: 'veredon-mojon-blanco', shape: 'linear', distanceKm: 3.156, durationMinutes: 90, difficulty: 'moderate' },
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

  it.each(verifiedTechnicalSheets)(
    'stores the current official technical sheet for $slug without inventing detailed factors',
    ({ slug, shape, distanceKm, durationMinutes, difficulty }) => {
      const route = getAdventureBySlug(slug);

      expect(route).not.toBeNull();
      expect(route?.shape).toBe(shape);
      expect(route?.metrics.distanceKm).toBe(distanceKm);
      expect(route?.metrics.durationMinutesMin).toBe(durationMinutes);
      expect(route?.metrics.durationMinutesMax).toBe(durationMinutes);
      expect(route?.difficulty.simpleLabel).toBe(difficulty);
      expect(route?.difficulty.physicalDemand).toBeNull();
      expect(route?.difficulty.technicalTerrain).toBeNull();
    },
  );

  it('keeps the current multi-municipality scope for Veredón-Mojón Blanco', () => {
    expect(getAdventureBySlug('veredon-mojon-blanco')?.municipalityIds.sort()).toEqual(
      ['mancha-real', 'pegalajar', 'torres'].sort(),
    );
  });

  it('keeps the official family-friendly evidence for El Peralejo', () => {
    const route = getAdventureBySlug('el-peralejo');
    expect(route?.family.factors).toContainEqual(
      expect.objectContaining({ code: 'official_family_friendly' }),
    );
  });

  it('derives both currently closed Cuadros-area trails as closed', () => {
    const snapshot = getCatalogSnapshot();
    for (const slug of ['adelfal-de-cuadros', 'las-vinas']) {
      const route = getAdventureBySlug(slug);
      expect(route).not.toBeNull();
      expect(
        deriveOperationalStatus(route!.id, snapshot.restrictions, snapshot.sources),
      ).toBe('closed');
    }
  });

  it('passes hard catalog invariants while keeping routes draft until geometry is validated', () => {
    const errors = validateCatalog(getCatalogSnapshot()).filter(
      (issue) => issue.severity === 'error',
    );
    expect(errors).toEqual([]);
  });
});
