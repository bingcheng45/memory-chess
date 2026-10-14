import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { pickActiveRelease, ReleaseIndex, type ReleaseIndexItem } from "@/components/changelog/ReleaseIndex";

const ITEMS: readonly ReleaseIndexItem[] = [
  { id: "v1-2-0", version: "1.2.0", title: "Newest", date: "October 5, 2026", dateTime: "2026-10-05" },
  { id: "v1-1-0", version: "1.1.0", title: "Middle", date: "August 16, 2026", dateTime: "2026-08-16" },
  { id: "v1-0-0", version: "1.0.0", title: "Oldest", date: "July 1, 2026", dateTime: "2026-07-01" },
];

const READING = { line: 88, atEnd: false, hashId: "", viewportHeight: 800 };

describe("pickActiveRelease", () => {
  const positions = [
    { id: "a", top: -900 },
    { id: "b", top: 60 },
    { id: "c", top: 500 },
  ];

  it("picks the last release whose top has reached the reading line", () => {
    expect(pickActiveRelease(positions, READING)).toBe("b");
  });

  it("picks the first release before any has reached the line", () => {
    expect(pickActiveRelease([{ id: "a", top: 300 }, { id: "b", top: 900 }], READING)).toBe("a");
  });

  it("at the end of the page picks the release named in the URL while it is on screen", () => {
    expect(pickActiveRelease(positions, { ...READING, atEnd: true, hashId: "b" })).toBe("b");
  });

  it("at the end of the page picks the last release when the named one is off screen or none is named", () => {
    expect(pickActiveRelease(positions, { ...READING, atEnd: true, hashId: "a" })).toBe("c");
    expect(pickActiveRelease(positions, { ...READING, atEnd: true })).toBe("c");
  });

  it("has no active release when there are none", () => {
    expect(pickActiveRelease([], READING)).toBeUndefined();
  });
});

describe("ReleaseIndex", () => {
  const tops: Record<string, number> = {};

  beforeEach(() => {
    document.documentElement.style.scrollPaddingTop = "80px";
    Object.defineProperty(document.documentElement, "scrollHeight", { configurable: true, value: 10_000 });
  });

  function renderWithReleases() {
    return render(
      <>
        <ReleaseIndex items={ITEMS} label="Releases" jumpLabel="Jump to a release" countLabel="3 releases" />
        {ITEMS.map((item) => (
          <article
            key={item.id}
            id={item.id}
            ref={(element) => {
              if (element) element.getBoundingClientRect = () => ({ top: tops[item.id] }) as DOMRect;
            }}
          />
        ))}
      </>,
    );
  }

  const currentLink = () =>
    within(screen.getByRole("navigation", { name: "Releases" }))
      .getAllByRole("link")
      .filter((link) => link.getAttribute("aria-current") === "true")
      .map((link) => link.getAttribute("href"));

  it("marks the release being read as current, and moves the mark as the page scrolls", async () => {
    Object.assign(tops, { "v1-2-0": 300, "v1-1-0": 1400, "v1-0-0": 2600 });
    renderWithReleases();
    await waitFor(() => expect(currentLink()).toEqual(["#v1-2-0"]));

    Object.assign(tops, { "v1-2-0": -1100, "v1-1-0": 0, "v1-0-0": 1200 });
    act(() => {
      fireEvent.scroll(window);
    });
    await waitFor(() => expect(currentLink()).toEqual(["#v1-1-0"]));
  });

  it("opens and closes the list from the jump button", () => {
    Object.assign(tops, { "v1-2-0": 300, "v1-1-0": 1400, "v1-0-0": 2600 });
    renderWithReleases();
    const button = screen.getByRole("button", { name: "Jump to a release 3 releases" });

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("navigation", { name: "Releases" })).toHaveAttribute("data-open", "");

    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("navigation", { name: "Releases" })).not.toHaveAttribute("data-open");
  });
});
