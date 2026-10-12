import { LabPaperHeader } from "@/components/lab-paper/LabPaperHeader";
import { LAB_PAPER_CLASS } from "@/components/lab-paper/shell";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function DashboardPage() {
  return (
    <div className={LAB_PAPER_CLASS}>
      <LabPaperHeader />
      <Dashboard />
    </div>
  );
}
