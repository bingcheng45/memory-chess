import { act, fireEvent, renderWithIntl, screen, waitFor, within } from "@/test-utils/intl";
import { DashboardShare } from "@/components/dashboard/DashboardShare";
import { trackEvent } from "@/lib/analytics/events";
import { saveBlob } from "@/lib/saveBlob";
import { drawShareCard } from "@/components/dashboard/shareImage";
import type { ShareCard } from "@/lib/lab/dashboard";

jest.mock("@/lib/analytics/events", () => ({ ...jest.requireActual("@/lib/analytics/events"), trackEvent: jest.fn() }));
jest.mock("@/lib/saveBlob", () => ({ saveBlob: jest.fn() }));
jest.mock("@/components/dashboard/shareImage", () => ({ drawShareCard: jest.fn() }));

const PNG = new Blob(["png"], { type: "image/png" });
const CARD: ShareCard = {
  figures: [{ id: "span", figure: { value: 8, unit: "pieces", digits: 0 }, context: { kind: "span", values: { rounds: 12, accuracy: 80, memorizeSeconds: 10 } } }],
  rounds: 40,
};
const CAPTION = "My Memory Chess progress: memory span 8 pieces. Can you beat it?";
const URL_TAGGED = "https://thememorychess.com/share/progress/1_s8?utm_source=share&utm_medium=dashboard";

class FakeClipboardItem {
  readonly items: Record<string, Blob>;
  constructor(items: Record<string, Blob>) {
    this.items = items;
  }
}

const openDialog = () => act(async () => fireEvent.click(screen.getByRole("button", { name: "Share my progress" })));
const dialog = () => screen.getByRole("dialog", { name: "Share your progress" });
const press = (name: string) => act(async () => fireEvent.click(within(dialog()).getByRole("button", { name })));
const status = () => within(dialog()).getByRole("status");
const events = () => jest.mocked(trackEvent).mock.calls.map(([event]) => event);

beforeEach(() => {
  jest.mocked(trackEvent).mockClear();
  jest.mocked(saveBlob).mockClear();
  jest.mocked(drawShareCard).mockReset().mockResolvedValue(PNG);
  URL.createObjectURL = jest.fn(() => "blob:card");
  URL.revokeObjectURL = jest.fn();
  Object.assign(navigator, { clipboard: { writeText: jest.fn(() => Promise.resolve()), write: jest.fn(() => Promise.resolve()) } });
  Object.assign(window, { ClipboardItem: FakeClipboardItem });
});

afterEach(() => {
  Object.assign(navigator, { canShare: undefined, share: undefined });
  Object.assign(window, { ClipboardItem: undefined });
});

