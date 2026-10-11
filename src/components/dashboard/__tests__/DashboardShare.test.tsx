import { act, fireEvent, renderWithIntl, screen } from "@/test-utils/intl";
import { DashboardShare } from "@/components/dashboard/DashboardShare";
import { trackEvent } from "@/lib/analytics/events";
import type { ShareCard } from "@/lib/lab/dashboard";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));
jest.mock("@/components/dashboard/shareImage", () => ({ drawShareCard: () => Promise.resolve(new Blob(["png"], { type: "image/png" })) }));

const CARD: ShareCard = { figures: [{ id: "span", figure: { value: 8, unit: "pieces", digits: 0 } }], rounds: 40 };
const CAPTION = "My Memory Chess progress: memory span 8 pieces. Can you beat it?";
const URL_TAGGED = "https://thememorychess.com/?utm_source=share&utm_medium=dashboard";

const press = () => act(async () => fireEvent.click(screen.getByRole("button", { name: "Share my progress" })));
const shareMethods = () => jest.mocked(trackEvent).mock.calls.map(([event]) => event);

beforeEach(() => {
  jest.mocked(trackEvent).mockClear();
  URL.createObjectURL = jest.fn(() => "blob:card");
  URL.revokeObjectURL = jest.fn();
  Object.assign(navigator, { clipboard: { writeText: jest.fn(() => Promise.resolve()) } });
});

afterEach(() => {
  Object.assign(navigator, { canShare: undefined, share: undefined });
});

describe("DashboardShare", () => {
  it("hands the card, caption and link to the share sheet where it takes files", async () => {
    const share = jest.fn((data: ShareData) => Promise.resolve(data));
    Object.assign(navigator, { canShare: () => true, share });
    renderWithIntl(<DashboardShare card={CARD} />);

    await press();

    const [data] = share.mock.calls[0];
    expect([data.text, data.url, data.files?.[0].name, data.files?.[0].type]).toEqual([CAPTION, URL_TAGGED, "memory-chess-progress.png", "image/png"]);
    expect(screen.getByRole("status")).toHaveTextContent("Shared.");
    expect(shareMethods()).toEqual([{ name: "lab_dashboard_share", params: { method: "native" } }]);
  });

  it("saves the card and copies the caption with its link where the sheet refuses the file", async () => {
    Object.assign(navigator, { canShare: () => true, share: () => Promise.reject(new DOMException("no", "NotAllowedError")) });
    renderWithIntl(<DashboardShare card={CARD} />);

    await press();

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(`${CAPTION} ${URL_TAGGED}`);
    expect(screen.getByRole("status")).toHaveTextContent("Card saved and caption copied. Post them anywhere.");
    expect(shareMethods()).toEqual([{ name: "lab_dashboard_share", params: { method: "download" } }]);
  });

  it("leaves the page as it was when the player closes the share sheet", async () => {
    Object.assign(navigator, { canShare: () => true, share: () => Promise.reject(new DOMException("closed", "AbortError")) });
    renderWithIntl(<DashboardShare card={CARD} />);

    await press();

    expect(screen.getByRole("status")).toHaveTextContent("");
    expect(shareMethods()).toEqual([]);
  });
});
