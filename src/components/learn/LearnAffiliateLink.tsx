"use client";

import { trackEvent } from "@/lib/analytics/events";

export default function LearnAffiliateLink({ href, label }: { readonly href: string; readonly label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener"
      className="lab-btn lab-btn-secondary"
      onClick={() => trackEvent({ name: "affiliate_click", params: { store: "amazon" } })}
    >
      {label} <span aria-hidden="true">↗</span>
    </a>
  );
}
