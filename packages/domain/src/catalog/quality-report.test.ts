import { describe, expect, it } from 'vitest';
import { getCatalogSnapshot } from './catalog-data';
import { buildCatalogQualityReport } from './quality-report';

describe('buildCatalogQualityReport', () => {
  it('reports every canonical adventure and keeps incomplete drafts visible', () => {
    const report = buildCatalogQualityReport(
      getCatalogSnapshot(),
      new Date('2026-09-16T18:40:00Z'),
    );

    expect(report.adventures).toHaveLength(17);
    expect(report.hardErrorCount).toBe(0);

    const lasVinas = report.adventures.find((item) => item.slug === 'las-vinas');
    expect(lasVinas).toEqual(
      expect.objectContaining({
        id: 'ma-junta-010',
        operationalStatus: 'closed',
        hardErrors: [],
      }),
    );
    expect(lasVinas?.completeness.dimensions.geometry.complete).toBe(false);
  });
});
