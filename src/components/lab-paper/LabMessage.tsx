import type { ReactNode } from "react";
import "./lab-message.css";

export interface LabMessageProps {
  /** A short label above the heading, such as the status code. */
  readonly kicker?: string;
  readonly heading: string;
  readonly body: string;
  /** The page's way out: links or buttons, primary first. */
  readonly children: ReactNode;
}

/** The body of a page that only says what happened and where to go next: the 404 and the error pages. */
export function LabMessage({ kicker, heading, body, children }: LabMessageProps) {
  return (
    <main className="lab-wrap lab-message">
      {kicker && <p className="lab-kicker">{kicker}</p>}
      <h1 className="lab-message-h">{heading}</h1>
      <p className="lab-lede">{body}</p>
      <div className="lab-message-actions">{children}</div>
    </main>
  );
}
