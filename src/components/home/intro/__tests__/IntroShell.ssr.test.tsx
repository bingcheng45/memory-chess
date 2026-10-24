/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { IntroShell } from "@/components/home/intro/IntroShell";
import { INTRO_GATE } from "@/lib/home/intro/introGate";
import messages from "../../../../../messages/en.json";

describe("the intro shell server render", () => {
  it("serves the gate script, then the layer with its first caption and Skip", () => {
    const html = renderToString(
      <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
        <IntroShell />
      </NextIntlClientProvider>,
    );

    expect(html).toBe(
      `<script>${INTRO_GATE}</script>` +
        '<section class="home-intro" aria-label="The 45-board intro">' +
        '<p class="home-intro-caption">One board. You can see it.</p>' +
        '<button type="button" class="home-intro-skip">Skip intro</button>' +
        "</section>",
    );
  });
});
