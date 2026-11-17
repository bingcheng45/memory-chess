import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import GameLayout from "@/app/[locale]/game/layout";
import GameResult from "@/components/game/GameResult";
import { resetSaveLine } from "@/components/game/ResultSaveLine";
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

jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(async () => null), readCachedCutoffs: () => null }));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));
jest.mock("@/components/home/labDownload", () => ({
  downloadLabRecord: jest.fn(async () => 1),
  lifetimeRounds: jest.fn(async () => 2),
}));

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
  Reflect.deleteProperty(window, "indexedDB");
  resetSaveLine();
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

describe("the save line under the messages the game route sends", () => {
  type Messages = { home: { lab: { record: { tools: Record<string, string> } } }; dashboard: { backup: Record<string, string> } };
  const catalogueOf = (locale: string): Messages => jest.requireActual(`../../../../../messages/${locale}.json`);

  it.each(routing.locales)("prints its buttons and both notices in %s", async (locale) => {
    const { home, dashboard } = catalogueOf(locale);
    Object.defineProperty(window, "indexedDB", { value: {}, configurable: true });
    const history = useGameStore.getState().history;
    useGameStore.setState({ history: [{ id: "round-1" }, { id: "round-2" }] as unknown as typeof history });

    const missing = await renderResultScreen(locale);
    fireEvent.click(await screen.findByRole("button", { name: home.lab.record.tools.backup }));
    expect(screen.getByText(home.lab.record.tools.backupNoted)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: home.lab.record.tools.backup }).previousElementSibling as HTMLElement);
    await waitFor(() => expect(screen.getByText(dashboard.backup.started)).toBeInTheDocument());

    expect(missing).toEqual([]);
  });
});
