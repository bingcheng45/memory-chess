import type { ReactNode } from "react";
import ArticleFlightGate from "@/components/articles/ArticleFlightGate";

export default function ArticlesLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {children}
      <ArticleFlightGate />
    </>
  );
}
