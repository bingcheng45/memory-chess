import { createTranslator } from "next-intl";
import { shareCaption, type DashboardTranslate } from "@/components/dashboard/shareCaption";
import { captionWithLink } from "@/components/share/shareLink";
import type { ShareCard } from "@/lib/lab/dashboard";
import en from "../../../../messages/en.json";
import de from "../../../../messages/de.json";

const translator = (locale: string, messages: typeof en) => createTranslator({ locale, messages, namespace: "dashboard" }) as unknown as DashboardTranslate;

const FULL: ShareCard = {
  figures: [
    { id: "span", figure: { value: 8, unit: "pieces", digits: 0 } },
    { id: "piecesHeld", figure: { value: 6.4, unit: "pieces", digits: 1 } },
    { id: "speed", figure: { value: 1.9, unit: "secondsPerPiece", digits: 1 } },
    { id: "streak", figure: { value: 12, unit: "days", digits: 0 } },
  ],
  rounds: 140,
};

describe("shareCaption", () => {
  it("lists every ready figure and links the home page with the share tags", () => {
    expect(shareCaption(translator("en", en), FULL, "en")).toEqual({
      text: "My Memory Chess progress: memory span 8 pieces, 6.4 pieces held, 1.9 s per piece, 12 days in a row. Can you beat it?",
      url: "https://thememorychess.com/?utm_source=share&utm_medium=dashboard",
    });
  });

  it("names only the figures on the card, in the player's language and number format, with their own home page", () => {
    const card: ShareCard = { figures: [FULL.figures[1], { id: "streak", figure: { value: 1, unit: "days", digits: 0 } }], rounds: 9 };

    expect(captionWithLink(shareCaption(translator("de", de as typeof en), card, "de"))).toBe(
      "Mein Fortschritt bei Memory Chess: 6,4 gehaltene Figuren, 1 Tag in Folge. Schaffst du das? https://thememorychess.com/de?utm_source=share&utm_medium=dashboard",
    );
  });
});
