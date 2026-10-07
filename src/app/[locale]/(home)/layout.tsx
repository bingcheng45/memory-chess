import type { ReactNode } from "react";
import { getMessages } from "next-intl/server";
import ScopedMessagesProvider from "@/components/common/ScopedMessagesProvider";
import { splitClientMessages } from "@/lib/articles/messageScope";

type HomeLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function HomeLayout({ children, params }: HomeLayoutProps) {
  const { locale } = await params;
  const { lab } = splitClientMessages(await getMessages({ locale }));

  return <ScopedMessagesProvider messages={lab}>{children}</ScopedMessagesProvider>;
}
