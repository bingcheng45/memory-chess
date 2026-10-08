import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import GameLayout from "@/app/[locale]/game/layout";
import GameResult from "@/components/game/GameResult";
import { routing } from "@/i18n/routing";
import { useGameStore } from "@/lib/store/gameStore";
import { localeLayoutClientMessages } from "@/test-utils/localeLayoutMessages";

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  setRequestLocale: jest.fn(),
  getMessages: jest.fn(async ({ locale }: { locale: string }) =>
    jest.requireActual(`../../../../../messages/${locale}.json`),
  ),
}));

jest.mock("@/components/reference/GameReference", () => {
  function MockGameReference() {
    return null;
  }

  return MockGameReference;
});

jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(async () => null) }));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));

const FINISHED_ROUND = {
  isPlaying: false,
  isMemorizationPhase: false,
  isSolutionPhase: false,
  pieceCount: 6,
  memorizeTime: 10,
  actualMemorizeTime: 8.25,
  completionTime: 12.5,
  accuracy: 80,
  correctPlacements: 4,
  originalPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
  userPosition: "8/8/8/8/8/8/8/P7 w - - 0 1",
};
const RAW_MESSAGE_KEY = /\b(articles|game|common|country)\.[a-z]+\.[A-Za-z.]+/;

function tileStringsOf(locale: string): Record<string, string> {
  return jest.requireActual(`../../../../../messages/${locale}.json`).articles.tile;
}

async function renderResultScreen(locale: string) {
  const missing: string[] = [];
  const rootMessages = await localeLayoutClientMessages(locale);
  const gameLayout = await GameLayout({
    children: <GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />,
    params: Promise.resolve({ locale }),
  });

  render(
    <NextIntlClientProvider locale={locale} messages={rootMessages} onError={(error) => missing.push(error.message)}>
      {gameLayout}
    </NextIntlClientProvider>,
  );

  return missing;
}

beforeEach(() => {
  window.sessionStorage.clear();
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(Math, "random").mockReturnValue(0);
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { value: 1 } }) });
  useGameStore.setState({ gameState: { ...useGameStore.getState().gameState, ...FINISHED_ROUND } });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("the result screen under the messages its route's layouts send", () => {
  it.each(routing.locales)("has every message its first render prints, the article tile's included, in %s", async (locale) => {
    const missing = await renderResultScreen(locale);
    const strings = tileStringsOf(locale);

    expect(missing).toEqual([]);
    const tile = screen.getByRole("region", { name: strings.eyebrow });
    expect(tile.textContent).not.toMatch(RAW_MESSAGE_KEY);
    expect(within(tile).getByRole("link", { name: strings.read })).toBeInTheDocument();
    expect(within(tile).getByRole("button", { name: strings.tryDrill })).toBeInTheDocument();
  });

  it("prints the tile in German on the German page", async () => {
    await renderResultScreen("de");
    const tile = screen.getByRole("region", { name: "Als Nächstes lesen" });

    expect(within(tile).getByText("Deine Runde").closest("div")).toHaveTextContent("Deine Runde6 Figuren, 10 Sekunden");
    expect(within(tile).getByRole("link", { name: "Artikel lesen" })).toBeInTheDocument();
    expect(within(tile).getByRole("button", { name: "Diese Übung ausprobieren" })).toBeInTheDocument();
  });
});
