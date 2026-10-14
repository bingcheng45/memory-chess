import type { ReactNode } from "react";
import { COMMUNITY_URL, type CommunityPlacement } from "@/lib/community";

interface CommunityLinkProps {
  readonly placement: CommunityPlacement;
  readonly children: ReactNode;
  readonly className?: string;
}

/** A plain outbound link to the Telegram group. No script and no analytics event: GA4 already records the click by id. */
export function CommunityLink({ placement, children, className }: CommunityLinkProps) {
  return (
    <a id={`community-${placement}`} className={className} href={COMMUNITY_URL} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/** A quiet one-line invite: a sentence, then the link. */
export function CommunityInvite({ placement, line, link }: { readonly placement: CommunityPlacement; readonly line: string; readonly link: string }) {
  return (
    <p className="lab-community" data-community={placement}>
      {line} <CommunityLink placement={placement}>{link}</CommunityLink>
    </p>
  );
}
