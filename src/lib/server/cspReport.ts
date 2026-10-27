const EXTENSION_SCHEME = /^(?:chrome|moz|safari-web|safari)-extension:/i;
const SAMPLE_LENGTH = 80;
const MAX_REPORTS_PER_REQUEST = 3;

export type CspViolation = {
  readonly directive: string;
  readonly blocked: string;
  readonly path: string;
  readonly disposition: string;
  readonly sample: string;
};

type Fields = Readonly<Record<string, unknown>>;

const isFields = (value: unknown): value is Fields => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value: unknown): string => (typeof value === "string" ? value : "");

/** A URL reduced to its origin; keywords such as "inline" and "eval" pass through, and anything else unparseable becomes "other". */
function originOf(uri: string): string {
  if (!uri) return "";
  try {
    const { protocol, origin } = new URL(uri);
    return origin === "null" ? protocol : origin;
  } catch {
    return /^[a-z-]{1,20}$/i.test(uri) ? uri : "other";
  }
}

function pathOf(uri: string): string {
  try {
    return new URL(uri).pathname;
  } catch {
    return "";
  }
}

function violationOf(fields: Fields): CspViolation | null {
  const blockedUri = text(fields["blocked-uri"] ?? fields.blockedURL ?? fields.blockedURI);
  const sourceFile = text(fields["source-file"] ?? fields.sourceFile);
  if (EXTENSION_SCHEME.test(blockedUri) || EXTENSION_SCHEME.test(sourceFile)) return null;
  const directive = text(fields["effective-directive"] ?? fields.effectiveDirective ?? fields["violated-directive"]);
  if (!directive) return null;
  return {
    directive: directive.split(/\s+/)[0].slice(0, 40),
    blocked: originOf(blockedUri),
    path: pathOf(text(fields["document-uri"] ?? fields.documentURL ?? fields.documentURI)),
    disposition: text(fields.disposition) === "enforce" ? "enforce" : "report",
    sample: text(fields["script-sample"] ?? fields.sample).slice(0, SAMPLE_LENGTH),
  };
}

/** Violations from either wire format: `{"csp-report": {...}}` (report-uri) or `[{type, body}]` (Reporting API). Extension noise is dropped. */
export function parseCspReports(payload: unknown): CspViolation[] {
  const entries: unknown[] = Array.isArray(payload)
    ? payload.filter((entry) => isFields(entry) && entry.type === "csp-violation").map((entry) => (entry as Fields).body)
    : [isFields(payload) ? payload["csp-report"] : null];
  return entries
    .slice(0, MAX_REPORTS_PER_REQUEST)
    .flatMap((entry) => (isFields(entry) ? [violationOf(entry)] : []))
    .filter((violation): violation is CspViolation => violation !== null);
}
