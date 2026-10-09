import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { BackupData, BackupRequest } from "@/lib/lab/backupRequest";

const SUPABASE_TIMEOUT_MS = 5000;

export type BackupResult = { status: "ok"; data: BackupData } | { status: "unavailable"; cause: unknown };

let client: SupabaseClient | null = null;

/**
 * The backup functions are executable by service_role only, since the anon key ships to every browser. The client
 * is made on first use, so a deployment without the key and the flag never builds one.
 */
function serviceClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Lab backup needs NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY");
  client ??= createClient(url, key, { auth: { persistSession: false } });
  return client;
}

async function rpc(name: string, args: Record<string, string>): Promise<unknown> {
  const { data, error } = await serviceClient().rpc(name, args).abortSignal(AbortSignal.timeout(SUPABASE_TIMEOUT_MS));
  if (error) throw error;
  return data;
}

async function call(request: BackupRequest): Promise<BackupData> {
  switch (request.action) {
    case "put":
      return { savedAt: String(await rpc("lab_backup_put", { p_lookup: request.lookup, p_sealed: request.sealed })) };
    case "get": {
      const [row] = ((await rpc("lab_backup_get", { p_lookup: request.lookup })) ?? []) as { sealed: string; updated_at: string }[];
      return row ? { sealed: row.sealed, savedAt: row.updated_at } : null;
    }
    case "delete":
      return { deleted: (await rpc("lab_backup_delete", { p_lookup: request.lookup })) === true };
  }
}

export async function runBackup(request: BackupRequest): Promise<BackupResult> {
  try {
    return { status: "ok", data: await call(request) };
  } catch (cause) {
    return { status: "unavailable", cause };
  }
}
