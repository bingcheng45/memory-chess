import type { ReactElement, ReactNode } from "react";
import { isValidElement } from "react";
import { GoogleAnalytics } from "@next/third-parties/google";
import LocaleLayout from "@/app/[locale]/layout";
import { AHREFS_ANALYTICS_SCRIPT_URL } from "@/lib/ahrefs";
import { ADSENSE_SCRIPT_URL } from "@/lib/adsense";

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  setRequestLocale: jest.fn(),
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

    expect(collect(tree, (element) => element.type === GoogleAnalytics)).toHaveLength(1);
    expect(collect(tree, scriptWithSrc(AHREFS_ANALYTICS_SCRIPT_URL))).toHaveLength(1);
  });

  it.each([
    ["a preview deployment", "preview"],
    ["a local build", undefined],
  ])("stay off %s so test visits are not counted", async (_name, vercelEnv) => {
    if (vercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = vercelEnv;
    const tree = await renderLayout();

    expect(collect(tree, (element) => element.type === GoogleAnalytics)).toHaveLength(0);
    expect(collect(tree, scriptWithSrc(AHREFS_ANALYTICS_SCRIPT_URL))).toHaveLength(0);
  });

  it("leave the AdSense script on every build", async () => {
    delete process.env.VERCEL_ENV;
    const tree = await renderLayout();

    expect(collect(tree, scriptWithSrc(ADSENSE_SCRIPT_URL))).toHaveLength(1);
  });
});
