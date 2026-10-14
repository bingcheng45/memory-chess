import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { DailyBoard } from "@/components/daily/DailyBoard";
import { DailyReference } from "@/components/daily/DailyReference";

export default async function DailyPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      <main className="lab-wrap daily-main">
        <DailyBoard />
        <DailyReference locale={locale} />
      </main>
    </div>
  );
}