describe("DashboardShare", () => {
  it("hands the card a rating's change as a direction and a formatted amount, and nothing for a level rating", async () => {
    const rating = (trend: NonNullable<ShareCard["figures"][number]["trend"]>): ShareCard => ({
      rounds: 5,
      figures: [{ id: "rating", figure: { value: 1102, unit: "rating", digits: 0 }, context: { kind: "rating", values: { sign: trend.direction, change: trend.amount, rounds: 5 } }, trend }],
    });
    const lastLead = () => (jest.mocked(drawShareCard).mock.calls.at(-1)?.[0] as { lead: { trend?: unknown } }).lead;

    const { rerender } = renderWithIntl(<DashboardShare card={rating({ direction: "up", amount: 1234 })} />);
    await act(async () => {});
    expect(lastLead().trend).toEqual({ direction: "up", text: "1,234" });

    rerender(<DashboardShare card={rating({ direction: "down", amount: 12 })} />);
    await act(async () => {});
    expect(lastLead().trend).toEqual({ direction: "down", text: "12" });

    rerender(<DashboardShare card={rating({ direction: "level", amount: 0 })} />);
    await act(async () => {});
    expect(lastLead().trend).toBeUndefined();
  });

  it("draws the card into the panel as it shows, in words and numbers ready to print, and opens the dialog from the picture", async () => {
    const { container } = renderWithIntl(<DashboardShare card={CARD} />);
    await act(async () => {});

    expect(container.querySelector(".lab-share-thumb img")?.getAttribute("src")).toBe("blob:card");
    const [copy, , locale] = jest.mocked(drawShareCard).mock.calls.at(-1) ?? [];
    expect([copy, locale]).toEqual([
      {
        kicker: "Lab record",
        lead: { label: "Memory span", segments: [{ text: "8", big: true }, { text: " pieces", big: false }], note: "80% or better in 12 rounds, studied 10 s" },
        grid: [],
        cta: "Can you beat it?",
        site: "thememorychess.com",
      },
      "en",
    ]);

    await act(async () => fireEvent.click(container.querySelector(".lab-share-thumb") as Element));
    expect(within(dialog()).getByRole("img")).toHaveAttribute("src", "blob:card");
  });

  it("holds the panel's place with the Share button disabled until the record is read", () => {
    renderWithIntl(<DashboardShare card="pending" />);

    expect(screen.getByRole("button", { name: "Share my progress" })).toBeDisabled();
    expect(screen.getByText("Make an image of your record to post, save or send.")).toBeInTheDocument();
    expect(drawShareCard).not.toHaveBeenCalled();
  });

  it("offers a first round in place of the card before any round is played", () => {
    renderWithIntl(<DashboardShare card={null} />);

    expect(screen.queryByRole("button", { name: "Share my progress" })).toBeNull();
    expect(screen.getByRole("link", { name: "Play a round" })).toHaveAttribute("href", "/game?pieceCount=6&memorizeTime=10&source=dashboard");
  });

  it("opens a dialog with the card the share makes, described in words, and focus inside it", async () => {
    renderWithIntl(<DashboardShare card={CARD} />);

    await openDialog();

    expect(dialog()).toHaveAttribute("aria-modal", "true");
    expect(dialog()).toContainElement(document.activeElement as HTMLElement);
    expect(document.activeElement).toHaveAccessibleName("Close");
    const image = within(dialog()).getByRole("img");
    expect([image.getAttribute("src"), image.getAttribute("alt")]).toEqual(["blob:card", "Memory Chess progress card: memory span 8 pieces. 40 rounds played."]);
  });

  it("holds the card's place and its buttons, disabled, while the card is drawn", async () => {
    let finish: (png: Blob) => void = () => {};
    jest.mocked(drawShareCard).mockReturnValue(new Promise((resolve) => (finish = resolve)));
    Object.assign(navigator, { canShare: () => true, share: jest.fn() });
    renderWithIntl(<DashboardShare card={CARD} />);

    await openDialog();
    const actions = () => ["Share", "Download image", "Copy image"].map((name) => within(dialog()).getByRole("button", { name }));
    expect(within(dialog()).queryByRole("img")).toBeNull();
    expect(within(dialog()).getByText("Making your card.")).toBeInTheDocument();
    expect(actions().map((button) => button.hasAttribute("disabled"))).toEqual([true, true, true]);

    await act(async () => finish(PNG));
    expect(within(dialog()).getByRole("img")).toBeInTheDocument();
    expect(actions().map((button) => button.hasAttribute("disabled"))).toEqual([false, false, false]);
  });

  it("closes on Escape and hands focus back to the button that opened it", async () => {
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    await act(async () => fireEvent.keyDown(document.activeElement as Element, { key: "Escape" }));

    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toHaveAccessibleName("Share my progress"));
  });

  it("closes from its Close button", async () => {
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    await press("Close");

    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("hands the card, caption and link to the share sheet where it takes files", async () => {
    const share = jest.fn((data: ShareData) => Promise.resolve(data));
    Object.assign(navigator, { canShare: () => true, share });
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    await press("Share");

    const [data] = share.mock.calls[0];
    expect([data.text, data.url, data.files?.[0].name, data.files?.[0].type]).toEqual([CAPTION, URL_TAGGED, "memory-chess-progress.png", "image/png"]);
    expect(status()).toHaveTextContent("Shared.");
    expect(events()).toEqual([{ name: "lab_dashboard_share", params: { method: "native" } }]);
  });

  it("shares the caption and link alone where the sheet cannot take files", async () => {
    const share = jest.fn((data: ShareData) => Promise.resolve(data));
    Object.assign(navigator, { canShare: () => false, share });
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    await press("Share");

    expect(share.mock.calls[0]).toEqual([{ text: CAPTION, url: URL_TAGGED }]);
    expect(status()).toHaveTextContent("Shared.");
  });

  it("says so when the sheet fails, and stays quiet when the player closes it", async () => {
    const share = jest.fn(() => Promise.reject(new DOMException("closed", "AbortError")));
    Object.assign(navigator, { canShare: () => true, share });
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    await press("Share");
    expect(status()).toHaveTextContent("");

    share.mockImplementation(() => Promise.reject(new DOMException("no", "NotAllowedError")));
    await press("Share");
    expect(status()).toHaveTextContent("Sharing did not work here. Download or copy the image instead.");
    expect(events()).toEqual([]);
  });

  it("offers no Share button where there is no share sheet, and makes Download the main action", async () => {
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    expect(within(dialog()).queryByRole("button", { name: "Share" })).toBeNull();
    expect(within(dialog()).getByRole("button", { name: "Download image" })).toHaveClass("lab-btn-primary");
  });

  it("downloads the same PNG as memory-chess-progress.png", async () => {
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    await press("Download image");

    expect(saveBlob).toHaveBeenCalledWith(PNG, "memory-chess-progress.png");
    expect(status()).toHaveTextContent("Image downloaded.");
    expect(events()).toEqual([{ name: "lab_dashboard_share", params: { method: "download" } }]);
  });

  it("copies the PNG to the clipboard as an image", async () => {
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    await press("Copy image");

    const [[[item]]] = jest.mocked(navigator.clipboard.write).mock.calls as unknown as [[[FakeClipboardItem]]];
    expect(item.items).toEqual({ "image/png": PNG });
    expect(status()).toHaveTextContent("Image copied. Paste it into your post.");
    expect(events()).toEqual([{ name: "lab_dashboard_share", params: { method: "copy_image" } }]);
  });

  it("explains a refused image copy", async () => {
    jest.mocked(navigator.clipboard.write).mockImplementation(() => Promise.reject(new DOMException("no", "NotAllowedError")));
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    await press("Copy image");

    expect(status()).toHaveTextContent("This browser would not copy the image. Download it instead.");
    expect(events()).toEqual([]);
  });

  it("hides Copy image where the clipboard cannot hold images", async () => {
    Object.assign(window, { ClipboardItem: undefined });
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    expect(within(dialog()).queryByRole("button", { name: "Copy image" })).toBeNull();
  });

  it("copies the caption with its link, and counts it only when the clipboard took it", async () => {
    jest.mocked(navigator.clipboard.writeText).mockImplementationOnce(() => Promise.reject(new DOMException("no", "NotAllowedError")));
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();
    expect(within(dialog()).getByText(`${CAPTION} ${URL_TAGGED}`)).toBeInTheDocument();

    await press("Copy caption");
    expect(status()).toHaveTextContent("Copy did not work here. The caption is selected, so copy it yourself.");
    expect(events()).toEqual([]);

    await press("Copy caption");
    expect(navigator.clipboard.writeText).toHaveBeenLastCalledWith(`${CAPTION} ${URL_TAGGED}`);
    expect(status()).toHaveTextContent("Caption copied.");
    expect(events()).toEqual([{ name: "lab_dashboard_share", params: { method: "copy" } }]);
  });

  it("opens each network's post page in a new tab from a button, carry the card's own link, says the preview shows the card, and counts the network", async () => {
    const openWindow = jest.spyOn(window, "open").mockReturnValue(null);
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();
    const x = within(dialog()).getByRole("button", { name: "X (opens in a new tab)" });

    expect(within(dialog()).getAllByRole("button", { name: /\(opens in a new tab\)$/ })).toHaveLength(7);
    expect(within(dialog()).queryAllByRole("link")).toHaveLength(0);
    expect(within(dialog()).getByText(/show the card in the link preview/)).toBeInTheDocument();

    await act(async () => fireEvent.click(x));
    expect(openWindow).toHaveBeenCalledWith(
      `https://x.com/intent/post?text=${encodeURIComponent(CAPTION)}&url=${encodeURIComponent(URL_TAGGED)}`,
      "_blank",
      "noopener,noreferrer",
    );
    expect(status()).toHaveTextContent("X opened in a new tab. Your card shows in the link preview.");
    expect(events()).toEqual([{ name: "lab_dashboard_share", params: { method: "post", network: "x" } }]);
    openWindow.mockRestore();
  });

  it("keeps the caption and links when the card cannot be drawn", async () => {
    jest.mocked(drawShareCard).mockRejectedValue(new Error("no canvas"));
    renderWithIntl(<DashboardShare card={CARD} />);
    await openDialog();

    expect(within(dialog()).queryByRole("img")).toBeNull();
    expect(within(dialog()).getByText("The card could not be made here. Copy the caption below instead.")).toBeInTheDocument();
    expect(within(dialog()).queryByRole("button", { name: "Download image" })).toBeNull();
    expect(within(dialog()).getByRole("button", { name: "Copy caption" })).toBeInTheDocument();
  });
});
