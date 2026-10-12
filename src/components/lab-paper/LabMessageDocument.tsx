import Link from "next/link";
import { getSansFontClass } from "@/lib/fonts";
import { LabMessage, type LabMessageProps } from "./LabMessage";
import { LAB_PAPER_CLASS } from "./shell";

/**
 * A message page as a whole English document, for the two pages drawn without the locale layout: the root 404 for
 * paths the middleware skips, and the global error page that replaces a failed root layout. Without the layout there
 * are no translations or site links, so the header is the wordmark alone.
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
