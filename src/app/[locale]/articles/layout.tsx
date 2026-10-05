import type { ReactNode } from "react";
import { getMessages } from "next-intl/server";
import ArticleFlightGate from "@/components/articles/ArticleFlightGate";
import ArticlesMessagesProvider from "@/components/articles/ArticlesMessagesProvider";
import { splitArticlesNamespace } from "@/lib/articles/messageScope";

type ArticlesLayoutProps = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function ArticlesLayout({ children, params }: ArticlesLayoutProps) {
  const { locale } = await params;
  const { articles } = splitArticlesNamespace(await getMessages({ locale }));

  return (
    <ArticlesMessagesProvider articles={articles}>
      {children}
      <ArticleFlightGate />
    </ArticlesMessagesProvider>
  );
}
