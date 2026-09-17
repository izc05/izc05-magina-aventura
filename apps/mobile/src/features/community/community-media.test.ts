import { describe, expect, it } from 'vitest';

import {
  readCommunityMediaBaseUrl,
  resolveCommunityPhotoUrl,
} from './community-media';

describe('community media configuration', () => {
  it('returns null when the public media base URL is not configured', () => {
    expect(readCommunityMediaBaseUrl({})).toBeNull();
  });

  it('normalizes an HTTPS media base URL by trimming trailing slashes', () => {
    expect(
      readCommunityMediaBaseUrl({
        EXPO_PUBLIC_COMMUNITY_MEDIA_BASE_URL: 'https://media.magina.example///',
      }),
    ).toBe('https://media.magina.example');
  });

  it('rejects a non-HTTPS media base URL', () => {
    expect(() =>
      readCommunityMediaBaseUrl({
        EXPO_PUBLIC_COMMUNITY_MEDIA_BASE_URL: 'http://media.magina.example',
      }),
    ).toThrow('Community media base URL must use HTTPS');
  });

  it('encodes every object-key path segment without flattening the path', () => {
    expect(
      resolveCommunityPhotoUrl(
        'https://media.magina.example',
        'community/ruta 1/foto #1.jpg',
      ),
    ).toBe(
      'https://media.magina.example/community/ruta%201/foto%20%231.jpg',
    );
  });
});
