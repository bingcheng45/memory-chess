/**
 * @jest-environment node
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { aiCrawlerVisit, signedAgentName } from "@/lib/analytics/aiCrawlers";
import { ROUND_SOURCES } from "@/lib/analytics/events";

const visit = (headers: Record<string, string>) => aiCrawlerVisit(new Request("https://thememorychess.com/game", { headers }));

describe("AI crawler names", () => {
  it("names a signed agent by its host, not by the quoted address it sends", () => {
    expect(visit({ "signature-agent": '"https://bot.duckduckgo.com"' })?.agent).toBe("bot.duckduckgo.com");
    expect(visit({ "signature-agent": "https://chatgpt.com/" })?.agent).toBe("chatgpt.com");
  });

  it("keeps a signature that is not an address, without its quotes", () => {
    expect(signedAgentName('"some-agent"')).toBe("some-agent");
    expect(signedAgentName("  plain ")).toBe("plain");
  });

  it("prefers the user-agent's bot name over the signature", () => {
    expect(visit({ "user-agent": "Mozilla/5.0 (compatible; GPTBot/1.2)", "signature-agent": '"https://chatgpt.com"' })?.agent).toBe("GPTBot");
  });
});

describe("the analytics guide", () => {
  it("lists every round source the app sends", () => {
    const guide = readFileSync(join(process.cwd(), "docs/analytics.md"), "utf8");
    const missing = ROUND_SOURCES.filter((source) => !guide.includes(`\`${source}\``));
    expect(missing).toEqual([]);
  });
});
