/** @jest-environment node */
import type { AnchorHTMLAttributes } from "react";
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { JSDOM } from "jsdom";
import { DashboardDailyCard } from "@/components/dashboard/DashboardDailyCard";
import { DAILY_OPENED_KEY } from "@/lib/lab/daily";
import messages from "../../../../messages/en.json";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
}));

const served = renderToString(
  <NextIntlClientProvider locale="en" messages={messages}>
    <DashboardDailyCard />
  </NextIntlClientProvider>,
);

function paint(openedDay: string | null) {
  const dom = new JSDOM(`<!doctype html><body>${served}</body>`, {
    url: "https://thememorychess.com/dashboard",
    runScripts: "dangerously",
    beforeParse(window) {
      if (openedDay) window.localStorage.setItem(DAILY_OPENED_KEY, openedDay);
    },
  });
  return dom.window.document.getElementById("lab-dash-daily");
}

const today = () => new Date().toISOString().slice(0, 10);

describe("the served dashboard daily card", () => {
  it("carries no date-based text", () => {
    expect(paint(null)?.querySelector(".lab-dash-daily-setting")?.textContent).toBe("");
  });

  it("paints for a visitor who has not opened today's board", () => {
    expect(paint(null)?.hidden).toBe(false);
    expect(paint("2020-01-01")?.hidden).toBe(false);
  });

  it("is hidden before first paint for a visitor who already opened today's board", () => {
    expect(paint(today())?.hidden).toBe(true);
  });

  it("hides it with a script written out in full, not a bundled function's source", () => {
    const script = new JSDOM(served).window.document.querySelector("script")?.textContent;
    expect(script).toContain('localStorage.getItem("memory-chess-lab-daily-opened")');
    expect(script).not.toMatch(/=>|\bfunction\b/);
  });
});
