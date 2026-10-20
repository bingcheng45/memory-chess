import { fireEvent, render, screen } from "@/test-utils/intl";
import GameConfig from "@/components/game/GameConfig";

afterEach(() => window.history.pushState({}, "", "/"));

describe("the Blindfold option", () => {
  it("starts a board round while off, and a blindfold round once turned on, keeping the choice in the address", () => {
    window.history.pushState({}, "", "/game");
    const onStart = jest.fn();
    render(<GameConfig onStart={onStart} />);

    const blindfold = screen.getByRole("checkbox", { name: "Blindfold" });
    expect(blindfold).not.toBeChecked();
    expect(blindfold).toHaveAccessibleDescription("Study the position as notation, with no pieces on the board.");
    fireEvent.click(screen.getByRole("button", { name: "Start round" }));
    expect(onStart).toHaveBeenLastCalledWith(6, 10, "game_form");

    fireEvent.click(blindfold);
    expect(window.location.search).toBe("?mode=blindfold");
    fireEvent.click(screen.getByRole("button", { name: "Start round" }));
    expect(onStart).toHaveBeenLastCalledWith(6, 10, "game_form", true);

    fireEvent.click(blindfold);
    expect(window.location.search).toBe("");
  });

  it("is on when the link names the mode", () => {
    window.history.pushState({}, "", "/game?difficulty=easy&mode=blindfold");

    render(<GameConfig onStart={jest.fn()} />);

    expect(screen.getByRole("checkbox", { name: "Blindfold" })).toBeChecked();
    expect(screen.getByLabelText("Number of pieces")).toHaveValue("2");
  });
});
