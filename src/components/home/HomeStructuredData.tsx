"use client";

import { useLocale, useTranslations } from "next-intl";
import { homeSchema } from "./homeSchema";

/**
 * A plain script tag, not next/script: `strategy="afterInteractive"` keeps the
 * JSON-LD out of the served HTML, so crawlers would see it only if they ran JS.
 */
export function HomeStructuredData() {
  const locale = useLocale();
  const t = useTranslations("home.meta");

  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeSchema(locale, t("description"))) }} />
  );
}
