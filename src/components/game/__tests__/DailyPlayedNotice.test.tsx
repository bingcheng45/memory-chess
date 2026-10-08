import type { ReactNode } from "react";
import type { AbstractIntlMessages } from "next-intl";
import { render, screen } from "@/test-utils/intl";
import DailyPlayedNotice from "@/components/game/DailyPlayedNotice";
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

describe("the daily board notice on /game", () => {
  it("reads every string it shows from the messages the game layout sends", () => {
    render(<DailyPlayedNotice onChoose={jest.fn()} />, { messages: gamePageMessages() });

    expect(screen.getByRole("status")).toHaveTextContent(
      "You have already opened today's board. One try per day on this device.Resets in 5 h 12 minOpen your lab record →Play another round",
    );
  });
});
