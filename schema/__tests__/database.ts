import path from "node:path";
import { Worker } from "node:worker_threads";

export type Row = Readonly<Record<string, unknown>>;

export type SqlResult =
  | { readonly ok: true; readonly rows: readonly Row[] }
  | { readonly ok: false; readonly code: string; readonly message: string };

export type RunOptions = { readonly as?: string };

export type Database = {
  attempt(sql: string, options?: RunOptions): Promise<SqlResult>;
  rows(sql: string, options?: RunOptions): Promise<readonly Row[]>;
};

export type Postgres = {
  open(): Promise<Database>;
  closeAll(): Promise<void>;
  stop(): Promise<void>;
};

type Request =
  | { readonly kind: "open"; readonly database: number }
  | { readonly kind: "run"; readonly database: number; readonly sql: string }
  | { readonly kind: "closeAll" };

type Waiter = {
  readonly resolve: (result: SqlResult) => void;
  readonly reject: (error: Error) => void;
};

// Jest cannot import PGlite: its CommonJS build calls dynamic import(), which
// Jest's vm refuses without --experimental-vm-modules. A worker thread loads
// the ES module build outside that vm.
const WORKER_FILE = path.join(__dirname, "pgliteWorker.mjs");

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseResult(reply: Record<string, unknown>): SqlResult | null {
  if (reply.ok === true && Array.isArray(reply.rows) && reply.rows.every(isRecord)) {
    return { ok: true, rows: reply.rows };
  }
  if (reply.ok === false && typeof reply.code === "string" && typeof reply.message === "string") {
    return { ok: false, code: reply.code, message: reply.message };
  }
  return null;
}

function rowsOrThrow(result: SqlResult): readonly Row[] {
  if (!result.ok) throw new Error(`${result.code}: ${result.message}`);
  return result.rows;
}

export async function startPostgres(): Promise<Postgres> {
  const worker = new Worker(WORKER_FILE);
  const waiters = new Map<number, Waiter>();
  let lastId = 0;
  const nextId = () => (lastId += 1);

  worker.on("message", (reply: unknown) => {
    if (!isRecord(reply) || typeof reply.id !== "number") return;
    const waiter = waiters.get(reply.id);
    if (waiter === undefined) return;
    waiters.delete(reply.id);
    const result = parseResult(reply);
    if (result === null) {
      waiter.reject(new Error(`pgliteWorker failed outside SQL: ${String(reply.message)}`));
      return;
    }
    waiter.resolve(result);
  });

  worker.on("error", (error) => {
    const stranded = [...waiters.values()];
    waiters.clear();
    stranded.forEach((waiter) => waiter.reject(error));
  });

  const send = (request: Request) =>
    new Promise<SqlResult>((resolve, reject) => {
      const id = nextId();
      waiters.set(id, { resolve, reject });
      worker.postMessage({ ...request, id });
    });

  const open = async (): Promise<Database> => {
    const database = nextId();
    rowsOrThrow(await send({ kind: "open", database }));
    const run = (sql: string) => send({ kind: "run", database, sql });

    const attempt = async (sql: string, options: RunOptions = {}) => {
      if (options.as === undefined) return run(sql);
      rowsOrThrow(await run(`SET ROLE ${options.as}`));
      try {
        return await run(sql);
      } finally {
        rowsOrThrow(await run("RESET ROLE"));
      }
    };

    return {
      attempt,
      rows: async (sql, options) => rowsOrThrow(await attempt(sql, options)),
    };
  };

  const closeAll = async () => {
    rowsOrThrow(await send({ kind: "closeAll" }));
  };

  // The worker answers nothing until its template cluster exists, so the first
  // round trip is what waits for it.
  await closeAll();

  return { open, closeAll, stop: async () => void (await worker.terminate()) };
}
