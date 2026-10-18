/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import GameConfig from "@/components/game/GameConfig";
import messages from "../../../../messages/en.json";

it("serves the rating preview's labels with placeholders, and no downside until the browser shows the rating is not provisional", () => {
  const html = renderToString(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GameConfig />
    </NextIntlClientProvider>,
  );
  const preview = html.match(/<section class="lab-config-preview".*?<\/section>/)?.[0] ?? "";

  expect(preview).toContain('data-rating-preview="pending"');
  expect(preview.replace(/<[^>]+>/g, "|").split("|").filter(Boolean)).toEqual([
    "Board rating",
    "—",
    "Your rating",
    "—",
    "Expected accuracy",
    "—",
    "Suggested board",
    "—",
    "If you clear it",
    "—",
  ]);
});
