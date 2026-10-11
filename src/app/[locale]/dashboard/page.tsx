import PageHeader from "@/components/ui/PageHeader";
import { ProgressDashboard } from "@/components/dashboard/ProgressDashboard";

export default function DashboardPage() {
  return (
    <>
      <div className="container mx-auto flex justify-center px-2 pt-4 sm:px-4">
        <PageHeader showSoundSettings={false} />
      </div>
      <ProgressDashboard />
    </>
  );
}
