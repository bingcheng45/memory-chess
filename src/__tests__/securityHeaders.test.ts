/** @jest-environment node */
import nextConfig from "../../next.config";

const EVERY_PATH = "/:path*";

async function rules() {
  return (await nextConfig.headers?.()) ?? [];
}

async function headers(): Promise<Record<string, string>> {
  return Object.fromEntries((await rules()).flatMap((rule) => rule.headers.map(({ key, value }) => [key, value])));
}

describe("response headers", () => {
  it("apply to every path: pages, API routes and static assets alike", async () => {
    const every = (await rules()).filter((rule) => rule.source === EVERY_PATH);

    expect(every).toHaveLength(1);
    expect(every[0].headers.map(({ key }) => key)).toContain("X-Frame-Options");
  });

  it("let the piece images be cached for a day and served stale for a week, while the security headers still reach them", async () => {
    const all = await rules();
    const pieces = all.find((rule) => rule.source === "/pieces/:path*");

    expect(pieces?.headers).toEqual([{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }]);
    expect(all.filter((rule) => rule.source === EVERY_PATH || rule.source === "/pieces/:path*")).toHaveLength(2);
  });

  it("set the fixed security headers", async () => {
    const sent = await headers();

    expect(sent["X-Frame-Options"]).toBe("DENY");
    expect(sent["X-Content-Type-Options"]).toBe("nosniff");
    expect(sent["Referrer-Policy"]).toBe("strict-origin-when-cross-origin");
    expect(sent["Permissions-Policy"]).toBe("camera=(), microphone=(), geolocation=()");
    expect(sent["Strict-Transport-Security"]).toBe("max-age=63072000; includeSubDomains");
  });

  it("enforce only frame-ancestors, and report a full content security policy", async () => {
    const sent = await headers();

    expect(sent["Content-Security-Policy"]).toBe("frame-ancestors 'none'");
    expect(sent["Content-Security-Policy-Report-Only"]).toContain("default-src 'self'");
  });
});

describe("the report-only content security policy", () => {
  async function directives() {
    const policy = (await headers())["Content-Security-Policy-Report-Only"];
    return Object.fromEntries(
      policy.split(";").map((part) => {
        const [name, ...sources] = part.trim().split(/\s+/);
        return [name, sources];
      }),
    ) as Record<string, string[]>;
  }

  it("names every directive it governs", async () => {
    expect(Object.keys(await directives()).sort()).toEqual(
      [
        "base-uri",
        "connect-src",
        "default-src",
        "font-src",
        "form-action",
        "frame-ancestors",
        "frame-src",
        "img-src",
        "object-src",
        "script-src",
        "style-src",
      ].sort(),
    );
  });

  it("admits the scripts the site loads", async () => {
    expect((await directives())["script-src"]).toEqual(
      expect.arrayContaining([
        "'self'",
        "'unsafe-inline'",
        "https://*.googlesyndication.com",
        "https://www.googletagmanager.com",
        "https://analytics.ahrefs.com",
        "https://cdn.databuddy.cc",
        "https://www.youtube.com",
      ]),
    );
  });

  it("admits Google Analytics collection at its apex host", async () => {
    expect((await directives())["connect-src"]).toContain("https://analytics.google.com");
  });

  it("frames only the YouTube players and forbids plugins", async () => {
    const policy = await directives();

    expect(policy["frame-src"]).toContain("https://www.youtube.com");
    expect(policy["frame-src"]).toContain("https://www.youtube-nocookie.com");
    expect(policy["object-src"]).toEqual(["'none'"]);
    expect(policy["frame-ancestors"]).toEqual(["'none'"]);
  });

  it("sends no report to a third party", async () => {
    const policy = (await headers())["Content-Security-Policy-Report-Only"];

    expect(policy).not.toContain("report-uri");
    expect(policy).not.toContain("report-to");
  });
});
