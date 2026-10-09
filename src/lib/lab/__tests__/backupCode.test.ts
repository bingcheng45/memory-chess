/** @jest-environment node */

import { createDecipheriv, hkdfSync } from "node:crypto";
import { gunzipSync } from "node:zlib";
import { BackupUnsupportedError, backupKeysOf, generateRecoveryCode, openRecord, parseRecoveryCode, sealRecord } from "@/lib/lab/backupCode";
import { MAX_SEALED_BYTES } from "@/lib/lab/backupRequest";

const CODE = "7K2QM-9XRT4-VBN8H-D3WCF";
const keysOf = (typed: string) => {
  const code = parseRecoveryCode(typed);
  if (!code) throw new Error(`not a recovery code: ${typed}`);
  return backupKeysOf(code);
};
const RECORD = JSON.stringify({ format: "memory-chess-lab", v: 2, rounds: [{ id: "r1" }] });

describe("recovery codes", () => {
  it("spells 20 random characters, 5 bits each, in four groups", () => {
    const bytes = Uint8Array.from({ length: 20 }, (_, index) => index * 13);

    expect(generateRecoveryCode(() => bytes)).toBe("0DT7M-1EV8N-2FW9P-3GXAQ");
  });

  it("reads a typed code however it was spaced, cased or misread", () => {
    expect(parseRecoveryCode(" 7k2qm 9xrt4-vbn8h d3wcf ")).toBe(CODE);
    expect(parseRecoveryCode("ODT7M-IEV8N-2FW9P-3GXAQ")).toBe("0DT7M-1EV8N-2FW9P-3GXAQ");
    expect(parseRecoveryCode("odt7m-lev8n-2fw9p-3gxaq")).toBe("0DT7M-1EV8N-2FW9P-3GXAQ");
  });

  it("refuses a code of the wrong length or with a letter the alphabet leaves out", () => {
    expect(parseRecoveryCode("7K2QM-9XRT4-VBN8H-D3WC")).toBeNull();
    expect(parseRecoveryCode("7K2QM-9XRT4-VBN8H-D3WCFF")).toBeNull();
    expect(parseRecoveryCode("7K2QM-9XRT4-VBN8H-D3WCU")).toBeNull();
    expect(parseRecoveryCode("")).toBeNull();
  });
});

describe("backup keys", () => {
  it("derives the lookup the server hashes with HKDF-SHA-256 over the code's 20 characters", async () => {
    const independent = Buffer.from(hkdfSync("sha256", "7K2QM9XRT4VBN8HD3WCF", "memory-chess-lab-backup/v1", "lookup", 32)).toString("base64url");

    expect(independent).toBe("GzS0Asu0aZQJ4xDR4UiO1fLsudFOtZo_eVr0gec2pVc");
    expect((await keysOf(CODE)).lookup).toBe(independent);
  });

  it("seals a record that Node opens with its own HKDF key, AES-256-GCM, the version and label as associated data, and gunzip", async () => {
    const sealed = Buffer.from(await sealRecord(RECORD, (await keysOf(CODE)).key));
    const key = Buffer.from(hkdfSync("sha256", "7K2QM9XRT4VBN8HD3WCF", "memory-chess-lab-backup/v1", "seal", 32));
    const open = (associated: Buffer | null) => {
      const decipher = createDecipheriv("aes-256-gcm", key, sealed.subarray(1, 13));
      decipher.setAuthTag(sealed.subarray(-16));
      if (associated) decipher.setAAD(associated);
      return gunzipSync(Buffer.concat([decipher.update(sealed.subarray(13, -16)), decipher.final()])).toString("utf8");
    };

    expect(open(Buffer.concat([Buffer.from([1]), Buffer.from("memory-chess-lab-backup")]))).toBe(RECORD);
    expect(() => open(null)).toThrow("Unsupported state or unable to authenticate data");
    expect(() => open(Buffer.concat([Buffer.from([2]), Buffer.from("memory-chess-lab-backup")]))).toThrow("Unsupported state or unable to authenticate data");
  });

  it("opens only with the code that sealed it", async () => {
    const { key } = await keysOf(CODE);
    const sealed = await sealRecord(RECORD, key);

    expect(sealed[0]).toBe(1);
    expect(await openRecord(sealed, key)).toBe(RECORD);
    expect(await openRecord(sealed, (await keysOf("0DT7M-1EV8N-2FW9P-3GXAQ")).key)).toBeNull();
  });

  it("refuses a sealed record that was changed, truncated or from another version", async () => {
    const { key } = await keysOf(CODE);
    const sealed = await sealRecord(RECORD, key);
    const flipped = Uint8Array.from(sealed, (byte, index) => (index === sealed.length - 1 ? byte ^ 1 : byte));
    const otherVersion = Uint8Array.from(sealed, (byte, index) => (index === 0 ? 2 : byte));

    expect(await openRecord(flipped, key)).toBeNull();
    expect(await openRecord(sealed.slice(0, 28), key)).toBeNull();
    expect(await openRecord(otherVersion, key)).toBeNull();
  });

  it("stops inflating a record at the import cap and refuses it", async () => {
    const { key } = await keysOf(CODE);
    const bomb = " ".repeat(200_000);
    const sealed = await sealRecord(bomb, key);

    expect(sealed.length).toBeLessThan(1_000);
    expect(await openRecord(sealed, key, 100_000)).toBeNull();
    expect(await openRecord(sealed, key, 200_000)).toBe(bomb);
  });

  it("compresses before sealing, so the largest record fits the 1 MiB cap", async () => {
    const { key } = await keysOf(CODE);
    const rounds = Array.from({ length: 5000 }, (_, index) => ({ id: `round-${index}`, targetFen: "4k3/8/8/3q4/8/5N2/8/4K3", accuracy: index % 101 }));
    const large = JSON.stringify({ format: "memory-chess-lab", v: 2, rounds });

    const sealed = await sealRecord(large, key);

    expect(large.length).toBeGreaterThan(MAX_SEALED_BYTES / 4);
    expect(sealed.length).toBeLessThan(MAX_SEALED_BYTES / 10);
    expect(await openRecord(sealed, key)).toBe(large);
  });
});

describe("a browser without the crypto or compression the backup needs", () => {
  it("refuses with a typed error when CompressionStream is missing", async () => {
    const { key } = await keysOf(CODE);
    const original = globalThis.CompressionStream;
    Reflect.deleteProperty(globalThis, "CompressionStream");

    try {
      await expect(sealRecord(RECORD, key)).rejects.toBeInstanceOf(BackupUnsupportedError);
    } finally {
      globalThis.CompressionStream = original;
    }
  });

  it("refuses with a typed error when crypto.subtle is missing", async () => {
    jest.replaceProperty(globalThis, "crypto", { getRandomValues: crypto.getRandomValues.bind(crypto) } as Crypto);
    const code = parseRecoveryCode(CODE);
    if (!code) throw new Error("not a recovery code");

    await expect(backupKeysOf(code)).rejects.toBeInstanceOf(BackupUnsupportedError);
    await expect(backupKeysOf(code)).rejects.toThrow("This browser cannot encrypt a backup.");
  });

  afterEach(() => jest.restoreAllMocks());
});
