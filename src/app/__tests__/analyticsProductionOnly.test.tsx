import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import Script from "next/script";
import SiteGoogleAnalytics from "@/components/common/SiteGoogleAnalytics";
import SiteDatabuddy from "@/components/common/SiteDatabuddy";
import LocaleLayout from "@/app/[locale]/layout";
import { AHREFS_ANALYTICS_SCRIPT_URL } from "@/lib/ahrefs";
import { ADSENSE_SCRIPT_URL } from "@/lib/adsense";

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  setRequestLocale: jest.fn(),
  getMessages: jest.fn(async () => ({})),
}));

function collect(node: ReactNode, match: (element: ReactElement) => boolean): ReactElement[] {
  if (Array.isArray(node)) return node.flatMap((child) => collect(child, match));
  if (!isValidElement(node)) return [];
  const element = node as ReactElement<{ children?: ReactNode }>;
  return [...(match(element) ? [element] : []), ...collect(element.props.children, match)];
}

function scriptWithSrc(src: string) {
  return (element: ReactElement) =>
    element.type === "script" && (element.props as { src?: string }).src === src;
}

async function renderLayout() {
  return LocaleLayout({ children: <div />, params: Promise.resolve({ locale: "en" }) });
}

const originalVercelEnv = process.env.VERCEL_ENV;

afterEach(() => {
  if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
  else process.env.VERCEL_ENV = originalVercelEnv;
});

describe("visitor analytics", () => {
  it("load on the production deployment", async () => {
    process.env.VERCEL_ENV = "production";
    const tree = await renderLayout();

    expect(collect(tree, (element) => element.type === SiteGoogleAnalytics)).toHaveLength(1);
    expect(collect(tree, (element) => element.type === SiteDatabuddy)).toHaveLength(1);
    expect(collect(tree, scriptWithSrc(AHREFS_ANALYTICS_SCRIPT_URL))).toHaveLength(1);
  });

  it.each([
    ["a preview deployment", "preview"],
    ["a local build", undefined],
  ])("stay off %s so test visits are not counted", async (_name, vercelEnv) => {
    if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = vercelEnv;
    const tree = await renderLayout();

    expect(collect(tree, (element) => element.type === SiteGoogleAnalytics)).toHaveLength(0);
    expect(collect(tree, (element) => element.type === SiteDatabuddy)).toHaveLength(0);
    expect(collect(tree, scriptWithSrc(AHREFS_ANALYTICS_SCRIPT_URL))).toHaveLength(0);
  });

  it("leave the AdSense script on every build", async () => {
    delete process.env.VERCEL_ENV;
    const tree = await renderLayout();

    expect(collect(tree, scriptWithSrc(ADSENSE_SCRIPT_URL))).toHaveLength(1);
  });
});

