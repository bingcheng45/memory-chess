"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { useCopyText } from "@/components/home/useCopyText";
import { SHARE_EVENTS, trackEvent, type ShareParams, type ShareSurface } from "@/lib/analytics/events";
import { saveBlob } from "@/lib/saveBlob";
import { SHARE_NETWORKS, type ShareNetwork, type SharePost } from "@/lib/shareIntents";
import { captionWithLink } from "./shareLink";
import type { CardImage } from "./useCardImage";
import "./share.css";

const isCancel = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

/** The share sheet takes the PNG where it can (mostly phones), and the caption and link where it cannot. */
function shareData(caption: SharePost, blob: Blob | null, fileName: string): ShareData {
  const text = { text: caption.text, url: caption.url };
  const files = blob ? [new File([blob], fileName, { type: "image/png" })] : [];
  return files.length > 0 && navigator.canShare?.({ files }) ? { ...text, files } : text;
}

/** An image on the clipboard needs ClipboardItem with PNG support: Chromium and Safari have it, older Firefox does not. */
function canCopyImage(): boolean {
  if (typeof ClipboardItem !== "function" || typeof navigator.clipboard?.write !== "function") return false;
  const { supports } = ClipboardItem as unknown as { supports?: (type: string) => boolean };
  return supports ? supports("image/png") : true;
}

function Preview({ image, alt }: { image: CardImage; alt: string }) {
  const t = useTranslations("share");
  if (image.state === "failed") {
    return <p className="lab-share-preview" data-state="failed">{t("failed")}</p>;
  }
  return (
    <figure className="lab-share-preview" data-state={image.state} aria-busy={image.state === "rendering"}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL drawn in this tab, which next/image cannot load */}
      {image.state === "ready" ? <img src={image.src} alt={alt} width={1080} height={1350} /> : <span className="lab-sr">{t("working")}</span>}
    </figure>
  );
}

export interface ShareDialogProps {
  /** Which screen opened the dialog, and so which event its shares count under. */
  readonly surface: ShareSurface;
  readonly title: string;
  readonly caption: SharePost;
  readonly image: CardImage;
  readonly alt: string;
  readonly fileName: string;
}

/** The card as it will post, with every way to send it: the share sheet, the file, the clipboard, and each network's post page. */
export function ShareDialog({ surface, title, caption, image, alt, fileName }: ShareDialogProps) {
  const t = useTranslations("share");
  const [status, setStatus] = useState("");
  const { copy, textRef } = useCopyText(captionWithLink(caption));
  const blob = image.state === "ready" ? image.blob : null;
  const pending = image.state === "rendering";
  const hasImage = image.state !== "failed";
  const canShare = typeof navigator.share === "function";
  const copyImage = hasImage && canCopyImage();
  const track = (params: ShareParams) => trackEvent({ name: SHARE_EVENTS[surface], params });

  const runShare = async (data: ShareData) => {
    try {
      await navigator.share(data);
      track({ method: "native" });
      setStatus(t("shared"));
    } catch (error) {
      setStatus(isCancel(error) ? "" : t("shareFailed"));
    }
  };

  const download = (png: Blob) => {
    saveBlob(png, fileName);
    track({ method: "download" });
    setStatus(t("downloaded"));
  };

  const copyPng = async (png: Blob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      track({ method: "copy_image" });
      setStatus(t("imageCopied"));
    } catch {
      setStatus(t("imageCopyFailed"));
    }
  };

  const copyCaption = async () => {
    const copied = await copy();
    if (copied) track({ method: "copy" });
    setStatus(t(copied ? "copied" : "copyFailed"));
  };

  const post = (network: ShareNetwork, name: string) => {
    track({ method: "post", network });
    setStatus(t("opened", { network: name }));
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="lab-share-overlay" />
      <Dialog.Content className={`${LAB_PAPER_CLASS} lab-share-dialog`} aria-modal="true">
        <header className="lab-share-head">
          <div>
            <Dialog.Title className="lab-share-title">{title}</Dialog.Title>
            <Dialog.Description className="lab-share-intro">{t("intro")}</Dialog.Description>
          </div>
          <Dialog.Close className="lab-share-close" aria-label={t("close")}>
            <X aria-hidden size={20} />
          </Dialog.Close>
        </header>
        <div className="lab-share-body">
          <Preview image={image} alt={alt} />
          <div className="lab-share-tools">
            <div>
              <div className="lab-share-actions">
                {canShare && (
                  <button type="button" className="lab-btn lab-btn-primary" disabled={pending} onClick={() => void runShare(shareData(caption, blob, fileName))}>
                    {t("actions.share")}
                  </button>
                )}
                {hasImage && (
                  <button type="button" className={`lab-btn ${canShare ? "lab-btn-secondary" : "lab-btn-primary"}`} disabled={pending} onClick={() => blob && download(blob)}>
                    {t("actions.download")}
                  </button>
                )}
                {copyImage && (
                  <button type="button" className="lab-btn lab-btn-secondary" disabled={pending} onClick={() => blob && void copyPng(blob)}>
                    {t("actions.copyImage")}
                  </button>
                )}
              </div>
              <p className="lab-note lab-share-status" role="status">
                {status}
              </p>
            </div>
            <figure className="lab-share-caption">
              <figcaption className="lab-share-label">{t("caption")}</figcaption>
              <pre ref={textRef}>{captionWithLink(caption)}</pre>
              <button type="button" className="lab-btn lab-btn-secondary" onClick={() => void copyCaption()}>
                {t("copy")}
              </button>
            </figure>
            <section className="lab-share-post" aria-labelledby="lab-share-post-title">
              <h3 id="lab-share-post-title" className="lab-share-label">
                {t("post.title")}
              </h3>
              <p className="lab-share-note">{t("post.note")}</p>
              <ul className="lab-share-networks">
                {SHARE_NETWORKS.map(({ id, name, intent }) => (
                  <li key={id}>
                    <a className="lab-btn lab-btn-secondary" href={intent(caption)} target="_blank" rel="noopener noreferrer" onClick={() => post(id, name)}>
                      {name}
                      <span className="lab-sr"> {t("post.newTab")}</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>
      </Dialog.Content>
    </Dialog.Portal>
  );
}
