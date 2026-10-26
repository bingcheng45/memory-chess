"use client";

import { lazy, Suspense, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { fontsOf } from "@/components/share/cardCanvas";
import { useCardImage } from "@/components/share/useCardImage";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import { resultCaption, resultCardCopy, type RoundShare } from "./roundShare";

const FILE_NAME = "memory-chess-result.png";

// The dialog and the card's drawing load when a player reaches for the button, so /game pays nothing for them until then.
const loadDialog = () => import("@/components/share/ShareDialog");
const ShareDialog = lazy(() => loadDialog().then(({ ShareDialog: dialog }) => ({ default: dialog })));
const loadDrawing = () => import("./resultImage");
const prefetch = () => {
  void loadDialog().catch(() => undefined);
  void loadDrawing().catch(() => undefined);
};

/** The result screen's Share result icon button and its dialog. The card is drawn the first time the dialog opens, and kept for the round. */
export default function ShareResult({ share }: { share: RoundShare }) {
  const t = useTranslations("game.result.share");
  const locale = useLocale();
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const copy = resultCardCopy(t, share, locale);
  const image = useCardImage(
    () => loadDrawing().then(({ drawResultCard }) => drawResultCard(copy, share.kind === "daily" ? null : share.board, fontsOf(button.current ?? document.body), locale)),
    opened ? locale : null,
  );

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) setOpened(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger ref={button} className="lab-btn lab-btn-secondary lab-result-share" aria-label={t("button")} title={t("button")} onPointerEnter={prefetch} onFocus={prefetch}>
        <Share2 aria-hidden size={20} />
      </Dialog.Trigger>
      {open && (
        // A dialog chunk that will not load leaves the button and the rest of the result screen as they were.
        <ErrorBoundary fallback={null}>
          <Suspense fallback={null}>
            <ShareDialog surface="result" title={t("title")} caption={resultCaption(t, share, locale)} image={image} alt={copy.alt} fileName={FILE_NAME} />
          </Suspense>
        </ErrorBoundary>
      )}
    </Dialog.Root>
  );
}
