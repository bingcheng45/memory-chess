import type { ReactNode } from "react";
import type { Viewport } from "next";
import { getMessages } from "next-intl/server";
import ScopedMessagesProvider from "@/components/common/ScopedMessagesProvider";
import { splitClientMessages } from "@/lib/articles/messageScope";

type HomeLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

/** The Lab Paper homepage is light, so the browser chrome around it takes the paper colour (--lp-paper). */
export async function generateViewport(): Promise<Viewport> {
  return { themeColor: "#f5f8f7", colorScheme: "light" };
}

export default async function HomeLayout({ children, params }: HomeLayoutProps) {
  const { locale } = await params;
  const { lab } = splitClientMessages(await getMessages({ locale }));

  return <ScopedMessagesProvider messages={lab}>{children}</ScopedMessagesProvider>;
}
