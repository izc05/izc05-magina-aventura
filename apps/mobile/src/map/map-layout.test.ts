import { describe, expect, it } from 'vitest';

import { getRouteMapLayout } from './map-layout';

describe('route map layouts', () => {
  it('keeps route details compact while letting the main map feel immersive', () => {
    expect(getRouteMapLayout('embedded')).toEqual({
      height: 260,
      margin: 20,
      borderRadius: 24,
      noticeInset: 12,
    });

    expect(getRouteMapLayout('screen')).toEqual({
      height: 430,
      margin: 0,
      borderRadius: 0,
      noticeInset: 20,
    });
  });
});
