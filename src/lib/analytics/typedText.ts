/**
 * Query parameters that hold words a visitor typed: a leaderboard player name and a Learn search. The privacy page
 * promises analytics never receive them, so GA4's first page view and every PostHog event drop them from addresses.
 */
export const TYPED_TEXT_PARAMS = ["player", "q"] as const;

/** One query parameter: its separator, its name and its value, up to the next separator, fragment, quote or space. */
const QUERY_PAIR = /([?&])([^=&#?"'\s]+)=[^&#"'\s]*/g;

function isTypedTextKey(rawKey: string): boolean {
  let key = rawKey.replace(/\+/g, " ");
  try {
    key = decodeURIComponent(key);
  } catch {
    // A malformed escape is compared as written.
  }
  return (TYPED_TEXT_PARAMS as readonly string[]).includes(key);
}

/** The text with every typed-text parameter removed from any address in it. Text with none comes back unchanged. */
export function withoutTypedText(text: string): string {
  if (!text.includes("=")) return text;
  let removed = false;
  const stripped = text.replace(QUERY_PAIR, (pair, separator: string, key: string) => {
    if (!isTypedTextKey(key)) return pair;
    removed = true;
    return separator;
  });
  if (!removed) return text;
  return stripped
    .replace(/\?&+/g, "?")
    .replace(/([?&])&+/g, "$1")
    .replace(/[?&]+(?=[#"'\s]|$)/g, "");
}

/** The same for every string in an event's properties, object keys included, nested objects and lists too. */
export function scrubTypedText<T>(value: T): T {
  if (typeof value === "string") return withoutTypedText(value) as T;
  if (Array.isArray(value)) return value.map(scrubTypedText) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [withoutTypedText(key), scrubTypedText(inner)])) as T;
  }
  return value;
}
