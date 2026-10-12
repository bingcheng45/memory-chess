import type { AnchorHTMLAttributes } from "react";
import { act, renderWithIntl, screen, within } from "@/test-utils/intl";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import type { LabData } from "@/hooks/useLabData";
import { DAILY_OPENED_KEY } from "@/lib/lab/daily";
import { EMPTY_SUMMARY } from "@/lib/lab/summary";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) => <a href={href} {...props} />,
  usePathname: () => "/game",
  useRouter: () => ({ replace: jest.fn() }),
}));
jest.mock("@/lib/articles/translatedLocales");
const LOADED: LabData = { storage: "available", records: [], summary: EMPTY_SUMMARY, lastBackup: null, today: "2026-10-13" };
jest.mock("@/hooks/useLabData", () => ({ useLabData: () => LOADED }));

const mainNav = () => screen.getByRole("navigation", { name: "Main" });
const dotsIn = (container: HTMLElement) => container.querySelectorAll(".lab-daily-dot").length;

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers({ now: Date.parse("2026-10-13T19:48:00Z") });
});
afterEach(() => jest.useRealTimers());

describe("the daily dot on the Dashboard nav item", () => {
  it("shows on Dashboard in the nav row and the phone menu while today's board is unplayed, and says so", () => {
    const { container } = renderWithIntl(<LabPaperHeader />);

    const dashboard = within(mainNav()).getByRole("link", { name: "Dashboard, today's daily board is ready" });
    expect(dashboard).toHaveAttribute("href", "/dashboard");
    expect(dotsIn(dashboard)).toBe(1);
    expect(within(container.querySelector<HTMLElement>("nav.lab-menu")!).getByRole("link", { name: "Dashboard, today's daily board is ready", hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Menu" })).toContainElement(container.querySelector(".lab-menu-btn .lab-daily-dot"));
    expect(dotsIn(container)).toBe(3);
  });

  it("is gone once today's board was opened and left unfinished", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    const { container } = renderWithIntl(<LabPaperHeader />);

    expect(within(mainNav()).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(dotsIn(container)).toBe(0);
  });

  it("is gone once today's board was played", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    jest.setSystemTime(Date.parse("2026-10-13T23:00:00Z"));
    const { container } = renderWithIntl(<LabPaperHeader />);

    expect(screen.queryByText(/daily board is ready/)).toBeNull();
    expect(dotsIn(container)).toBe(0);
  });

  it("returns at UTC midnight for the next board without a reload", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    jest.setSystemTime(Date.parse("2026-10-13T23:59:50Z"));
    const { container } = renderWithIntl(<LabPaperHeader />);
    expect(dotsIn(container)).toBe(0);

    act(() => jest.advanceTimersByTime(10_000));
    expect(dotsIn(container)).toBe(3);
  });

  it("shows when the browser blocks storage, and the header still renders", () => {
    const blocked = () => {
      throw new DOMException("The operation is insecure.", "SecurityError");
    };
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(blocked);
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(blocked);
    try {
      const { container } = renderWithIntl(<LabPaperHeader />);

      expect(within(mainNav()).getByRole("link", { name: "Dashboard, today's daily board is ready" })).toHaveAttribute("href", "/dashboard");
      expect(dotsIn(container)).toBe(3);
    } finally {
      jest.restoreAllMocks();
    }
  });
});