describe("Google Analytics loading", () => {
  const tree = SiteGoogleAnalytics();
  const initScript = () =>
    (collect(tree, (element) => element.type === "script")[0].props as { dangerouslySetInnerHTML: { __html: string } })
      .dangerouslySetInnerHTML.__html;

  afterEach(() => {
    Reflect.deleteProperty(window, "dataLayer");
    Reflect.deleteProperty(document, "referrer");
    document.title = "";
    window.history.replaceState(null, "", "/");
  });

  it("reports the address, referrer and title the visitor landed with, even once the app has moved on before gtag.js loads", () => {
    window.history.replaceState(null, "", "/?utm_source=test&utm_medium=test");
    Object.defineProperty(document, "referrer", { configurable: true, value: "https://www.google.com/" });
    document.title = "Memory Chess Game: Free Online Chess Memory Trainer";

    new Function(initScript())();
    window.history.pushState(null, "", "/game");
    document.title = "Chess Memory Game: Rebuild the Position | Memory Chess";

    const commands = (window as unknown as { dataLayer: IArguments[] }).dataLayer.map((args) => Array.from(args));
    expect(commands.slice(1)).toEqual([
      ["config", "G-R8BM9EMY9J", { send_page_view: false }],
      [
        "event",
        "page_view",
        {
          page_location: "http://localhost/?utm_source=test&utm_medium=test",
          page_referrer: "https://www.google.com/",
          page_title: "Memory Chess Game: Free Online Chess Memory Trainer",
        },
      ],
    ]);
  });

  const firstPageView = () => {
    new Function(initScript())();
    return Array.from((window as unknown as { dataLayer: IArguments[] }).dataLayer[2]);
  };

  it("leaves the title for gtag.js to read when the page has none yet, as on a streamed 404", () => {
    window.history.replaceState(null, "", "/articles/zz-not-real");

    expect(firstPageView()).toEqual([
      "event",
      "page_view",
      { page_location: "http://localhost/articles/zz-not-real", page_referrer: "" },
    ]);
  });

  it("drops the typed player name and search text from the landing address and a same-site referrer, keeping campaign tags", () => {
    window.history.replaceState(
      null,
      "",
      "/leaderboard?player=Test+Name&difficulty=medium&utm_source=share&utm_medium=link",
    );
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "http://localhost/learn/search?q=my+rating&page=2",
    });
    document.title = "Leaderboard | Memory Chess";

    expect(firstPageView()).toEqual([
      "event",
      "page_view",
      {
        page_location: "http://localhost/leaderboard?difficulty=medium&utm_source=share&utm_medium=link",
        page_referrer: "http://localhost/learn/search?page=2",
        page_title: "Leaderboard | Memory Chess",
      },
    ]);
  });

  it.each([
    ["/x?player=x&name=a%20b&t=c~d&s=e,f&p=g/h", "/x?name=a%20b&t=c~d&s=e,f&p=g/h"],
    ["/x?flag&player=x", "/x?flag"],
    ["/x?pl%61yer=x&%71=y&keep=1#top", "/x?keep=1#top"],
    ["/x?a=1&q=y&a=2", "/x?a=1&a=2"],
    ["/x?player=x", "/x"],
  ])("strips only player and q from %s and leaves every other parameter byte for byte", (landing, expected) => {
    window.history.replaceState(null, "", landing);
    document.title = "T";

    expect(firstPageView()).toEqual([
      "event",
      "page_view",
      { page_location: `http://localhost${expected}`, page_referrer: "", page_title: "T" },
    ]);
  });

  describe("without URL or URLSearchParams", () => {
    const realUrl = window.URL;
    const realSearchParams = window.URLSearchParams;

    beforeEach(() => {
      Reflect.deleteProperty(window, "URL");
      Reflect.deleteProperty(window, "URLSearchParams");
    });

    afterEach(() => {
      Object.defineProperty(window, "URL", { configurable: true, writable: true, value: realUrl });
      Object.defineProperty(window, "URLSearchParams", { configurable: true, writable: true, value: realSearchParams });
    });

    it("still sends the landing page view, with the query removed so typed text cannot leak", () => {
      window.history.replaceState(null, "", "/leaderboard?player=Test+Name&utm_source=share");
      Object.defineProperty(document, "referrer", {
        configurable: true,
        value: "http://localhost/learn/search?q=my+rating",
      });
      document.title = "Leaderboard | Memory Chess";

      expect(firstPageView()).toEqual([
        "event",
        "page_view",
        {
          page_location: "http://localhost/leaderboard",
          page_referrer: "http://localhost/learn/search",
          page_title: "Leaderboard | Memory Chess",
        },
      ]);
    });
  });

  it("keeps another site's referrer as it came, query and all", () => {
    window.history.replaceState(null, "", "/?q=kept");
    Object.defineProperty(document, "referrer", {
      configurable: true,
      value: "https://www.bing.com/search?q=memory+chess",
    });
    document.title = "Memory Chess";

    expect(firstPageView()).toEqual([
      "event",
      "page_view",
      {
        page_location: "http://localhost/",
        page_referrer: "https://www.bing.com/search?q=memory+chess",
        page_title: "Memory Chess",
      },
    ]);
  });

  it("loads gtag.js only once the page is idle", () => {
    const library = collect(tree, (element) => element.type === Script);

    expect(library).toHaveLength(1);
    expect(library[0].props).toMatchObject({
      src: "https://www.googletagmanager.com/gtag/js?id=G-R8BM9EMY9J",
      strategy: "lazyOnload",
    });
  });
});
