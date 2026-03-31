import { DashboardShell } from "@/components/dashboard-shell";

export const metadata = {
  title: "Dashboard | Hulex"
};

export default function DashboardPage() {
  return (
    <div className="page-stack shell">
      <DashboardShell />
    </div>
  );
}
