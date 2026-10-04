/** @jest-environment node */

import { runAudit } from "./runAudit";

describe("audit-adsense link crawl against a stubbed site", () => {
  const LOCAL = "http://127.0.0.1:4517";
  const ARTICLE = "/de/articles/magnus-carlsen";
  const page = (robots: string, links: string[]) =>
    `<html><head><meta name="robots" content="${robots}"/></head><body>${links.map((href) => `<a href="${href}">link</a>`).join("")}</body></html>`;
  const listedPage = (links: string[]) => page("index, follow", links);

  function crawl(listedLinks: string[], site: Record<string, string>) {
    const program = `await (async () => {
      const site = ${JSON.stringify(site)};
      const fetched = [];
      globalThis.fetch = async (url) => {
        const path = new URL(url).pathname;
        fetched.push(path);
        const response = new Response(site[path] ?? null, { status: path in site ? 200 : 404 });
        Object.defineProperty(response, "url", { value: String(url) });
        return response;
      };
      const listed = audit.parsePage(${JSON.stringify(`${LOCAL}/about`)}, 200, ${JSON.stringify(listedPage(listedLinks))});
      const { broken, unlisted } = await audit.crawlLinks([listed], new Set([${JSON.stringify(`${LOCAL}/about`)}]));
      return JSON.stringify({ fetched, broken: broken.map((b) => b.url + " " + b.status), unlisted: unlisted.map((p) => p.path) });
    })()`;
    return JSON.parse(runAudit(program)) as { fetched: string[]; broken: string[]; unlisted: string[] };
  }

  it("reports an indexable page that a listed page links to", () => {
    const result = crawl(["/settings"], { "/settings": page("index, follow", []) });

    expect(result.unlisted).toEqual(["/settings"]);
    expect(result.broken).toEqual([]);
  });

  it("follows the links of a noindex page to an indexable page that no listed page links to", () => {
    const result = crawl(["/de/articles"], {
      "/de/articles": page("noindex, follow", [ARTICLE]),
      [ARTICLE]: page("index, follow", []),
    });

    expect(result.fetched).toEqual(["/de/articles", ARTICLE]);
    expect(result.unlisted).toEqual([ARTICLE]);
  });

  it("fetches each page once when unlisted pages link to each other and back to a listed page", () => {
    const result = crawl(["/de/articles"], {
      "/de/articles": page("noindex, follow", [ARTICLE, "/about"]),
      [ARTICLE]: page("noindex, follow", ["/de/articles", `${ARTICLE}/`, "/about"]),
    });

    expect(result.fetched).toEqual(["/de/articles", ARTICLE]);
    expect(result.unlisted).toEqual([]);
  });

  it("reports a broken link that only an unlisted page carries", () => {
    const result = crawl(["/de/articles"], { "/de/articles": page("noindex, follow", ["/de/articles/gone"]) });

    expect(result.broken).toEqual([`${LOCAL}/de/articles/gone 404`]);
  });
});
