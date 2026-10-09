import { LAB_METRICS } from "@/lib/lab/metrics";
import { readingCardOf } from "@/lib/lab/readingCard";
import { personaRounds, PERSONA_TODAY, type PersonaName } from "@/lib/lab/personas";
import { EMPTY_SUMMARY, summarize } from "@/lib/lab/summary";

function cardFor(name: PersonaName, today = PERSONA_TODAY) {
  const records = personaRounds(name, PERSONA_TODAY);
  const input = { records, summary: records.length ? summarize(records) : EMPTY_SUMMARY, today, plan: null, target: null };
  return readingCardOf({
    span: LAB_METRICS.span.compute(input),
    piecesHeld: LAB_METRICS.piecesHeld.compute(input),
    speed: LAB_METRICS.speed.compute(input),
  });
}

describe("readingCardOf", () => {
  it("reads the span, pieces held and speed with the rounds behind each", () => {
    expect(cardFor("spanClimber")).toEqual({
      span: { pieceCount: 14, rounds: 19 },
      held: { average: 13.8, rounds: 135 },
      speed: { secondsPerPiece: 1.6, setting: { source: "game", pieceCount: 14, memorizeSeconds: 10 }, rounds: 21 },
    });
  });

  it("rounds the averages to the one decimal the panels show", () => {
    expect(cardFor("threeDays")).toEqual({
      span: { pieceCount: 6, rounds: 11 },
      held: { average: 5.2, rounds: 12 },
      speed: { secondsPerPiece: 4.6, setting: { source: "game", pieceCount: 6, memorizeSeconds: 10 }, rounds: 9 },
    });
  });

  it("leaves out pieces held and speed while they are still warming", () => {
    const warming = { readiness: { state: "warming" as const, sampleSize: 4, need: { rounds: 1 } }, value: null };
    const records = personaRounds("threeDays", PERSONA_TODAY);
    const input = { records, summary: summarize(records), today: PERSONA_TODAY };

    expect(readingCardOf({ span: LAB_METRICS.span.compute(input), piecesHeld: warming, speed: warming })).toEqual({
      span: { pieceCount: 6, rounds: 11 },
      held: null,
      speed: null,
    });
  });

  it("offers no card for a visitor, a warming span or a span left stale", () => {
    expect(cardFor("newVisitor", "")).toBeNull();
    expect(cardFor("twoRounds")).toBeNull();
    expect(cardFor("easyOnly")).toBeNull();
    expect(cardFor("stale")).toBeNull();
    expect(cardFor("thirtyDays", "2026-11-08")).toBeNull();
  });
});
