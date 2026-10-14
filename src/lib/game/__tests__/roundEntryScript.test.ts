import { roundEntryScript } from "@/lib/game/roundLink";

const entryAfterScript = (address: string) => {
  window.history.pushState({}, "", address);
  document.documentElement.removeAttribute("data-round-entry");
  new Function(roundEntryScript())();
  return document.documentElement.getAttribute("data-round-entry");
};

afterEach(() => {
  document.documentElement.removeAttribute("data-round-entry");
  window.history.pushState({}, "", "/");
});

describe("the served /game page's round entry mark", () => {
  it("marks a daily link's page before hydration, and no other link's", () => {
    expect(
      ["/game?pieceCount=6&memorizeTime=10&source=daily", "/de/game?memorizeTime=10&source=daily", "/game?pieceCount=6&source=review", "/game?source=daily", "/game"].map(
        entryAfterScript,
      ),
    ).toEqual(["daily", "daily", null, null, null]);
  });
});
