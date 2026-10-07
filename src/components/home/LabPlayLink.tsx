"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { trackEvent, type LabPanel } from "@/lib/analytics/events";
import { QUICK_START_HREF } from "./links";

export function LabPlayLink({ panel }: { panel: LabPanel }) {
  const t = useTranslations("home.lab.record");
  return (
    <Link className="lab-go" href={QUICK_START_HREF} onClick={() => trackEvent({ name: "lab_panel_action", params: { panel, action: "play" } })}>
      {t("play")} →
    </Link>
  );
}
