import type { ReactNode } from "react";
import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import "./articlePaper.css";

type ArticlePaperShellProps = {
  children: ReactNode;
  /** The list is one card column; an article is the rail beside the reading column. */
  layout: "list" | "article";
};

export default function ArticlePaperShell({ children, layout }: ArticlePaperShellProps) {
  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      <main className="lab-wrap art-main">
        <div className={`art-${layout}`}>{children}</div>
      </main>
    </div>
  );
}
