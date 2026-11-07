import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getMessages, getTranslations } from "next-intl/server";
import ScopedMessagesProvider from "@/components/common/ScopedMessagesProvider";
import { splitClientMessages } from "@/lib/articles/messageScope";
import { localizedPath } from "@/lib/seo/alternates";
import { socialMetadata } from "@/lib/seo/brand";
import { robotsFor } from "@/lib/seo/englishOnly";

const siteUrl = "https://thememorychess.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "daily.meta" });
  const robots = robotsFor("/daily", locale);

  return {
    title: t("title"),
    description: t("description"),
    // Translated boards are served to readers but indexed only in English, so
    // no locale advertises another and each canonical points at itself.
    alternates: { canonical: localizedPath("/daily", locale) },
    // An `undefined` robots key would erase the layout's own robots, so the English board carries no key at all.
    ...(robots ? { robots } : {}),
    ...socialMetadata({
      title: t("socialTitle"),
      description: t("socialDescription"),
      url: `${siteUrl}${localizedPath("/daily", locale)}`,
    }),
  };
}

export default async function DailyLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const { daily } = splitClientMessages(await getMessages({ locale }));

  return <ScopedMessagesProvider messages={daily}>{children}</ScopedMessagesProvider>;
}
