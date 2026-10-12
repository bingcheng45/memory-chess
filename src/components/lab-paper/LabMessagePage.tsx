import type { ReactNode } from "react";
import Link from "next/link";
import { getSansFontClass } from "@/lib/fonts";
import { LabPaperHeader } from "./LabPaperHeader";
import { LAB_PAPER_CLASS } from "./shell";
import "./lab-message.css";

interface LabMessageProps {
  /** A short label above the heading, such as the status code. */
  readonly kicker: string;
  readonly heading: string;
  readonly body: string;
  /** The page's way out: links or buttons, primary first. */
  readonly children: ReactNode;
}

function LabMessage({ kicker, heading, body, children }: LabMessageProps) {
  return (
    <main className="lab-wrap lab-message">
      <p className="lab-kicker">{kicker}</p>
      <h1 className="lab-message-h">{heading}</h1>
      <p className="lab-lede">{body}</p>
      <div className="lab-message-actions">{children}</div>
    </main>
  );
}

/** A page that only says what happened and where to go next, under the shell header: the 404 and the error page. */
export function LabMessagePage(props: LabMessageProps) {
  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      <LabMessage {...props} />
    </div>
  );
}

/**
 * The same message as a whole English document, for the two pages drawn without the locale layout: the root 404
 * for paths the middleware skips, and the global error page that replaces a failed root layout. Without the
 * layout there are no translations or site links, so the header is the wordmark alone.
 */
export function LabMessageDocument({ title, ...props }: LabMessageProps & { readonly title: string }) {
  return (
    <html lang="en">
      <body className={getSansFontClass("en")} style={{ margin: 0 }}>
        <title>{title}</title>
        <div className={LAB_PAPER_CLASS}>
          <header className="lab-header">
            <div className="lab-wrap">
              <div className="lab-header-row">
                <Link className="lab-wordmark" href="/">
                  Memory <span className="lab-wordmark-chess">Chess</span>
                </Link>
              </div>
            </div>
          </header>
          <LabMessage {...props} />
        </div>
      </body>
    </html>
  );
}
