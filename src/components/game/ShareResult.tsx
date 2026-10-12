"use client";

import { lazy, Suspense, useRef, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { Share2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { fontsOf } from "@/components/share/cardCanvas";
import { useCardImage } from "@/components/share/useCardImage";
import { resultCaption, resultCardCopy, type RoundShare } from "./roundShare";

const FILE_NAME = "memory-chess-result.png";

// The dialog and the card's drawing load on the first open, so /game pays nothing for them until a player shares.
const ShareDialog = lazy(() => import("@/components/share/ShareDialog").then(({ ShareDialog: dialog }) => ({ default: dialog })));
const drawResultCard = (...args: Parameters<typeof import("./resultImage").drawResultCard>) => import("./resultImage").then(({ drawResultCard: draw }) => draw(...args));

/** The result screen's Share result button and its dialog. The card is drawn the first time the dialog opens, and kept for the round. */
export default function ShareResult({ share, roundKey }: { share: RoundShare; roundKey: string }) {
  const t = useTranslations("game.result.share");
  const locale = useLocale();
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [opened, setOpened] = useState(false);
  const copy = resultCardCopy(t, share, locale);
  const image = useCardImage(() => drawResultCard(copy, share.kind === "daily" ? null : share.board, fontsOf(button.current ?? document.body)), opened ? `${locale}:${roundKey}` : null);

  const changeOpen = (next: boolean) => {
    setOpen(next);
    if (next) setOpened(true);
  };

  return (
    <Dialog.Root open={open} onOpenChange={changeOpen}>
      <Dialog.Trigger ref={button} className="lab-btn lab-btn-secondary lab-result-share">
        <Share2 aria-hidden size={18} />
        {t("button")}
      </Dialog.Trigger>
      {open && (
        <Suspense fallback={null}>
          <ShareDialog surface="result" title={t("title")} caption={resultCaption(t, share, locale)} image={image} alt={copy.alt} fileName={FILE_NAME} />
        </Suspense>
      )}
    </Dialog.Root>
  );
}
