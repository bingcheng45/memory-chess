/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { DailyPanel } from "@/components/home/LabDailyPanel";
import messages from "../../../../messages/en.json";

describe("today's board panel server render", () => {
  it("serves the link to play today's board before the client knows the day", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <DailyPanel records={[]} ready={false} />
      </NextIntlClientProvider>,
    );

    expect(html).toContain('<a class="lab-btn lab-btn-secondary lab-daily-play" href="/game?pieceCount=6&amp;memorizeTime=10&amp;source=daily">Play today&#x27;s board<!-- --> →</a>');
    expect(html).not.toContain("Today&#x27;s board has");
  });
});
