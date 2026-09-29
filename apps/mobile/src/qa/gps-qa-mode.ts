export function isGpsQaAuthBypassEnabled(
  value = process.env.EXPO_PUBLIC_GPS_QA_AUTH_BYPASS,
): boolean {
  return value === '1';
}
