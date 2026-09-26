import { describe, expect, it } from 'vitest';

import { durationLabel, getDevelopmentRouteBySlug } from './route-utils';
import { ma001Chapters, ma001CheckpointContent } from './ma001-pilot-content';

describe('MA-001 pilot route wiring', () => {
  it('resolves the official Las Viñas slug to the GPS-ready pilot route', () => {
    const route = getDevelopmentRouteBySlug('las-vinas');

    expect(route?.id).toBe('MA-001');
    expect(route?.title).toBe('Cuadros · Las Viñas');
    expect(route?.developmentFixture).toBe(true);
  });

  it('keeps the narrative registry aligned with the route map', () => {
    expect(ma001Chapters).toHaveLength(5);
    expect(ma001CheckpointContent).toHaveLength(12);
    expect(ma001CheckpointContent.map((checkpoint) => checkpoint.id)).toEqual([
      'CP00', 'CP01', 'CP02', 'CP03', 'CP04', 'CP05', 'CP06', 'CP07', 'CP08', 'CP09', 'CP10', 'FINAL',
    ]);
  });
});

describe('durationLabel', () => {
  it('shows minutes without a zero-hour prefix for routes under one hour', () => {
    expect(durationLabel(45)).toBe('45 min');
  });

  it('shows full hours without trailing minutes', () => {
    expect(durationLabel(120)).toBe('2 h');
  });

  it('shows hours and remaining minutes for mixed durations', () => {
    expect(durationLabel(150)).toBe('2 h 30 min');
  });
});
