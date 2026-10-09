import { act, fireEvent, renderWithIntl, screen } from "@/test-utils/intl";
import { LabRecordSection } from "@/components/home/LabRecordSection";
import { INSTALL_NUDGE_KEY } from "@/lib/lab/installNudge";
import { persona } from "@/test-utils/labPersona";
import { PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";

jest.mock("@/lib/analytics/events", () => ({ trackEvent: jest.fn() }));

const SPAN_CLIMBER_CARD = [
  "My Memory Chess reading",
  "Memory span: 14 pieces, 80% or better in 19 rounds",
  "Pieces held: recent average 13.8, from 135 rounds",
  "Speed: recent average 1.6 s per piece in games at 14 pieces, 10 s, from 21 rounds",
  "thememorychess.com",
].join("\n");

const NUDGE = "Your record lives in this browser";
const sightings: IntersectionObserverCallback[] = [];
const seeEverything = () => act(() => sightings.forEach((callback) => callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver)));
const show = (name: PersonaName, today?: string) => renderWithIntl(<LabRecordSection record={persona(name, today)} />);

beforeEach(() => {
  sightings.length = 0;
  window.IntersectionObserver = jest.fn((callback: IntersectionObserverCallback) => {
    sightings.push(callback);
    return { observe: jest.fn(), disconnect: jest.fn(), unobserve: jest.fn() };
  }) as unknown as typeof IntersectionObserver;
  window.localStorage.clear();
});

describe("the reading card", () => {
  it("holds the ready span, pieces held and speed, each with its rounds", () => {
    show("spanClimber");

    fireEvent.click(screen.getByText("Share my reading"));

    expect(document.querySelector(".lab-reading-card-text")?.textContent).toBe(SPAN_CLIMBER_CARD);
  });

  it("copies exactly the card shown, and only on a press", async () => {
    const writeText = jest.fn(() => Promise.resolve());
    Object.assign(navigator, { clipboard: { writeText } });
    show("spanClimber");
    expect(writeText).not.toHaveBeenCalled();

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy my reading" })));

    expect(writeText.mock.calls).toEqual([[SPAN_CLIMBER_CARD]]);
    expect(screen.getByText("Copied. Paste it anywhere.")).toHaveAttribute("role", "status");
  });

  it("selects the card to copy by hand where the clipboard is refused", async () => {
    Object.assign(navigator, { clipboard: { writeText: () => Promise.reject(new Error("denied")) } });
    show("spanClimber");

    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Copy my reading" })));

    expect(screen.getByText("Copy did not work here. The reading is selected above, so copy it yourself.")).toBeInTheDocument();
    expect(window.getSelection()?.toString()).toBe(SPAN_CLIMBER_CARD);
  });

  it("sits below the import notice, which stays the tools row's first status line", () => {
    show("spanClimber");

    expect([...document.querySelectorAll('.lab-tools [role="status"]')].map((node) => node.className)).toEqual(["lab-note", "lab-note lab-reading-card-copied"]);
  });

  it.each<[PersonaName, string]>([["newVisitor", ""], ["twoRounds", PERSONA_TODAY], ["stale", PERSONA_TODAY], ["thirtyDays", "2026-11-08"]])(
    "is not offered to %s, whose span is a sample, warming or stale",
    (name, today) => {
      show(name, today);

      expect(screen.queryByText("Share my reading")).toBeNull();
    },
  );
});

describe("the note that the record lives in this browser", () => {
  it("shows once to a player back on a second day, and stays dismissed", () => {
    const first = show("threeDays");
    expect(screen.getByText(NUDGE)).toBeInTheDocument();
    expect(
      screen.getByText(
        "Clearing browser data deletes it. Bookmark this site so you come back to the same browser, and use Download my lab record above to keep a copy.",
      ),
    ).toBeInTheDocument();

    seeEverything();
    expect(window.localStorage.getItem(INSTALL_NUDGE_KEY)).toMatch(/^\d+$/);
    fireEvent.click(screen.getByRole("button", { name: "Dismiss" }));
    expect(screen.queryByText(NUDGE)).toBeNull();
    first.unmount();

    show("threeDays");
    expect(screen.queryByText(NUDGE)).toBeNull();
  });

  it("does not come back on the next visit even when it was never dismissed", () => {
    const first = show("threeDays");
    seeEverything();
    expect(screen.getByText(NUDGE)).toBeInTheDocument();
    first.unmount();

    show("threeDays");
    expect(screen.queryByText(NUDGE)).toBeNull();
  });

  it("is not shown in a Home Screen app, which keeps its own record", () => {
    Object.defineProperty(navigator, "standalone", { value: true, configurable: true });
    show("threeDays");
    expect(screen.queryByText(NUDGE)).toBeNull();
    Reflect.deleteProperty(navigator, "standalone");
  });

  it("is not shown before a second day of play", () => {
    show("twoRounds");
    expect(screen.queryByText(NUDGE)).toBeNull();
  });
});
