import type { ReactNode } from "react";
import type { Viewport } from "next";
import { getMessages } from "next-intl/server";
import ScopedMessagesProvider from "@/components/common/ScopedMessagesProvider";
import { splitClientMessages } from "@/lib/articles/messageScope";
import { hasLabCopy } from "@/lib/home/labLocales";

type HomeLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/** The Lab Paper homepage is light, so the browser chrome around it takes the paper colour (--lp-paper); the earlier homepage keeps the site's dark chrome. */
export async function generateViewport({ params }: { params: Promise<{ locale: string }> }): Promise<Viewport> {
  const { locale } = await params;
  return hasLabCopy(locale) ? { themeColor: "#f5f8f7", colorScheme: "light" } : {};
}

export default async function HomeLayout({ children, params }: HomeLayoutProps) {
  const { locale } = await params;
  if (!hasLabCopy(locale)) return children;
  const { lab } = splitClientMessages(await getMessages({ locale }));

  return <ScopedMessagesProvider messages={lab}>{children}</ScopedMessagesProvider>;
}
