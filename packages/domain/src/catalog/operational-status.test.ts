import { describe, expect, it } from 'vitest';
import type { CatalogSource, Restriction } from '@magina-aventura/contracts';
import { deriveOperationalStatus } from './operational-status';

const officialSource: CatalogSource = {
  id: 'source-official',
  publisher: 'Junta de Andalucía',
  sourceType: 'official_authority',
  title: 'Estado de acceso',
  url: 'https://example.test/status',
  publishedAt: null,
  checkedAt: '2026-09-16',
  licenseNote: null,
  verificationState: 'official_verified',
};

const baseRestriction: Restriction = {
  id: 'r-1',
  scope: { type: 'adventure', adventureId: 'ma-001' },
  type: 'temporary_closure',
  severity: 'blocking',
  status: 'active',
  startsAt: null,
  endsAt: null,
  sourceIds: ['source-official'],
  publishedAt: null,
  checkedAt: '2026-09-16',
  reason: 'Cierre temporal.',
};

describe('deriveOperationalStatus', () => {
  it('returns closed for an active blocking restriction', () => {
    expect(deriveOperationalStatus('ma-001', [baseRestriction], [officialSource])).toBe('closed');
  });

  it('returns unknown when there is no current operational evidence', () => {
    expect(deriveOperationalStatus('ma-001', [], [officialSource])).toBe('unknown');
  });

  it('returns open only for an authoritative active open confirmation', () => {
    const openNotice: Restriction = {
      ...baseRestriction,
      id: 'r-open',
      type: 'open_confirmation',
      severity: 'info',
      reason: 'Acceso confirmado.',
    };
    expect(deriveOperationalStatus('ma-001', [openNotice], [officialSource])).toBe('open');
  });

  it('ignores resolved restrictions', () => {
    const resolved = { ...baseRestriction, status: 'resolved' as const };
    expect(deriveOperationalStatus('ma-001', [resolved], [officialSource])).toBe('unknown');
  });
});
