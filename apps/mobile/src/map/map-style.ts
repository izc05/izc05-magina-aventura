export function buildPmtilesSourceUri(
  remoteUrl: string,
  localFileUri?: string,
): string {
  if (localFileUri !== undefined) {
    if (!localFileUri.startsWith('file://')) {
      throw new Error('PMTiles local URI must use file://');
    }

    return `pmtiles://${localFileUri}`;
  }

  if (!remoteUrl.startsWith('https://')) {
    throw new Error('PMTiles remote URL must use HTTPS');
  }

  return `pmtiles://${remoteUrl}`;
}

export function materializeMapStyle(
  styleJson: string,
  sourceUri: string,
): Record<string, unknown> {
  const replaced = styleJson.replaceAll('__ROUTE_PMTILES__', sourceUri);
  const parsed = JSON.parse(replaced) as Record<string, unknown>;

  if (parsed.version !== 8) {
    throw new Error('Map style version must be 8');
  }

  return parsed;
}
