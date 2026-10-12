/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import GameConfig from "@/components/game/GameConfig";
import messages from "../../../../messages/en.json";

it("serves the daily board link with a neutral label and no clock, so the served page carries no date", () => {
  const html = renderToString(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GameConfig />
    </NextIntlClientProvider>,
  );

  expect(html).toMatch(/<a [^>]*data-daily-entry="pending"[^>]*>Today&#x27;s board<\/a>/);
});
