import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getMessages, getTranslations } from "next-intl/server";
import ScopedMessagesProvider from "@/components/common/ScopedMessagesProvider";
import { splitClientMessages } from "@/lib/articles/messageScope";
import { buildAlternates } from "@/lib/seo/alternates";

type DashboardLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/** Every figure on the page comes from the visitor's own browser, so a crawler would index an empty shell: kept out of the index and the sitemap. */
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard.meta" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: buildAlternates("/dashboard", locale),
    robots: { index: false, follow: true },
  };
}

export default async function DashboardLayout({ children, params }: DashboardLayoutProps) {
  const { locale } = await params;
  const { dashboard } = splitClientMessages(await getMessages({ locale }));

  return <ScopedMessagesProvider messages={dashboard}>{children}</ScopedMessagesProvider>;
}
