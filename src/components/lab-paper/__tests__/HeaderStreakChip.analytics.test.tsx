import type { AnchorHTMLAttributes } from "react";
import type { LabSummaryData } from "@/hooks/useLabData";
import { EMPTY_SUMMARY } from "@/lib/lab/summary";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
}));

let mockLabData: LabSummaryData;
jest.mock("@/hooks/useLabData", () => ({ useLabSummary: () => mockLabData }));

const days = (...list: string[]): LabSummaryData => ({
  storage: "available",
  summary: { ...EMPTY_SUMMARY, rounds: list.length, days: list },
  today: "2026-10-07",
});

// Testing Library is imported inside each test, where it may not register its own cleanup hooks.
process.env.RTL_SKIP_AUTO_CLEANUP = "true";
(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;
const mounted: Array<() => void> = [];

/** A fresh page load: the chip's module starts over, as it does when the browser loads a page. */
async function loadPage() {
  jest.resetModules();
  const { renderWithIntl } = await import("@/test-utils/intl");
  const { HeaderStreakChip } = await import("@/components/lab-paper/HeaderStreakChip");
  return () => {
    const view = renderWithIntl(<HeaderStreakChip />);
    mounted.push(view.unmount);
    return view;
  };
}

let gtag: jest.Mock;
beforeEach(() => {
  gtag = jest.fn();
  window.gtag = gtag;
});
afterEach(() => {
  mounted.splice(0).forEach((unmount) => unmount());
  Reflect.deleteProperty(window, "gtag");
});

describe("streak_chip_view", () => {
  it("is sent once per page load, however often the chip mounts again on client-side navigation", async () => {
    mockLabData = days("2026-10-05", "2026-10-06", "2026-10-07");
    const render = await loadPage();
    const first = render();
    render().unmount();
    first.unmount();
    render();

    expect(gtag.mock.calls).toEqual([["event", "streak_chip_view", { state: "active", streak_days: "3-6" }]]);
  });

  it("names a two-day streak that ends today", async () => {
    mockLabData = days("2026-10-04", "2026-10-05");
    (await loadPage())();

    expect(gtag.mock.calls).toEqual([["event", "streak_chip_view", { state: "ends_today", streak_days: "2" }]]);
  });

  it("groups a week or more as 7+", async () => {
    mockLabData = days("2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04", "2026-10-05", "2026-10-06", "2026-10-07");
    (await loadPage())();

    expect(gtag.mock.calls).toEqual([["event", "streak_chip_view", { state: "active", streak_days: "7+" }]]);
  });

  it("is not sent when one day is played, so the chip does not show", async () => {
    mockLabData = days("2026-10-07");
    (await loadPage())();

    expect(gtag.mock.calls).toEqual([]);
  });

  it("is not sent before the record is read", async () => {
    mockLabData = { ...days("2026-10-06", "2026-10-07"), today: "" };
    (await loadPage())();

    expect(gtag.mock.calls).toEqual([]);
  });
});
