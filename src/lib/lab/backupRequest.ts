import { MAX_SEALED_BYTES } from "./backupCode";

/** What the backup route accepts. The lookup is the only trace of the recovery code that reaches the server. */
export type BackupRequest =
  | { readonly action: "put"; readonly lookup: string; readonly sealed: string }
  | { readonly action: "get"; readonly lookup: string }
  | { readonly action: "delete"; readonly lookup: string };

/** What each action answers: the time a put was saved, the stored record or null, or whether a delete found one. */
export type BackupData =
  | { readonly savedAt: string }
  | { readonly sealed: string; readonly savedAt: string }
  | { readonly deleted: boolean }
  | null;

const LOOKUP = /^[A-Za-z0-9_-]{43}$/;
const BASE64 = /^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
/** The smallest sealed record: a version byte, a 12-byte nonce and a 16-byte tag. */
const MIN_SEALED_BYTES = 29;
export const MAX_SEALED_CHARS = Math.ceil(MAX_SEALED_BYTES / 3) * 4;

const decodedBytes = (base64: string) => (base64.length / 4) * 3 - (base64.match(/=*$/)?.[0].length ?? 0);

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

export function parseBackupRequest(body: unknown): BackupRequest | null {
  if (!isRecord(body) || typeof body.lookup !== "string" || !LOOKUP.test(body.lookup)) return null;
  const { action, lookup, sealed } = body;
  if (action === "get" || action === "delete") return { action, lookup };
  if (action !== "put" || typeof sealed !== "string") return null;
  if (sealed.length > MAX_SEALED_CHARS || !BASE64.test(sealed)) return null;
  const bytes = decodedBytes(sealed);
  return bytes >= MIN_SEALED_BYTES && bytes <= MAX_SEALED_BYTES ? { action, lookup, sealed } : null;
}
