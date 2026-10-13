/** Why /api/contact could not take a message. Each has its own words under contact.errors.reasons in every catalogue. */
export const CONTACT_FAILURES = ["invalid", "unavailable", "notDelivered"] as const;

export type ContactFailure = (typeof CONTACT_FAILURES)[number];

export function isContactFailure(value: unknown): value is ContactFailure {
  return CONTACT_FAILURES.includes(value as ContactFailure);
}
