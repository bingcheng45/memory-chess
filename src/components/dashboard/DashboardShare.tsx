"use client";

import { useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DASHBOARD_PLAY_HREF, type ShareCard, type ShareFigure } from "@/lib/lab/dashboard";
import { fontsOf, SITE } from "@/components/share/cardCanvas";
import { ShareDialog } from "@/components/share/ShareDialog";
import { useCardImage, type CardImage } from "@/components/share/useCardImage";
import { useContextText, useFigureText } from "./figureText";
import { shareAlt, shareCaption } from "./shareCaption";
import { drawShareCard, type CardCopy, type CardFigure } from "./shareImage";

const FILE_NAME = "memory-chess-progress.png";

/** The card's shape before there is a card: a figure large and a grid under it, so the panel shows what it will hold. */
function Sketch() {
  return (
    <span className="lab-share-sketch" aria-hidden="true">
      <span data-part="lead" />
      {Array.from({ length: 6 }, (_, index) => (
        <span key={index} data-part="cell" />
      ))}
    </span>
  );
}

function Thumb({ image, onOpen }: { image: CardImage; onOpen: () => void }) {
  // A pointer shortcut to the dialog the Share button opens; the button is the control keyboards and readers use.
  return (
    <button type="button" className="lab-share-thumb" data-state={image.state} tabIndex={-1} aria-hidden="true" onClick={onOpen}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL drawn in this tab, which next/image cannot load */}
      {image.state === "ready" ? <img src={image.src} alt="" width={1080} height={1350} /> : <Sketch />}
    </button>
  );
}

function useCardCopy(card: ShareCard | null): CardCopy | null {
  const t = useTranslations("dashboard");
  const figureText = useFigureText();
  const contextText = useContextText();
  const format = useFormatter();
  if (!card) return null;
  const printed = ({ id, figure, context, trend }: ShareFigure): CardFigure => ({
    label: t(`label.${id}`),
    segments: figureText.segments(figure),
    note: contextText(context),
    ...(trend && trend.direction !== "level" && { trend: { direction: trend.direction, text: format.number(trend.amount) } }),
  });
  const [lead, ...grid] = card.figures.map(printed);
  return { kicker: t("share.card.kicker"), lead, grid, cta: t("share.card.cta"), site: SITE };
}

/**
 * The card as it will post, drawn as soon as the record is read, with the action that opens every way to post it.
 * `pending` holds the panel's place before the record is read, so nothing under it moves when the card arrives.
 */
export function DashboardShare({ card }: { card: ShareCard | null | "pending" }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const root = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const ready = card === "pending" ? null : card;
  const copy = useCardCopy(ready);
  const image = useCardImage(
    () => (copy ? drawShareCard(copy, fontsOf(root.current ?? document.body), locale) : Promise.reject(new Error("No card to draw"))),
    copy && `${locale}:${JSON.stringify(copy)}`,
  );

  if (card === null) {
    return (
      <div className="lab-share" data-state="locked">
        <span className="lab-share-thumb" data-state="locked">
          <Sketch />
        </span>
        <p className="lab-share-text">{t("share.locked")}</p>
        <Link className="lab-btn lab-btn-primary" href={DASHBOARD_PLAY_HREF}>
          {t("play")}
        </Link>
      </div>
    );
  }

  return (
    <div className="lab-share" ref={root} data-state={ready ? "ready" : "pending"}>
      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Thumb image={ready ? image : { state: "rendering" }} onOpen={() => ready && setOpen(true)} />
        <p className="lab-share-text">{t("share.lede")}</p>
        <Dialog.Trigger className="lab-btn lab-btn-primary" disabled={!ready}>
          {t("share.button")}
        </Dialog.Trigger>
        {open && ready && (
          <ShareDialog
            surface="dashboard"
            title={t("share.title")}
            caption={shareCaption(t, ready, locale)}
            image={image}
            alt={shareAlt(t, ready, locale)}
            fileName={FILE_NAME}
          />
        )}
      </Dialog.Root>
    </div>
  );
}
