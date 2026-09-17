import type { DiagnosticEventV1, DiagnosticEventType } from '@magina-aventura/contracts';

const MAX_LOCAL_EVENTS = 500;

/** Sensitive fields that must never appear in diagnostic event details. */
const FORBIDDEN_KEYS = new Set([
  'authToken', 'auth_token', 'accessToken', 'access_token',
  'refreshToken', 'refresh_token', 'apiKey', 'api_key',
  'serviceKey', 'service_key', 'password', 'secret',
  'supabaseKey', 'supabase_key', 'jwt',
]);

function sanitizeDetails(
  details: Record<string, string | number | boolean | null>,
): Record<string, string | number | boolean | null> {
  const clean: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(details)) {
    if (!FORBIDDEN_KEYS.has(key)) {
      clean[key] = value;
    }
  }
  return clean;
}

export class ActivityDiagnostics {
  private events: DiagnosticEventV1[] = [];
  private readonly appVersion: string;
  private readonly candidateSha: string;

  constructor(appVersion: string, candidateSha: string) {
    this.appVersion = appVersion;
    this.candidateSha = candidateSha;
  }

  emit(
    type: DiagnosticEventType,
    activityId: string | null,
    details: Record<string, string | number | boolean | null> = {},
  ): DiagnosticEventV1 {
    const event: DiagnosticEventV1 = {
      schemaVersion: 'diagnostic-event.v1',
      activityId,
      appVersion: this.appVersion,
      candidateSha: this.candidateSha,
      type,
      occurredAt: new Date().toISOString(),
      details: sanitizeDetails(details),
    };

    this.events.push(event);

    // Bounded buffer
    if (this.events.length > MAX_LOCAL_EVENTS) {
      this.events = this.events.slice(-MAX_LOCAL_EVENTS);
    }

    return event;
  }

  getTimeline(): readonly DiagnosticEventV1[] {
    return [...this.events];
  }

  clear(): void {
    this.events = [];
  }
}
