/** @jest-environment node */
import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { IntroShell } from "@/components/home/intro/IntroShell";
import { INTRO_GATE } from "@/lib/home/intro/introGate";
import messages from "../../../../../messages/en.json";

describe("the intro shell server render", () => {
  const html = renderToString(
    <NextIntlClientProvider locale="en" messages={messages} timeZone="UTC">
      <IntroShell />
    </NextIntlClientProvider>,
  );

  it("serves the gate script first, then the layer", () => {
    expect(html.startsWith(`<script>${INTRO_GATE}</script><section class="home-intro" aria-label="The 45-board intro">`)).toBe(true);
  });

  it("paints the first frame without script: the counter, Skip and the first caption", () => {
    expect(html).toContain('<p class="home-intro-counter">1 board</p>');
    expect(html).toContain('<button type="button" class="home-intro-skip">Skip intro</button>');
    expect(html).toContain(
      '<p class="home-intro-caption" data-on="true" aria-hidden="false">One board. <em>You can see it.</em><small>Morphy&#x27;s Opera Game, Paris, 1858. Every move is real.</small></p>',
    );
  });
});
