import { after } from "next/server";
import { serviceRoleWriter } from "@/lib/supabase";
import { fixedWindowLimiter } from "@/lib/server/rateLimit";

export type ServerErrorRoute =
  | "leaderboard read"
  | "GET /api/leaderboard"
  | "POST /api/leaderboard"
  | "GET /api/leaderboard/rank"
  | "POST /api/feedback"
  | "POST /api/contact"
  | "GET /api/game-stats"
  | "POST /api/game-stats"
  | "POST /api/articles/stats";

export type ServerErrorKind = "unavailable" | "failed" | "unexpected";

type Detail = Readonly<Record<string, string | number | boolean>>;

type ServerErrorRow = {
  readonly route: ServerErrorRoute;
  readonly kind: ServerErrorKind;
  readonly message: string;
  readonly detail: Detail;
  readonly deploy: string | null;
};

const TABLE = "server_errors";
const MESSAGE_LENGTH = 500;
const DETAIL_TEXT_LENGTH = 100;
const WRITE_TIMEOUT_MS = 2000;
const REPORTS_PER_MINUTE = 20;
const WHOLE_INSTANCE = "instance";
const allowInstanceReport = fixedWindowLimiter({ limit: REPORTS_PER_MINUTE, windowMs: 60_000, maxKeys: 1 });

const REDACTIONS: readonly (readonly [RegExp, string])[] = [
  [/-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, "[private key]"],
  [/eyJ[\w-]+\.[\w-]+\.[\w-]+/g, "[jwt]"],
  [/\bsb_(?:secret|publishable)_[\w-]+/g, "[key]"],
  [/\bBearer\s+\S+/gi, "Bearer [token]"],
  [/(https?:\/\/[^\s?#]+)\?\S*/g, "$1?[query]"],
  [/[\w.+-]+@[\w-]+(?:\.[\w-]+)+/g, "[email]"],
  [/\b\d{1,3}(?:\.\d{1,3}){3}\b/g, "[ip]"],
  [/\b[0-9a-f]{1,4}(?::[0-9a-f]{0,4}){3,7}\b/gi, "[ip]"],
  [/\b[\w-]{32,}\b/g, "[token]"],
];

function clean(text: string, length: number): string {
  const redacted = REDACTIONS.reduce((current, [pattern, replacement]) => current.replace(pattern, replacement), text);
  return redacted.length > length ? `${redacted.slice(0, length - 1)}…` : redacted;
}

function summarize(error: unknown): { message: string; detail: Detail } {
  if (typeof error === "string") return { message: error, detail: {} };
  if (typeof error !== "object" || error === null) return { message: "Unknown error", detail: {} };
  const { message, code } = error as { message?: unknown; code?: unknown };
  return {
    message: typeof message === "string" ? message : "Unknown error",
    detail: {
      ...(error instanceof Error ? { name: error.name } : {}),
      ...(typeof code === "string" ? { code } : {}),
    },
  };
}

function rowOf(route: ServerErrorRoute, kind: ServerErrorKind, error: unknown, extra: Detail): ServerErrorRow {
  const { message, detail } = summarize(error);
  const merged = Object.entries({ ...detail, ...extra }).map(([key, value]) => [
    key,
    typeof value === "string" ? clean(value, DETAIL_TEXT_LENGTH) : value,
  ]);
  return {
    route,
    kind,
    message: clean(message, MESSAGE_LENGTH),
    detail: Object.fromEntries(merged),
    deploy: process.env.VERCEL_GIT_COMMIT_SHA || null,
  };
}

async function store(writer: NonNullable<typeof serviceRoleWriter>, row: ServerErrorRow): Promise<void> {
  try {
    const { error } = await writer.from(TABLE).insert(row).abortSignal(AbortSignal.timeout(WRITE_TIMEOUT_MS));
    if (error) console.error("Server error report not stored:", error.message);
  } catch (cause) {
    console.error("Server error report not stored:", String(cause));
  }
}

/** Stores a redacted copy of an error the caller has already logged. Never throws; the write runs after the response is sent. */
export function reportServerError(route: ServerErrorRoute, kind: ServerErrorKind, error: unknown, detail: Detail = {}): void {
  try {
    const writer = serviceRoleWriter;
    if (!writer || !allowInstanceReport(WHOLE_INSTANCE, Date.now()).allowed) return;
    const row = rowOf(route, kind, error, detail);
    const task = () => store(writer, row);
    try {
      after(task);
    } catch {
      void task();
    }
  } catch (cause) {
    console.error("Server error report not stored:", String(cause));
  }
}
