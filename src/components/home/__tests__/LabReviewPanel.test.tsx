import type { ReactNode } from "react";
import { render, screen } from "@/test-utils/intl";
import { ReviewPanel } from "@/components/home/LabReviewPanel";
import { computeCurve } from "@/lib/lab/curve";
import type { RoundRecord } from "@/lib/lab/record";
import { summarize } from "@/lib/lab/summary";
import { reviewedBoard, seenBoard } from "@/lib/lab/__tests__/fixtures";
import { PERSONA_TODAY, personaRounds } from "@/lib/lab/personas";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children, className }: { href: string; children: ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const BOARDS = ["4k3/8/8/8/Q6p/8/8/4K3", "4k3/8/8/8/1R4p1/8/8/4K3", "4k3/8/8/8/2B2p2/8/8/4K3"];
const KINGS = "4k3/8/8/8/8/8/8/4K3";
const TODAY = "2026-10-09";

function panel(records: readonly RoundRecord[], today = TODAY) {
  const result = computeCurve({ records, summary: summarize(records), today: today || TODAY });
  return render(<ReviewPanel result={result} records={records} today={today} daysAgo={0} />);
}

const playLink = () => screen.queryByRole("link", { name: "Play a review →" });

afterEach(() => window.localStorage.clear());

describe("the review and forgetting curve panel", () => {
  it("shows the illustrative model and no queue until the record is read", () => {
    panel([], "");

    expect(screen.getByRole("heading", { name: "Short, spaced reviews beat one long session." })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /^Illustrative chart: retention falls quickly/ })).toBeInTheDocument();
    expect(screen.getByText("Illustrative")).toBeInTheDocument();
    expect(screen.queryByText(/Review \d of|Next review|No boards to review/)).toBeNull();
    expect(playLink()).toBeNull();
  });

  it("numbers the next review against the five a day and links to it at its own setting", () => {
    panel([seenBoard("a", "2026-10-08", BOARDS[0], KINGS)]);

    expect(screen.getByRole("status")).toHaveTextContent("Review 1 of 5 today");
    expect(playLink()).toHaveAttribute("href", "/game?pieceCount=4&memorizeTime=10&source=review");
  });

  it("counts the reviews played today into the number, without naming how many boards wait", () => {
    const firsts = BOARDS.map((fen, index) => seenBoard(`b${index}`, "2026-10-07", fen, KINGS));
    panel([...firsts, reviewedBoard("r0", TODAY, firsts[0], 2), reviewedBoard("r1", TODAY, firsts[1], 2)]);

    expect(screen.getByRole("status")).toHaveTextContent("Review 3 of 5 today");
    expect(screen.queryByText(/overdue|due for review/)).toBeNull();
  });

  it("offers a month of missed boards one review at a time, never naming the pile", () => {
    panel(personaRounds("thirtyDays"), PERSONA_TODAY);

    expect(screen.getByRole("status")).toHaveTextContent(/^Review 1 of 5 today$/);
    expect(playLink()).not.toBeNull();
  });

  it("says today's reviews are done once five boards were reviewed or opened today, with no link", () => {
    const firsts = BOARDS.map((fen, index) => seenBoard(`b${index}`, "2026-10-07", fen, KINGS));
    window.localStorage.setItem(
      "memory-chess-lab-review-opened",
      JSON.stringify(["x1", "x2"].map((reviewOf) => ({ reviewOf, step: 0, day: TODAY }))),
    );
    panel([...firsts, ...firsts.map((first, index) => reviewedBoard(`r${index}`, TODAY, first, 2))]);

    expect(screen.getByRole("status")).toHaveTextContent("Today's reviews done");
    expect(playLink()).toBeNull();
  });

  it("says when the next review comes once nothing is due today", () => {
    const missed = seenBoard("a", "2026-10-08", BOARDS[0], KINGS);
    panel([missed, reviewedBoard("a1", TODAY, missed, 1)]);

    expect(screen.getByText("Next review in 2 days. 1 board in your queue.")).toBeInTheDocument();
    expect(playLink()).toBeNull();
  });

  it("says how a board gets into the queue when none is in it", () => {
    panel([seenBoard("a", "2026-10-08", BOARDS[0], BOARDS[0])]);

    expect(screen.getByText("No boards to review yet. A board you score under 80% on comes back here the next day.")).toBeInTheDocument();
  });

  it("keeps the model while warming and says how many more reviews draw the first point", () => {
    const missed = seenBoard("a", "2026-10-07", BOARDS[0], KINGS);
    panel([missed, reviewedBoard("a1", "2026-10-08", missed, 1)]);

    expect(screen.getByRole("img", { name: /^Illustrative chart/ })).toBeInTheDocument();
    expect(screen.getByText("2 more reviews after the same gap draw your first measured point.")).toBeInTheDocument();
  });

  it("draws the measured curve with each point's count once one gap has three reviews", () => {
    const firsts = BOARDS.map((fen, index) => seenBoard(`b${index}`, "2026-10-07", fen, KINGS));
    panel([...firsts, ...firsts.map((first, index) => reviewedBoard(`r${index}`, "2026-10-08", first, 1))]);

    expect(
      screen.getByRole("img", { name: "Your recall on boards you reviewed: first sight 50% from 3 boards, after 1 day 100% from 3 reviews." }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("n=3")).toHaveLength(2);
    expect(screen.getByText("From 3 reviews of 3 boards. A point needs 3 reviews after its gap.")).toBeInTheDocument();
    expect(screen.getByText("Your record")).toBeInTheDocument();
  });
});
