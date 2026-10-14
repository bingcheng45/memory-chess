import { createTranslator } from "next-intl";
import { shareAlt, shareCaption, type DashboardTranslate } from "@/components/dashboard/shareCaption";
import { captionWithLink } from "@/components/share/shareLink";
import type { Figure, ShareCard, ShareFigure, ShareFigureId } from "@/lib/lab/dashboard";
import en from "../../../../messages/en.json";
import de from "../../../../messages/de.json";

const translator = (locale: string, messages: typeof en) => createTranslator({ locale, messages, namespace: "dashboard" }) as unknown as DashboardTranslate;

const shown = (id: ShareFigureId, value: number, unit: Figure["unit"], digits: 0 | 1 = 0): ShareFigure => ({
  id,
  figure: { value, unit, digits },
  context: { kind: "recent", values: { rounds: 10 } },
});

const FULL: ShareCard = {
  figures: [
    shown("span", 8, "pieces"),
    shown("piecesHeld", 6.4, "pieces", 1),
    shown("bestAccuracy", 0, "percent"),
    shown("speed", 1.9, "secondsPerPiece", 1),
    shown("winStreak", 0, "rounds"),
    shown("streak", 12, "days"),
    shown("rounds", 140, "rounds"),
    shown("days", 45, "days"),
  ],
  rounds: 140,
};

describe("shareCaption", () => {
  it("names the four strongest figures above zero and links the card's own page with the share tags", () => {
    expect(shareCaption(translator("en", en), FULL, "en")).toEqual({
      text: "My Memory Chess progress: memory span 8 pieces, 6.4 pieces held, 1.9 s per piece, 12 days in a row. Can you beat it?",
      url: "https://thememorychess.com/share/progress/1_s8_h64_b0_v19_w0_k12_n140_d45?utm_source=share&utm_medium=dashboard",
    });
  });

  it("names only the figures on the card, in the player's language and number format, with the card's own page", () => {
    const card: ShareCard = { figures: [shown("piecesHeld", 6.4, "pieces", 1), shown("streak", 1, "days"), shown("recentAccuracy", 83, "percent")], rounds: 9 };

    expect(captionWithLink(shareCaption(translator("de", de as typeof en), card, "de"))).toBe(
      "Mein Fortschritt bei Memory Chess: 6,4 gehaltene Figuren, 1 Tag in Folge und 83 % aktuelle Genauigkeit. Schaffst du das? https://thememorychess.com/share/progress/1_h64_k1_a83?utm_source=share&utm_medium=dashboard",
    );
  });
});

describe("shareAlt", () => {
  it("reads out every figure the card prints, zeros included, then the rounds played once", () => {
    expect(shareAlt(translator("en", en), FULL, "en")).toBe(
      "Memory Chess progress card: memory span 8 pieces, 6.4 pieces held, 0% best accuracy, 1.9 s per piece, a win streak of 0 rounds, 12 days in a row, 45 days played. 140 rounds played.",
    );
  });
});
