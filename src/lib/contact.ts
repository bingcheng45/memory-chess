/** Why /api/contact could not take a message. Each has its own words under contact.errors.reasons in every catalogue. */
export const CONTACT_FAILURES = ["invalid", "unavailable", "notDelivered"] as const;

export type ContactFailure = (typeof CONTACT_FAILURES)[number];

/** The inquiry types the form offers, each with its label under contact.types. */
export const CONTACT_TYPES = { feedback: "feedback", feature: "featureRequest", inquiry: "general", business: "business" } as const;
export type ContactType = keyof typeof CONTACT_TYPES;
export const CONTACT_TYPE_VALUES = Object.keys(CONTACT_TYPES) as [ContactType, ...ContactType[]];

/** Longer than any real message needs; an email address cannot be longer than 254. */
export const CONTACT_MAX_LENGTH = { name: 100, email: 254, message: 5000 } as const;

export function isContactFailure(value: unknown): value is ContactFailure {
  return CONTACT_FAILURES.includes(value as ContactFailure);
}
