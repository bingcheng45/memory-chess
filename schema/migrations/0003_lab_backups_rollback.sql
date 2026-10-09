-- 0003 rollback: remove lab_backups and its functions
--
-- Destructive. Dropping the table deletes every player's backup, and a player
-- whose browser data is gone has no other copy. Tell players first, as
-- docs/plans/lab-backup.md describes, before running this.
--
-- Safe to run twice, and safe to run against a partially applied migration.
-- The grants go with the functions and the table.

DROP FUNCTION IF EXISTS public.lab_backup_expire();
DROP FUNCTION IF EXISTS public.lab_backup_delete(TEXT);
DROP FUNCTION IF EXISTS public.lab_backup_get(TEXT);
DROP FUNCTION IF EXISTS public.lab_backup_put(TEXT, TEXT);

DROP TABLE IF EXISTS public.lab_backups;
