import type { ReactNode } from "react";
import type { AbstractIntlMessages } from "next-intl";
import { render, screen } from "@/test-utils/intl";
import SetBoardNotice from "@/components/game/SetBoardNotice";
import { splitClientMessages } from "@/lib/articles/messageScope";
import catalogue from "../../../../messages/en.json";
import german from "../../../../messages/de.json";

jest.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => <a href={href}>{children}</a>,
}));

/** What a /game page's client components can read: the root layout's strings with the game layout's groups merged in. */
function gamePageMessages(messages: object = catalogue) {
  const { shared, game } = splitClientMessages(messages as unknown as AbstractIntlMessages);
  return { ...shared, home: { ...(shared.home as object), ...(game.home as object) }, daily: game.daily };
}

beforeEach(() => {
  jest.useFakeTimers();
  jest.setSystemTime(Date.parse("2026-10-09T18:47:30Z"));
});

afterEach(() => jest.useRealTimers());

describe("the set board notice on /game", () => {
  it("reads every string it shows from the messages the game layout sends, announcing only the refusal", () => {
    render(<SetBoardNotice reason="daily" onChoose={jest.fn()} />, { messages: gamePageMessages() });

    expect(screen.getByRole("status")).toHaveTextContent(/^You have already opened today's board\. One try a day keeps it fair\.$/);
    expect(screen.getByText("Next board in 5 h 12 min")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "See today's board" })).toHaveAttribute("href", "/daily");
    expect(screen.getByRole("button", { name: "Play another round" })).toBeInTheDocument();
  });

  it("tells a German player today's board is already opened, in German, from a catalogue without the lab", () => {
    render(<SetBoardNotice reason="daily" onChoose={jest.fn()} />, { locale: "de", messages: gamePageMessages(german) });

    expect(screen.getByRole("status")).toHaveTextContent(/^Du hast das heutige Brett schon geöffnet\./);
    expect(screen.getByText("Nächstes Brett in 5 Std. 12 Min.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Heutiges Brett ansehen" })).toHaveAttribute("href", "/daily");
  });

  it("says no review is due, and when boards come back, from the messages the game layout sends", () => {
    render(<SetBoardNotice reason="review" onChoose={jest.fn()} />, { messages: gamePageMessages() });

    expect(screen.getByRole("status")).toHaveTextContent(/^No board is due for review on this device right now\.$/);
    expect(screen.getByText("Boards you score under 80% on come back 1, 3, 7 and 14 days after you first see them.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open your lab record" })).toHaveAttribute("href", "/#record");
    expect(screen.getByRole("button", { name: "Play another round" })).toBeInTheDocument();
  });

  it("says today's reviews are done when the daily limit is reached, from the messages the game layout sends", () => {
    render(<SetBoardNotice reason="reviewCap" onChoose={jest.fn()} />, { messages: gamePageMessages() });

    expect(screen.getByRole("status")).toHaveTextContent(/^Today's 5 reviews are done on this device\.$/);
    expect(screen.getByText("Any board still due comes back tomorrow, the longest waiting first.")).toBeInTheDocument();
  });
});
