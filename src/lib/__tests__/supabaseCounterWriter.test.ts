/** @jest-environment node */

jest.mock("server-only", () => ({}));
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn((url: string, key: string) => ({ url, key })),
}));

const SERVICE_KEY = `h.${Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url")}.s`;
const ANON_KEY = `h.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.s`;

function load(env: Record<string, string | undefined>) {
  jest.resetModules();
  process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ANON_KEY;
  delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  delete process.env.SUPABASE_READ_ONLY;
  for (const [name, value] of Object.entries(env)) {
    if (value !== undefined) process.env[name] = value;
  }
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require("@/lib/supabase") as {
    counterWriter: () => { url: string; key: string } | null;
    supabaseWriter: { key: string } | null;
  };
}

let warned: jest.SpyInstance;
let errored: jest.SpyInstance;

beforeEach(() => {
  warned = jest.spyOn(console, "warn").mockImplementation(() => {});
  errored = jest.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  warned.mockRestore();
  errored.mockRestore();
});

describe("counterWriter", () => {
  it("is the service-role client when the key is a service_role JWT", () => {
    const { counterWriter } = load({ SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY });

    expect(counterWriter()).toEqual({ url: "https://project.supabase.co", key: SERVICE_KEY });
    expect(warned).not.toHaveBeenCalled();
  });

  it("falls back to the anon client and says so once when the key is not set", () => {
    const { counterWriter, supabaseWriter } = load({});

    expect(counterWriter()).toBe(supabaseWriter);
    expect(counterWriter()).toBe(supabaseWriter);
    expect(warned).toHaveBeenCalledTimes(1);
    expect(warned.mock.calls[0][0]).toContain("SUPABASE_SERVICE_ROLE_KEY is not set");
    expect(warned.mock.calls[0][0]).toContain("counter");
  });

  it("falls back to the anon client with one error when the key holds another role", () => {
    const { counterWriter, supabaseWriter } = load({ SUPABASE_SERVICE_ROLE_KEY: ANON_KEY });

    expect(counterWriter()).toBe(supabaseWriter);
    expect(counterWriter()).toBe(supabaseWriter);
    expect(errored).toHaveBeenCalledTimes(1);
    expect(errored.mock.calls[0][0]).toContain('whose role is "anon"');
  });

  it("is null, with no client at all, when SUPABASE_READ_ONLY is true", () => {
    const { counterWriter } = load({ SUPABASE_SERVICE_ROLE_KEY: SERVICE_KEY, SUPABASE_READ_ONLY: "true" });

    expect(counterWriter()).toBeNull();
  });
});
