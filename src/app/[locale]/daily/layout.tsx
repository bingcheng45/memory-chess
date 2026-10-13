import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getMessages, getTranslations } from "next-intl/server";
import ScopedMessagesProvider from "@/components/common/ScopedMessagesProvider";
import { splitClientMessages } from "@/lib/articles/messageScope";
import { buildAlternates, localizedPath } from "@/lib/seo/alternates";
import { socialMetadata } from "@/lib/seo/brand";

const siteUrl = "https://thememorychess.com";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "daily.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates("/daily", locale),
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
