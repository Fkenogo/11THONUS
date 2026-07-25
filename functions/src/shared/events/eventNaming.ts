/**
 * Event naming standard (ENG-P1-002).
 *
 * Event names take the form `<domain>.<event_name>.v<version>`, per
 * TRD11 §11.9. Prevents ad-hoc event-name strings.
 */

const EVENT_TYPE_PATTERN = /^([a-z][a-zA-Z0-9]*)\.([a-z][a-zA-Z0-9]*)\.v(\d+)$/;

export function buildEventType(domain: string, eventName: string, version: number): string {
  return `${domain}.${eventName}.v${version}`;
}

export function isValidEventType(value: string): boolean {
  return EVENT_TYPE_PATTERN.test(value);
}

export type ParsedEventType = {
  domain: string;
  eventName: string;
  version: number;
};

export function parseEventType(value: string): ParsedEventType | undefined {
  const match = value.match(EVENT_TYPE_PATTERN);
  if (!match) {
    return undefined;
  }

  const [, domain, eventName, versionText] = match;
  return { domain: domain!, eventName: eventName!, version: Number(versionText) };
}
