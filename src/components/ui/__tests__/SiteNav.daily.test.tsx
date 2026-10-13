import { render, screen, within } from "@/test-utils/intl";
import SiteNav from "@/components/ui/SiteNav";
import { DAILY_OPENED_KEY } from "@/lib/lab/daily";

jest.mock("@/lib/articles/translatedLocales");
jest.mock("@/i18n/navigation", () => ({ ...jest.requireActual("@/i18n/navigation"), usePathname: () => "/" }));

const nav = () => screen.getByRole("navigation", { name: "Main" });

beforeEach(() => {
  window.localStorage.clear();
  jest.useFakeTimers({ now: Date.parse("2026-10-13T19:48:00Z") });
});
afterEach(() => jest.useRealTimers());

describe("SiteNav daily dot", () => {
  it("marks Dashboard while today's board is unplayed", () => {
    render(<SiteNav />);

    const dashboard = within(nav()).getByRole("link", { name: "Dashboard, today's daily board is ready" });
    expect(dashboard).toHaveTextContent(/^Dashboard$/);
    expect(dashboard.querySelector("[aria-hidden='true'].rounded-full")).not.toBeNull();
  });

  it("drops the mark once today's board was opened", () => {
    window.localStorage.setItem(DAILY_OPENED_KEY, "2026-10-13");
    render(<SiteNav />);

    const dashboard = within(nav()).getByRole("link", { name: "Dashboard" });
    expect(dashboard.querySelector(".rounded-full")).toBeNull();
  });
});
