/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import GameConfig from "@/components/game/GameConfig";
import messages from "../../../../messages/en.json";

it("serves the rating summary with placeholders and the details closed, since the rating is only known in the browser", () => {
  const html = renderToString(
    <NextIntlClientProvider locale="en" messages={messages}>
      <GameConfig />
    </NextIntlClientProvider>,
  );
  const preview = html.match(/<section class="lab-config-preview".*?<\/section>/)?.[0] ?? "";

  expect(preview).toContain('data-rating-preview="pending"');
  expect(preview).toContain('aria-expanded="false"');
  expect(preview.replace(/<[^>]+>/g, "|").split("|").filter(Boolean)).toEqual([
    "Medium, 6 pcs / 10s",
    " · ",
    "Board — · expect —%",
    "Rating details",
  ]);
});
