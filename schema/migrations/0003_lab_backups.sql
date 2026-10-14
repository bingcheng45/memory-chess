-- 0003: add lab_backups and the service-only functions that read and write it
--
-- NOT APPLIED. This backs the opt-in lab record backup, which ships behind the
-- LAB_BACKUP flag, off. Apply it only with the checklist in the design:
-- docs/plans/lab-backup.md
-- Rehearsal: schema/__tests__/labBackups.test.ts
--
-- The browser encrypts the record with a key derived from a recovery code the
-- server never sees, so a row holds ciphertext only. A row is found by the
-- SHA-256 of a second value derived from that code, so the table alone cannot
-- be used to fetch or delete a backup either.
--
-- The site's anon key is public. A function that anon could execute would be
-- reachable without the site's rate limit or flag, so every function here is
-- executable by service_role only, which only the server holds.
--
-- Every statement is guarded, so running this file a second time is a no-op
-- rather than an error, and it keeps the backups written in between.

CREATE TABLE IF NOT EXISTS public.lab_backups (
  lookup_hash BYTEA PRIMARY KEY,
  sealed BYTEA NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT lab_backups_lookup_hash_size CHECK (octet_length(lookup_hash) = 32),
  -- 1 MiB of gzipped ciphertext holds several times the largest record the
  -- 5,000-round cap allows.
  CONSTRAINT lab_backups_sealed_size CHECK (octet_length(sealed) BETWEEN 29 AND 1048576)
);

ALTER TABLE public.lab_backups ENABLE ROW LEVEL SECURITY;

-- No policies, and no privileges for the web roles: RLS does not gate
-- TRUNCATE, so the revoke is what keeps anon from emptying the table.
REVOKE ALL ON public.lab_backups FROM anon, authenticated;

-- The lookup arrives as 32 bytes in unpadded base64url. The sealed record
-- arrives as base64 of at most 1 MiB, checked before decoding.
--
-- A put is a compare and swap. p_expected is the saved time the device last
-- read or wrote, NULL for a device that has never seen a backup under this
-- lookup. The write happens only when that still matches, so a device that
-- missed another device's backup cannot erase the newer rounds; it gets
-- conflict = true with the saved time it missed, NULL if there is no backup,
-- and has to restore before it backs up again. Each branch is one statement,
-- so two puts racing on the same lookup cannot both win.
CREATE OR REPLACE FUNCTION public.lab_backup_put(p_lookup TEXT, p_sealed TEXT, p_expected TIMESTAMPTZ)
RETURNS TABLE (saved_at TIMESTAMPTZ, conflict BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_hash BYTEA;
  v_saved TIMESTAMPTZ;
BEGIN
  IF p_lookup IS NULL OR p_lookup !~ '^[A-Za-z0-9_-]{43}$' THEN
    RAISE EXCEPTION 'invalid backup lookup' USING ERRCODE = '22023';
  END IF;

  IF p_sealed IS NULL OR pg_catalog.length(p_sealed) > 1398104 THEN
    RAISE EXCEPTION 'invalid backup size' USING ERRCODE = '22023';
  END IF;

  v_hash := pg_catalog.sha256(pg_catalog.convert_to(p_lookup, 'UTF8'));

  IF p_expected IS NULL THEN
    INSERT INTO public.lab_backups AS backups (lookup_hash, sealed)
    VALUES (v_hash, pg_catalog.decode(p_sealed, 'base64'))
    ON CONFLICT (lookup_hash) DO NOTHING
    RETURNING backups.updated_at INTO v_saved;
  ELSE
    -- Strictly later than the save it replaces, so the old time never matches again.
    UPDATE public.lab_backups AS backups
    SET sealed = pg_catalog.decode(p_sealed, 'base64'),
        updated_at = GREATEST(pg_catalog.clock_timestamp(), backups.updated_at + INTERVAL '1 microsecond')
    WHERE backups.lookup_hash = v_hash AND backups.updated_at = p_expected
    RETURNING backups.updated_at INTO v_saved;
  END IF;

  IF v_saved IS NOT NULL THEN
    RETURN QUERY SELECT v_saved, false;
  ELSE
    RETURN QUERY SELECT (SELECT backups.updated_at FROM public.lab_backups AS backups WHERE backups.lookup_hash = v_hash), true;
  END IF;
END;
$$;

-- encode() breaks base64 into 76-character lines, which the browser's atob
-- would refuse, so the line breaks are removed.
CREATE OR REPLACE FUNCTION public.lab_backup_get(p_lookup TEXT)
RETURNS TABLE (sealed TEXT, updated_at TIMESTAMPTZ)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    pg_catalog.translate(pg_catalog.encode(backups.sealed, 'base64'), E'\n', ''),
    backups.updated_at
  FROM public.lab_backups AS backups
  WHERE backups.lookup_hash = pg_catalog.sha256(pg_catalog.convert_to(p_lookup, 'UTF8'));
$$;

CREATE OR REPLACE FUNCTION public.lab_backup_delete(p_lookup TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  DELETE FROM public.lab_backups
  WHERE lookup_hash = pg_catalog.sha256(pg_catalog.convert_to(p_lookup, 'UTF8'));
  RETURN FOUND;
END;
$$;

-- For a scheduled job: a backup not written for 12 months is deleted.
CREATE OR REPLACE FUNCTION public.lab_backup_expire()
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted BIGINT;
BEGIN
  DELETE FROM public.lab_backups
  WHERE updated_at < pg_catalog.now() - INTERVAL '12 months';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- A new function is executable by PUBLIC, and Supabase also grants anon and
-- authenticated every function in public by default.
REVOKE EXECUTE ON FUNCTION public.lab_backup_put(TEXT, TEXT, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lab_backup_get(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lab_backup_delete(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.lab_backup_expire() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.lab_backup_put(TEXT, TEXT, TIMESTAMPTZ) TO service_role;
GRANT EXECUTE ON FUNCTION public.lab_backup_get(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.lab_backup_delete(TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.lab_backup_expire() TO service_role;
