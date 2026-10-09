import type { ReactNode } from "react";
import type { AbstractIntlMessages } from "next-intl";
import { render, screen } from "@/test-utils/intl";
import SetBoardNotice from "@/components/game/SetBoardNotice";
import { splitClientMessages } from "@/lib/articles/messageScope";
import catalogue from "../../../../messages/en.json";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

/** What a /game page's client components can read: the root layout's strings with the game layout's groups merged in. */
function gamePageMessages() {
  const { shared, game } = splitClientMessages(catalogue as unknown as AbstractIntlMessages);
  return { ...shared, home: { ...(shared.home as object), ...(game.home as object) } };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(Date.parse("2026-10-09T18:47:30Z"));
});

afterEach(() => jest.useRealTimers());

describe("the set board notice on /game", () => {
  it("reads every string it shows from the messages the game layout sends, announcing only the refusal", () => {
    render(<SetBoardNotice reason="daily" onChoose={jest.fn()} />, { messages: gamePageMessages() });

    expect(screen.getByRole("status")).toHaveTextContent(/^You have already opened today's board\. One try per day on this device\.$/);
    expect(screen.getByText("Resets in 5 h 12 min")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open your lab record" })).toHaveAttribute("href", "/#record");
    expect(screen.getByRole("button", { name: "Play another round" })).toBeInTheDocument();
  });

  it("says no review is due, and when boards come back, from the messages the game layout sends", () => {
    render(<SetBoardNotice reason="review" onChoose={jest.fn()} />, { messages: gamePageMessages() });

    expect(screen.getByRole("status")).toHaveTextContent(/^No board is due for review on this device right now\.$/);
    expect(screen.getByText("Boards you score under 80% on come back 1, 3, 7 and 14 days after you first see them.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open your lab record" })).toHaveAttribute("href", "/#record");
    expect(screen.getByRole("button", { name: "Play another round" })).toBeInTheDocument();
  });
});
