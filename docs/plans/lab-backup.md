# Lab record backup with a recovery code

Status: designed, switched off. The route ships behind `LAB_BACKUP`, which is unset in every environment. The migration is in the repository and is not applied. No page offers a backup.

## Why

The lab record lives in one browser. Clearing site data deletes it, Safari erases it after about 7 days without a visit, and a second device starts empty. Download and Import already cover all three, but only for a player who remembers to download. A backup the player turns on once, restored on any device with a code, removes that chore without an account or an email address.

## What the player sees (not built)

1. In the tools row, Back up my record replaces the disabled Back up across devices button.
2. On the first press the browser makes a recovery code, such as `7K2QM-9XRT4-VBN8H-D3WCF`, and shows it once with Copy and a plain warning: whoever has the code can read and delete the backup, and a lost code cannot be recovered by anyone.
3. The player confirms they saved it. Only then does the first upload run.
4. On another device, Restore from a code takes the code and imports the record through the same rules as Import: adopt into an empty record, merge only new rounds into a non-empty one, never double count.
5. Every later backup restores first. The browser reads the backup, merges any rounds it lacks through the Import rules, and only then uploads, naming the save it read. If another device saved in between, the upload is refused and the browser restores again before retrying, so no device erases rounds it never saw.
6. Delete my backup removes it from the server at once.

The code and the time of the last save this browser read or wrote are kept in this browser's local storage, so later backups need no typing. Clearing browser data removes it, which is the same moment a player most needs it, so the copy in step 2 is the only way back.

## Privacy model

The server never learns the code and cannot read a backup.

| Value | Where it is made | What the server sees |
| --- | --- | --- |
| Recovery code, 20 Crockford base32 characters, 100 random bits | The browser, `crypto.getRandomValues` | Nothing |
| Lookup, HKDF-SHA-256 of the code, info `lookup` | The browser | The lookup in the request body, never in a URL, and only its SHA-256 in the table |
| Sealing key, HKDF-SHA-256 of the code, info `seal`, AES-GCM 256 | The browser | Nothing |
| Sealed record: version byte, 12-byte nonce, AES-GCM of the gzipped export, with the version byte and the label `memory-chess-lab-backup` as associated data | The browser | Ciphertext, its size and when it was written |

What a backup holds is exactly the export file, format `memory-chess-lab` version 2: rounds and lifetime totals. The kept leaderboard entry ids, the plan and goal choices, the daily and review markers and the install note stay out of the export today and so stay out of the backup.

No slow key stretching is needed. A 100-bit random code cannot be guessed the way a password can, so one HKDF step is enough. The lookup is a second derived value rather than the code itself, so a server log or a database leak never holds anything that opens a backup.

The server stores the SHA-256 of the lookup, not the lookup. Someone holding a copy of the table still cannot ask the route for a backup or delete one.

## Server

Code in this PR:

| Piece | File | Behaviour |
| --- | --- | --- |
| Client crypto | `src/lib/lab/backupCode.ts` | Code generation and parsing, HKDF lookup and key, seal and open. Opening stops inflating at the 5 MB import cap. A browser without Web Crypto or gzip streams gets `BackupUnsupportedError`. Nothing imports it yet. |
| Request shape | `src/lib/lab/backupRequest.ts` | `put`, `get` or `delete`, with a 43-character base64url lookup. A `put` carries base64 of 29 bytes to 1 MiB and `expectedSavedAt`, the save it replaces or null for a first backup. |
| Route | `src/app/api/lab/backup/route.ts` | Flag off: every method answers an empty 404 before any other check. Flag on: POST only, 415 unless the body is JSON, 6 requests a minute per address, 413 over the body cap, 400 for a bad request, 409 with the newer `savedAt` when the put lost a compare and swap, 503 with no cause when the store fails. |
| Store calls | `src/lib/services/labBackupService.ts` | Server only. Calls the three functions with a service-role client made on first use. |
| Migration | `schema/migrations/0003_lab_backups.sql`, rollback beside it | Table `lab_backups`, row level security on, no policies, nothing granted to `anon` or `authenticated`. `lab_backup_put`, `lab_backup_get`, `lab_backup_delete` and `lab_backup_expire` are `SECURITY DEFINER` and executable by `service_role` only. |
| Rehearsal | `schema/__tests__/labBackups.test.ts` | PGlite: round trip, compare and swap, hash only, size limits, web roles refused, expiry, re-run and rollback. |

