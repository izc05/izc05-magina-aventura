import { describe, expect, it } from 'vitest';
import { getCatalogSnapshot } from './catalog-data';
import { createCatalogReader } from './read-model';

describe('createCatalogReader', () => {
  const reader = createCatalogReader(getCatalogSnapshot());

  it('returns route details with derived status and completeness', () => {
    const detail = reader.bySlug('las-vinas');
    expect(detail?.adventure.id).toBe('ma-junta-010');
    expect(detail?.operationalStatus).toBe('closed');
    expect(detail?.completeness.dimensions.geometry.complete).toBe(false);
  });

  it('filters routes by municipality', () => {
    const bedmarRoutes = reader.list({ municipalityId: 'bedmar-y-garciez' });
    expect(bedmarRoutes.map((item) => item.adventure.slug)).toEqual(
      expect.arrayContaining(['adelfal-de-cuadros', 'cano-del-aguadero', 'las-vinas']),
    );
  });

  it('filters by operational status without treating unknown as open', () => {
    expect(reader.list({ operationalStatus: 'closed' }).map((item) => item.adventure.slug)).toContain('las-vinas');
    expect(reader.list({ operationalStatus: 'open' })).toEqual([]);
  });

  it('returns empty POIs until source-backed coordinates are added', () => {
    expect(reader.pois('ma-junta-010')).toEqual([]);
  });
});
