"use client";

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackEvent, type ShareMethod } from "@/lib/analytics/events";
import { DASHBOARD_PLAY_HREF, type ShareCard } from "@/lib/lab/dashboard";
import { saveBlob } from "@/lib/saveBlob";
import { useCopyText } from "@/components/home/useCopyText";
import { useFigureText } from "./figureText";
import { captionWithLink, shareCaption } from "./shareCaption";
import { drawShareCard, type CardFonts } from "./shareImage";

const FILE_NAME = "memory-chess-progress.png";
const SITE = "thememorychess.com";

type ShareState = "idle" | "working" | "shared" | "saved" | "failed";

const track = (method: ShareMethod) => trackEvent({ name: "lab_dashboard_share", params: { method } });

function fontsOf(element: HTMLElement): CardFonts {
  const mono = getComputedStyle(document.body).getPropertyValue("--font-geist-mono").trim();
  return { sans: getComputedStyle(element).fontFamily, mono: mono || "ui-monospace, monospace" };
}

const isCancel = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

/** The share sheet takes the card and caption where it can take files; elsewhere the card is saved and the caption copied. */
export function DashboardShare({ card }: { card: ShareCard | null }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const figureText = useFigureText();
  const root = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<ShareState>("idle");
  const caption = card && shareCaption(t, card, locale);
  const { state: copied, copy, textRef } = useCopyText(caption ? captionWithLink(caption) : "");

  if (!card || !caption) {
    return (
      <div className="lab-share">
        <p className="lab-panel-desc">{t("share.locked")}</p>
        <Link className="lab-btn lab-btn-primary" href={DASHBOARD_PLAY_HREF}>
          <span className="lab-dot" aria-hidden="true" />
          {t("play")}
        </Link>
      </div>
    );
  }

  const makeCard = async () => {
    const copyOfCard = {
      kicker: t("share.card.kicker"),
      figures: card.figures.map(({ id, figure }) => ({ label: t(`label.${id}`), segments: figureText.segments(figure) })),
      rounds: t("share.card.rounds", { count: card.rounds }),
      cta: t("share.card.cta"),
      site: SITE,
    };
    try {
      return await drawShareCard(copyOfCard, fontsOf(root.current ?? document.body));
    } catch {
      return null;
    }
  };

  const share = async () => {
    setState("working");
    const blob = await makeCard();
    const file = blob && new File([blob], FILE_NAME, { type: "image/png" });
    if (file && navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], text: caption.text, url: caption.url });
        track("native");
        setState("shared");
        return;
      } catch (error) {
        // A sheet that refuses the file, as headless and some desktop browsers do, falls through to saving it.
        if (isCancel(error)) {
          setState("idle");
          return;
        }
      }
    }
    if (blob) {
      saveBlob(blob, FILE_NAME);
      track("download");
    }
    await copy();
    setState(blob ? "saved" : "failed");
  };

  const copyCaption = async () => {
    if (await copy()) track("copy");
  };

  const status = {
    idle: copied === "idle" ? "" : t(copied === "copied" ? "share.copied" : "share.copyFailed"),
    working: t("share.working"),
    shared: t("share.shared"),
    saved: t(copied === "copied" ? "share.saved" : "share.savedNoCopy"),
    failed: t("share.failed"),
  }[state];

  return (
    <div className="lab-share" ref={root}>
      <div className="lab-cta-row">
        <button type="button" className="lab-btn lab-btn-primary" onClick={() => void share()} disabled={state === "working"}>
          <span className="lab-dot" aria-hidden="true" />
          {t("share.button")}
        </button>
        <button type="button" className="lab-btn lab-btn-secondary" onClick={() => void copyCaption()}>
          {t("share.copy")}
        </button>
      </div>
      <p className="lab-note lab-share-status" role="status">
        {status}
      </p>
      <figure className="lab-share-caption">
        <figcaption className="lab-k">{t("share.caption")}</figcaption>
        <pre ref={textRef}>{captionWithLink(caption)}</pre>
      </figure>
    </div>
  );
}
