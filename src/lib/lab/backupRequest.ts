import { isObject } from "./guards";

/** A sealed record is a version byte, a 12-byte AES-GCM nonce, then the ciphertext with its 16-byte tag. */
export const NONCE_BYTES = 12;
export const MIN_SEALED_BYTES = 1 + NONCE_BYTES + 16;
/** The ciphertext cap the route and the migration enforce. */
export const MAX_SEALED_BYTES = 1024 * 1024;

/**
 * What the backup route accepts. The lookup is the only trace of the recovery code that reaches the server.
 * A put names the save it replaces: the savedAt text this device last read or wrote, unchanged, or null for a
 * first backup. The route answers 409 with the newer savedAt when another device saved since.
 */
export type BackupRequest =
  | { readonly action: "put"; readonly lookup: string; readonly sealed: string; readonly expectedSavedAt: string | null }
  | { readonly action: "get"; readonly lookup: string }
  | { readonly action: "delete"; readonly lookup: string };

/** What each action answers: the time a put was saved, the stored record or null, or whether a delete found one. */
export type BackupData =
  | { readonly savedAt: string }
  | { readonly sealed: string; readonly savedAt: string }
  | { readonly deleted: boolean }
  | null;

const LOOKUP = /^[A-Za-z0-9_-]{43}$/;
const SAVED_AT = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d{1,6})?(?:Z|[+-]\d{2}(?::\d{2})?)$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
export const MAX_SEALED_CHARS = Math.ceil(MAX_SEALED_BYTES / 3) * 4;

const decodedBytes = (base64: string) => (base64.length / 4) * 3 - (base64.endsWith("==") ? 2 : base64.endsWith("=") ? 1 : 0);

export function parseBackupRequest(body: unknown): BackupRequest | null {
  if (!isObject(body) || typeof body.lookup !== "string" || !LOOKUP.test(body.lookup)) return null;
  const { action, lookup, sealed, expectedSavedAt } = body;
  if (action === "get" || action === "delete") return { action, lookup };
  if (action !== "put" || typeof sealed !== "string") return null;
  if (expectedSavedAt !== null && (typeof expectedSavedAt !== "string" || !SAVED_AT.test(expectedSavedAt))) return null;
  if (sealed.length > MAX_SEALED_CHARS || !BASE64.test(sealed)) return null;
  const bytes = decodedBytes(sealed);
  return bytes >= MIN_SEALED_BYTES && bytes <= MAX_SEALED_BYTES ? { action, lookup, sealed, expectedSavedAt } : null;
}
