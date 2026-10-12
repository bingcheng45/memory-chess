"use client";

import { useEffect, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DASHBOARD_PLAY_HREF, type ShareCard } from "@/lib/lab/dashboard";
import { useFigureText } from "./figureText";
import { figureList, shareCaption } from "./shareCaption";
import { drawShareCard, type CardFonts } from "./shareImage";
import { ShareDialog, type CardImage } from "./ShareDialog";

const SITE = "thememorychess.com";

/** The card prints in Lab Paper's interface face, the one the page's headings and figures use. */
function fontsOf(element: HTMLElement): CardFonts {
  const style = getComputedStyle(element);
  return { sans: style.getPropertyValue("--lp-ui").trim() || style.fontFamily };
}

/** Draws the card each time the dialog opens; a draw that finishes after a newer one started is dropped. */
function useCardImage(draw: () => Promise<Blob>) {
  const [image, setImage] = useState<CardImage>({ state: "rendering" });
  const latest = useRef(0);
  const src = image.state === "ready" ? image.src : null;

  useEffect(() => () => {
    if (src) URL.revokeObjectURL(src);
  }, [src]);

  const render = async () => {
    const run = ++latest.current;
    setImage({ state: "rendering" });
    const blob = await draw().catch(() => null);
    if (run !== latest.current) return;
    setImage(blob ? { state: "ready", blob, src: URL.createObjectURL(blob) } : { state: "failed" });
  };

  return { image, render };
}

/** The panel's one action opens the dialog that previews the card and holds every way to post it. */
export function DashboardShare({ card }: { card: ShareCard | null }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const figureText = useFigureText();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const { image, render } = useCardImage(() => {
    if (!card) return Promise.reject(new Error("No card to draw"));
    const copy = {
      kicker: t("share.card.kicker"),
      figures: card.figures.map(({ id, figure }) => ({ label: t(`label.${id}`), segments: figureText.segments(figure) })),
      rounds: t("share.card.rounds", { count: card.rounds }),
      cta: t("share.card.cta"),
      site: SITE,
    };
    return drawShareCard(copy, fontsOf(root.current ?? document.body));
  });

  if (!card) {
    return (
      <div className="lab-share" data-locked="">
        <p className="lab-share-text">{t("share.locked")}</p>
        <Link className="lab-btn lab-btn-primary" href={DASHBOARD_PLAY_HREF}>
          {t("play")}
        </Link>
      </div>
    );
  }

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) void render();
  };
  const alt = t("share.alt", { figures: figureList(t, card, locale), rounds: t("share.card.rounds", { count: card.rounds }) });

  return (
    <div className="lab-share" ref={root}>
      <p className="lab-share-text">{t("share.lede")}</p>
      <Dialog.Root open={open} onOpenChange={changeOpen}>
        <Dialog.Trigger className="lab-btn lab-btn-primary">{t("share.button")}</Dialog.Trigger>
        {open && <ShareDialog caption={shareCaption(t, card, locale)} image={image} alt={alt} />}
      </Dialog.Root>
    </div>
  );
}
