import type { ReactNode } from "react";
import { getMessages } from "next-intl/server";
import ArticleFlightGate from "@/components/articles/ArticleFlightGate";
import ScopedMessagesProvider from "@/components/common/ScopedMessagesProvider";
import { splitClientMessages } from "@/lib/articles/messageScope";

type ArticlesLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ArticlesLayout({ children, params }: ArticlesLayoutProps) {
  const { locale } = await params;
  const { articles } = splitClientMessages(await getMessages({ locale }));

  return (
    <ScopedMessagesProvider messages={{ articles }}>
      {children}
      <ArticleFlightGate />
    </ScopedMessagesProvider>
  );
}
