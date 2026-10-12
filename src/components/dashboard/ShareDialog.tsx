"use client";

import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { useTranslations } from "next-intl";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { useCopyText } from "@/components/home/useCopyText";
import { trackEvent } from "@/lib/analytics/events";
import { saveBlob } from "@/lib/saveBlob";
import { SHARE_NETWORKS, type ShareNetwork } from "@/lib/shareIntents";
import { captionWithLink, type ShareCaption } from "./shareCaption";

const FILE_NAME = "memory-chess-progress.png";

export type CardImage = { readonly state: "rendering" } | { readonly state: "ready"; readonly blob: Blob; readonly src: string } | { readonly state: "failed" };

type Method = "native" | "download" | "copy_image" | "copy";

const track = (method: Method) => trackEvent({ name: "lab_dashboard_share", params: { method } });
const trackPost = (network: ShareNetwork) => trackEvent({ name: "lab_dashboard_share", params: { method: "post", network } });

const isCancel = (error: unknown) => error instanceof DOMException && error.name === "AbortError";

/** The share sheet takes the PNG where it can (mostly phones), and the caption and link where it cannot. */
function shareData(caption: ShareCaption, blob: Blob | null): ShareData {
  const text = { text: caption.text, url: caption.url };
  const files = blob ? [new File([blob], FILE_NAME, { type: "image/png" })] : [];
  return files.length > 0 && navigator.canShare?.({ files }) ? { ...text, files } : text;
}

/** An image on the clipboard needs ClipboardItem with PNG support: Chromium and Safari have it, older Firefox does not. */
function canCopyImage(): boolean {
  if (typeof ClipboardItem !== "function" || typeof navigator.clipboard?.write !== "function") return false;
  const { supports } = ClipboardItem as unknown as { supports?: (type: string) => boolean };
  return supports ? supports("image/png") : true;
}

function Preview({ image, alt }: { image: CardImage; alt: string }) {
  const t = useTranslations("dashboard");
  if (image.state === "failed") {
    return <p className="lab-share-preview" data-state="failed">{t("share.failed")}</p>;
  }
  return (
    <figure className="lab-share-preview" data-state={image.state} aria-busy={image.state === "rendering"}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a blob: URL drawn in this tab, which next/image cannot load */}
      {image.state === "ready" ? <img src={image.src} alt={alt} width={1080} height={1350} /> : <span className="lab-sr">{t("share.working")}</span>}
    </figure>
  );
}

/** The card as it will post, with every way to send it: the share sheet, the file, the clipboard, and each network's post page. */
export function ShareDialog({ caption, image, alt }: { caption: ShareCaption; image: CardImage; alt: string }) {
  const t = useTranslations("dashboard");
  const [status, setStatus] = useState("");
  const { copy, textRef } = useCopyText(captionWithLink(caption));
  const blob = image.state === "ready" ? image.blob : null;
  const pending = image.state === "rendering";
  const hasImage = image.state !== "failed";
  const canShare = typeof navigator.share === "function";
  const copyImage = hasImage && canCopyImage();

  const runShare = async (data: ShareData) => {
    try {
      await navigator.share(data);
      track("native");
      setStatus(t("share.shared"));
    } catch (error) {
      setStatus(isCancel(error) ? "" : t("share.shareFailed"));
    }
  };

  const download = (png: Blob) => {
    saveBlob(png, FILE_NAME);
    track("download");
    setStatus(t("share.downloaded"));
  };

  const copyPng = async (png: Blob) => {
    try {
      await navigator.clipboard.write([new ClipboardItem({ "image/png": png })]);
      track("copy_image");
      setStatus(t("share.imageCopied"));
    } catch {
      setStatus(t("share.imageCopyFailed"));
    }
  };

  const copyCaption = async () => {
    const copied = await copy();
    if (copied) track("copy");
    setStatus(t(copied ? "share.copied" : "share.copyFailed"));
  };

  const post = (network: ShareNetwork, name: string) => {
    trackPost(network);
    setStatus(t("share.opened", { network: name }));
  };

  return (
    <Dialog.Portal>
      <Dialog.Overlay className="lab-share-overlay" />
      <Dialog.Content className={`${LAB_PAPER_CLASS} lab-share-dialog`} aria-modal="true">
        <header className="lab-share-head">
          <div>
            <Dialog.Title className="lab-share-title">{t("share.title")}</Dialog.Title>
            <Dialog.Description className="lab-share-intro">{t("share.intro")}</Dialog.Description>
          </div>
          <Dialog.Close className="lab-share-close" aria-label={t("share.close")}>
            <X aria-hidden size={20} />
          </Dialog.Close>
        </header>
        <div className="lab-share-body">
          <Preview image={image} alt={alt} />
          <div className="lab-share-tools">
            <div>
              <div className="lab-share-actions">
                {canShare && (
                  <button type="button" className="lab-btn lab-btn-primary" disabled={pending} onClick={() => void runShare(shareData(caption, blob))}>
                    {t("share.actions.share")}
                  </button>
                )}
                {hasImage && (
                  <button type="button" className={`lab-btn ${canShare ? "lab-btn-secondary" : "lab-btn-primary"}`} disabled={pending} onClick={() => blob && download(blob)}>
                    {t("share.actions.download")}
                  </button>
                )}
                {copyImage && (
                  <button type="button" className="lab-btn lab-btn-secondary" disabled={pending} onClick={() => blob && void copyPng(blob)}>
                    {t("share.actions.copyImage")}
                  </button>
                )}
              </div>
              <p className="lab-note lab-share-status" role="status">
                {status}
              </p>
            </div>
            <figure className="lab-share-caption">
              <figcaption className="lab-share-label">{t("share.caption")}</figcaption>
              <pre ref={textRef}>{captionWithLink(caption)}</pre>
              <button type="button" className="lab-btn lab-btn-secondary" onClick={() => void copyCaption()}>
                {t("share.copy")}
              </button>
            </figure>
            <section className="lab-share-post" aria-labelledby="lab-share-post-title">
              <h3 id="lab-share-post-title" className="lab-share-label">
                {t("share.post.title")}
              </h3>
              <p className="lab-share-note">{t("share.post.note")}</p>
              <ul className="lab-share-networks">
                {SHARE_NETWORKS.map(({ id, name, intent }) => (
                  <li key={id}>
                    <a className="lab-btn lab-btn-secondary" href={intent(caption)} target="_blank" rel="noopener noreferrer" onClick={() => post(id, name)}>
                      {name}
                      <span className="lab-sr"> {t("share.post.newTab")}</span>
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
