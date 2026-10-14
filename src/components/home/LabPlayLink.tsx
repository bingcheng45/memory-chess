"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackEvent, type LabPanel } from "@/lib/analytics/events";
import { QUICK_START_HREF } from "./links";

export function LabPlayLink({ panel, href = QUICK_START_HREF }: { panel: LabPanel; href?: string }) {
  const t = useTranslations("home.lab.record");
  return (
    <Link className="lab-go" href={href} onClick={() => trackEvent({ name: "lab_panel_action", params: { panel, action: "play" } })}>
      {t("play")} →
    </Link>
  );
}
