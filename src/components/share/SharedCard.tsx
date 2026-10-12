"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { Maximize2, X } from "lucide-react";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { PREVIEW_SIZE } from "@/lib/share/previewSize";

interface SharedCardProps {
  readonly src: string;
  readonly alt: string;
}

/** The card a link was shared with, at the size its column allows; selecting it opens the card at the size of the screen. */
export function SharedCard({ src, alt }: SharedCardProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger className="lab-shared-card-open" aria-label="Open the shared card full size">
        <span className="lab-shared-card-frame">
          {/* eslint-disable-next-line @next/next/no-img-element -- the preview is a drawn PNG served immutable from its own route */}
          <img src={src} alt={alt} {...PREVIEW_SIZE} />
        </span>
        <span className="lab-shared-card-hint" aria-hidden="true">
          <Maximize2 size={16} />
          See it full size
        </span>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="lab-card-viewer-overlay" />
        <Dialog.Content className={`${LAB_PAPER_CLASS} lab-card-viewer`} aria-modal="true" aria-describedby={undefined}>
          <div className="lab-card-viewer-head">
            <Dialog.Title className="lab-card-viewer-title">The shared card</Dialog.Title>
            <Dialog.Close className="lab-card-viewer-close" aria-label="Close">
              <X aria-hidden size={20} />
            </Dialog.Close>
          </div>
          <div className="lab-card-viewer-body">
            {/* eslint-disable-next-line @next/next/no-img-element -- the same immutable PNG, already loaded by the page */}
            <img src={src} alt={alt} {...PREVIEW_SIZE} />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
