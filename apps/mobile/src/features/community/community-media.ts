type PublicEnv = Readonly<Record<string, string | undefined>>;

export function readCommunityMediaBaseUrl(env: PublicEnv): string | null {
  const value = env.EXPO_PUBLIC_COMMUNITY_MEDIA_BASE_URL?.trim();

  if (!value) {
    return null;
  }

  if (!value.startsWith('https://')) {
    throw new Error('Community media base URL must use HTTPS');
  }

  return value.replace(/\/+$/, '');
}

export function getCommunityMediaBaseUrl(): string | null {
  return readCommunityMediaBaseUrl({
    EXPO_PUBLIC_COMMUNITY_MEDIA_BASE_URL:
      process.env.EXPO_PUBLIC_COMMUNITY_MEDIA_BASE_URL,
  });
}

export function resolveCommunityPhotoUrl(
  baseUrl: string,
  objectKey: string,
): string {
  const normalizedBase = baseUrl.replace(/\/+$/, '');
  const encodedPath = objectKey
    .split('/')
    .filter((segment) => segment.length > 0)
    .map((segment) => encodeURIComponent(segment))
    .join('/');

  return `${normalizedBase}/${encodedPath}`;
}
