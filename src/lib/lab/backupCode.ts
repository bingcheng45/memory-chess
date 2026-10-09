/**
 * The browser half of the opt-in backup in docs/plans/lab-backup.md, unused while the LAB_BACKUP flag is off.
 * The recovery code never leaves the device: it derives a lookup the server stores only as a hash, and a key that
 * seals the export before upload, so the server holds ciphertext it cannot read.
 */

// Crockford's base32: no I, L, O or U, so a code read aloud or retyped has fewer look-alikes.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const CODE_CHARS = 20;
const GROUP = 5;
const SALT = "memory-chess-lab-backup/v1";
const SEAL_VERSION = 1;
const NONCE_BYTES = 12;
const TAG_BYTES = 16;

/** The ciphertext cap the server and the migration enforce. */
export const MAX_SEALED_BYTES = 1024 * 1024;

export type RecoveryCode = string & { readonly __brand: "RecoveryCode" };

export interface BackupKeys {
  /** 32 bytes in unpadded base64url: the only value derived from the code that the server ever receives. */
  readonly lookup: string;
  readonly key: CryptoKey;
}

const randomBytes = (count: number) => crypto.getRandomValues(new Uint8Array(count));
const grouped = (chars: string) => (chars.match(new RegExp(`.{${GROUP}}`, "g")) ?? []).join("-") as RecoveryCode;
const encode = (text: string) => new TextEncoder().encode(text);

/** 20 characters of 5 bits each, 100 bits in all. A byte masked to 5 bits stays uniform, since 32 divides 256. */
export function generateRecoveryCode(random: (count: number) => Uint8Array = randomBytes): RecoveryCode {
  return grouped(Array.from(random(CODE_CHARS), (byte) => ALPHABET[byte & 31]).join(""));
}

export function parseRecoveryCode(typed: string): RecoveryCode | null {
  const chars = typed.toUpperCase().replace(/[\s-]/g, "").replace(/[IL]/g, "1").replace(/O/g, "0");
  return chars.length === CODE_CHARS && [...chars].every((char) => ALPHABET.includes(char)) ? grouped(chars) : null;
}

function base64url(bytes: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** No slow key stretching: 100 random bits cannot be guessed, unlike a password. */
export async function backupKeysOf(code: RecoveryCode): Promise<BackupKeys> {
  const secret = await crypto.subtle.importKey("raw", encode(code.replace(/-/g, "")), "HKDF", false, ["deriveBits", "deriveKey"]);
  const params = (info: string) => ({ name: "HKDF", hash: "SHA-256", salt: encode(SALT), info: encode(info) });
  const lookup = await crypto.subtle.deriveBits(params("lookup"), secret, 256);
  const key = await crypto.subtle.deriveKey(params("seal"), secret, { name: "AES-GCM", length: 256 }, false, ["encrypt", "decrypt"]);
  return { lookup: base64url(lookup), key };
}

const piped = async (bytes: Uint8Array, stream: CompressionStream | DecompressionStream) =>
  new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer());

/** The version byte, a fresh nonce, then the gzipped export sealed with AES-GCM. */
export async function sealRecord(json: string, key: CryptoKey): Promise<Uint8Array> {
  const nonce = randomBytes(NONCE_BYTES);
  const packed = await piped(encode(json), new CompressionStream("gzip"));
  const sealed = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, key, packed));
  const out = new Uint8Array(1 + nonce.length + sealed.length);
  out.set([SEAL_VERSION]);
  out.set(nonce, 1);
  out.set(sealed, 1 + nonce.length);
  return out;
}

/** Null for a wrong code, a changed or cut byte, or a version this build cannot read. */
export async function openRecord(sealed: Uint8Array, key: CryptoKey): Promise<string | null> {
  if (sealed.length < 1 + NONCE_BYTES + TAG_BYTES || sealed[0] !== SEAL_VERSION) return null;
  try {
    const packed = await crypto.subtle.decrypt({ name: "AES-GCM", iv: sealed.slice(1, 1 + NONCE_BYTES) }, key, sealed.slice(1 + NONCE_BYTES));
    return new TextDecoder().decode(await piped(new Uint8Array(packed), new DecompressionStream("gzip")));
  } catch {
    return null;
  }
}
