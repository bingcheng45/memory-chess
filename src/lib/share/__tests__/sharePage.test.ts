import { sharePageMetadata, sharePageOf } from "@/lib/share/sharePage";

const RESULT = "1_g_4_100_84_383_1214_d14_3_4k3-8-8-3q4-8-8-4P3-4K3_4k3-8-8-8-8-8-8-R3K3";
const PROGRESS = "1_s8_r1214u23_h64";
const TITLE = "I recalled 2 of 4 pieces (50%) on Memory Chess. Can you beat it?";
const DESCRIPTION = "Study a chess position for a few seconds, rebuild it from memory, and get your score. Free, no sign-up.";

describe("sharePageOf", () => {
  it("reads a result card's page from its code: the score as the title, the posted caption, and its own preview image", () => {
    expect(sharePageOf("result", RESULT)).toEqual({
      kicker: "Shared result",
      title: "50% on a Memory Chess board",
      caption: TITLE,
      image: `https://thememorychess.com/api/share/result/${RESULT}`,
      alt: expect.stringMatching(/^Memory Chess result card: Round result, Accuracy 50%, 2 of 4 pieces, .*Rating 1,214 \(-14\), Win streak 3 rounds in a row\.$/),
    });
  });

  it("reads a progress card's page in English, whatever language it was shared from", () => {
    expect(sharePageOf("progress", PROGRESS)).toMatchObject({
      caption: "My Memory Chess progress: memory span 8 pieces, skill rating 1,214, 6.4 pieces held. Can you beat it?",
      image: `https://thememorychess.com/api/share/progress/${PROGRESS}`,
      alt: "Memory Chess progress card: memory span 8 pieces, skill rating 1,214, 6.4 pieces held.",
    });
  });

  it.each([
    ["an unknown kind", "trophy", PROGRESS],
    ["a progress code on the result page", "result", PROGRESS],
    ["a forged code", "progress", "1_b250"],
  ])("finds no page for %s", (_, kind, code) => {
    expect(sharePageOf(kind, code)).toBeNull();
  });
});

describe("sharePageMetadata", () => {
  it("previews the card as a large image at an absolute URL, keeps the page out of search, and drops the share tags from its canonical", () => {
    const page = sharePageOf("result", RESULT);
    if (!page) throw new Error("no page");
    const image = { url: `https://thememorychess.com/api/share/result/${RESULT}`, width: 1200, height: 630, type: "image/png", alt: page.alt };

    expect(sharePageMetadata("result", RESULT, page)).toEqual({
      title: { absolute: TITLE },
      description: DESCRIPTION,
      alternates: { canonical: `https://thememorychess.com/share/result/${RESULT}` },
      robots: { index: false, follow: true, googleBot: { index: false, follow: true } },
      openGraph: { type: "website", siteName: "Memory Chess", title: TITLE, description: DESCRIPTION, url: `https://thememorychess.com/share/result/${RESULT}`, images: [image] },
      twitter: { card: "summary_large_image", site: "@TheMemoryChess", title: TITLE, description: DESCRIPTION, images: [image] },
    });
  });
});
