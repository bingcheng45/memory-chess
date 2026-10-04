import { act, fireEvent, render, screen } from "@testing-library/react";
import TypedBody from "@/components/articles/TypedBody";
import { announceArrival } from "@/components/articles/articleArrival";
import {
  LONGER_THAN_THE_WHOLE_BODY_MS,
  SECTIONS,
  SLUG,
  body,
  expectFullPlainText,
  phase,
  renderBody,
  showAll,
  typeFor,
  withFakeFrames,
} from "@/components/articles/__tests__/typedBodyHarness";

const BLOCK_BOUNDARY_MS = 600;

withFakeFrames();

describe("TypedBody's Show all text button after a click on a card", () => {
  beforeEach(() => {
    announceArrival(SLUG, Promise.resolve());
  });

  it("completes at once on Show all text, and the button goes", async () => {
    renderBody();
    await typeFor(100);

    fireEvent.click(showAll()!);

    expect(phase()).toBe("done");
    expectFullPlainText();
  });

  it("moves focus to the text on a press, even in a browser that does not focus a pressed button", async () => {
    renderBody();
    await typeFor(100);

    fireEvent.click(showAll()!);

    expect(document.activeElement).toBe(body());
  });

  it("moves focus to the text when typing ends on its own while the button holds focus", async () => {
    renderBody();
    await typeFor(100);
    showAll()!.focus();

    await typeFor(BLOCK_BOUNDARY_MS);
    expect(phase()).toBe("typing");
    expect(document.activeElement).toBe(showAll());

    await typeFor(LONGER_THAN_THE_WHOLE_BODY_MS);
    expect(phase()).toBe("done");
    expect(document.activeElement).toBe(body());
  });

  it("moves focus to the text when a hidden tab completes it while the button holds focus", async () => {
    renderBody();
    await typeFor(100);
    showAll()!.focus();

    jest.spyOn(document, "hidden", "get").mockReturnValue(true);
    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(phase()).toBe("done");
    expect(document.activeElement).toBe(body());
  });

  it("leaves focus where the reader put it when typing ends and the button did not hold it", async () => {
    render(
      <>
        <button type="button">Elsewhere</button>
        <TypedBody slug={SLUG} sections={SECTIONS} />
      </>,
    );
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    await typeFor(100);
    elsewhere.focus();

    await typeFor(LONGER_THAN_THE_WHOLE_BODY_MS);

    expect(phase()).toBe("done");
    expect(document.activeElement).toBe(elsewhere);
  });

  it("leaves focus on the page when typing ends and nothing held it", async () => {
    renderBody();
    expect(document.activeElement).toBe(document.body);

    await typeFor(LONGER_THAN_THE_WHOLE_BODY_MS);

    expect(phase()).toBe("done");
    expect(document.activeElement).toBe(document.body);
  });

  it("never takes focus off the button while typing goes on across a block boundary", async () => {
    renderBody();
    await typeFor(100);
    const pill = showAll()!;
    pill.focus();
    const blurred = jest.fn();
    pill.addEventListener("blur", blurred);

    await typeFor(BLOCK_BOUNDARY_MS);

    expect(phase()).toBe("typing");
    expect(showAll()).toBe(pill);
    expect(document.activeElement).toBe(pill);
    expect(blurred).not.toHaveBeenCalled();
  });

  it("offers Show all text as a real button a keyboard can reach", async () => {
    renderBody();
    await typeFor(100);

    expect(showAll()).toHaveAttribute("type", "button");
    expect(showAll()).not.toHaveAttribute("tabindex", "-1");
    expect(showAll()).not.toBeDisabled();
  });
});
