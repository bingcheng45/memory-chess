import { playHref, roundSourceParam } from "@/lib/game/roundLink";

describe("round links", () => {
  it("name the origin with from=, never source=, which GA4 reads as the traffic source", () => {
    expect(playHref(6, 10, "home_quick")).toBe("/game?pieceCount=6&memorizeTime=10&from=home_quick");
    expect(playHref(2, 10, "guide_cta", true)).toBe("/game?pieceCount=2&memorizeTime=10&from=guide_cta&mode=blindfold");
  });

  it("read from=, fall back to a legacy source=, and prefer from= when both exist", () => {
    const read = (query: string) => roundSourceParam(new URLSearchParams(query));
    expect([read("from=plan"), read("source=home_quick"), read("source=plan&from=review"), read("pieceCount=6")]).toEqual(["plan", "home_quick", "review", null]);
  });
});
