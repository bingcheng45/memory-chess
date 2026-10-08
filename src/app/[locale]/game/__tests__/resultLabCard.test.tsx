import "fake-indexeddb/auto";
import { deserialize, serialize } from "node:v8";
import { render, screen, within } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import GameLayout from "@/app/[locale]/game/layout";
import GameResult from "@/components/game/GameResult";
import { recordLabRound } from "@/lib/lab/recordRound";
import { useGameStore } from "@/lib/store/gameStore";
import { localeLayoutClientMessages } from "@/test-utils/localeLayoutMessages";

// jsdom has no structuredClone, which fake-indexeddb copies records with.
globalThis.structuredClone ??= (value) => deserialize(serialize(value));

jest.mock("next-intl/server", () => ({
  ...jest.requireActual("next-intl/server"),
  setRequestLocale: jest.fn(),
  getMessages: jest.fn(async ({ locale }: { locale: string }) => jest.requireActual(`../../../../../messages/${locale}.json`)),
}));
jest.mock("@/components/reference/GameReference", () => () => null);
jest.mock("@/lib/leaderboard/cutoffsClient", () => ({ loadLeaderboardCutoffs: jest.fn(async () => null), readCachedCutoffs: () => null }));
jest.mock("@/lib/utils/soundEffects", () => ({ playSound: jest.fn() }));

const TARGET = "4k3/8/8/3q4/8/5N2/8/4K3";

async function renderResultScreen(locale: string) {
  const missing: string[] = [];
  const gameLayout = await GameLayout({
    children: <GameResult onTryAgain={jest.fn()} onNewGame={jest.fn()} onPlay={jest.fn()} />,
    params: Promise.resolve({ locale }),
  });
  render(
    <NextIntlClientProvider locale={locale} messages={await localeLayoutClientMessages(locale)} onError={(error) => missing.push(error.message)}>
      {gameLayout}
    </NextIntlClientProvider>,
  );
  return missing;
}

beforeAll(async () => {
  const facts = { id: "played-now", source: "game", pieceCount: 4, memorizeSeconds: 10, targetFen: TARGET, placedFen: TARGET, memorizeMs: 10000, solveMs: 9000 } as const;
  await recordLabRound(facts);
});

beforeEach(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ data: { value: 1 } }) });
  useGameStore.setState({
    gameState: { ...useGameStore.getState().gameState, pieceCount: 4, memorizeTime: 10, accuracy: 100, correctPlacements: 4, labRoundId: "played-now", originalPosition: TARGET, userPosition: TARGET },
  });
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe("the lab card on the result screen", () => {
  it("reads the round just saved, in English, with every string the layouts send", async () => {
    const missing = await renderResultScreen("en");
    const card = await screen.findByRole("region", { name: "Your lab record" });

    expect(within(card).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["·Day 1, 1 of 5 days this week"]);
    expect(within(card).getByRole("link").getAttribute("href")).toBe("/game?pieceCount=5&memorizeTime=10&source=result_next");
    expect(missing).toEqual([]);
  });

  it("is not drawn, nor its space kept, in a language the lab is not written in", async () => {
    const missing = await renderResultScreen("de");
    await screen.findByRole("region", { name: "Als Nächstes lesen" });

    expect(screen.queryByTestId("result-lab-slot")).toBeNull();
    expect(screen.queryByRole("region", { name: "Your lab record" })).toBeNull();
    expect(missing).toEqual([]);
  });
});