Conflicts. A put is a compare and swap on the save time. `lab_backup_put(lookup, sealed, expected)` writes only when `expected` matches the stored `updated_at`, or when `expected` is null and no backup exists. Otherwise it writes nothing and returns `conflict = true` with the stored time, null when there is no backup, and the route answers 409. Each branch is one statement, so of two devices racing on the same save exactly one wins. A successful put moves `updated_at` strictly forward, so an old time never matches again. The browser must send back the `savedAt` text exactly as it received it: Postgres keeps microseconds, and a value passed through a JavaScript `Date` loses them and never matches.

Why service role. The anon key ships to every browser. A function granted to `anon` could be called straight from the Supabase REST API, skipping the route's flag, rate limit and size check. Granting only `service_role` keeps the route as the one way in.

Limits. A sealed record is at most 1 MiB, enforced by the route, the function and a table check. The heavy persona of 5,003 rounds is 2.8 MB of JSON and 0.33 MB gzipped, so 1 MiB leaves room for the 5 MB import cap. The rate limiter is the same in-memory fixed window as the standing check, so it caps bursts per serverless instance, not an exact quota. Add a Vercel firewall rule on `/api/lab/backup` before launch for a real ceiling.

Retention. `lab_backup_expire()` deletes backups not written for 12 months. It needs a scheduled job, for example pg_cron daily, which is not set up.

## Privacy page text to add before the flag goes on

> Only if you turn on Back up my record does your browser send a copy of your lab record to Memory Chess. It is encrypted on your device with a key made from your recovery code, so Memory Chess cannot read it. Memory Chess stores the encrypted copy, its size and when it was last written, under a value derived from your code, and never receives the code itself. The code is kept in your browser's local storage so later backups need no typing. Delete my backup removes the copy at once, and a copy not updated for 12 months is deleted. To limit how often backups can be sent, the server counts requests from each IP address in its memory for one minute. Google Analytics receives an event when you turn backup on, back up, restore or delete, with no code and no record.

The privacy test must assert this paragraph in the PR that turns the flag on, and the `lab_backup_interest` wording in the existing paragraph must change in the same PR.

## Checklist to turn it on

1. Build the UI above in the lazy home lab chunk, English only, with the privacy text, behind the same flag read on the server.
2. Add `SUPABASE_SERVICE_ROLE_KEY` as a server-only Vercel variable. Never prefix it with `NEXT_PUBLIC_`.
3. Apply `0003_lab_backups.sql` in the Supabase SQL editor, then run the rehearsal's checks by hand: `anon` cannot call the functions.
4. Schedule `select public.lab_backup_expire();` daily.
5. Add a firewall rate rule on `/api/lab/backup`.
6. Set `LAB_BACKUP=on` in Preview first, restore on a second browser, then Production.

## Rolling back

Set `LAB_BACKUP` off, which restores the empty 404 at once. The rollback file drops `lab_backup_put(TEXT, TEXT, TIMESTAMPTZ)` with the other functions. Dropping the table with the rollback file deletes every backup, and a player whose browser data is gone has no other copy, so tell players and leave a month to download before running it.

## Risks

- A lost code is a lost backup. That is the price of no email. The UI must say so before the first upload, not after.
- A shared code shares the record. The UI calls it a password.
- Storage cost from junk uploads is bounded by the size cap, the rate limit and expiry, not by identity.
- The route and service are unit tested and the SQL is rehearsed in PGlite, but nothing has run against a real Supabase project. Step 6 of the checklist is the first end to end test.
