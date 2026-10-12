import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { SharedCard } from "@/components/share/SharedCard";

const SRC = "/api/share/result/1_g_4_100_84_383";
const ALT = "A Memory Chess result card: 50% accuracy, 2 of 4 pieces.";

describe("the shared card on its page", () => {
  it("opens the card full size in a labelled dialog, closes it on Escape and returns focus to the card", async () => {
    render(<SharedCard src={SRC} alt={ALT} />);
    const open = screen.getByRole("button", { name: "Open the shared card full size" });

    await act(async () => fireEvent.click(open));
    const dialog = screen.getByRole("dialog", { name: "The shared card" });
    expect(within(dialog).getByRole("img", { name: ALT }).getAttribute("src")).toBe(SRC);
    expect(document.activeElement).toBe(within(dialog).getByRole("button", { name: "Close" }));

    await act(async () => fireEvent.keyDown(document.activeElement as Element, { key: "Escape" }));
    expect(screen.queryByRole("dialog")).toBeNull();
    await waitFor(() => expect(document.activeElement).toBe(open));
  });

  it("closes from its close button", async () => {
    render(<SharedCard src={SRC} alt={ALT} />);
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Open the shared card full size" })));
    await act(async () => fireEvent.click(screen.getByRole("button", { name: "Close" })));
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});
