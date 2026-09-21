import { createClient } from "@/lib/supabase/server";
import type { DashboardSummary, UpcomingExpiration } from "@/lib/types/database";
import { DashboardContent } from "./dashboard-content";

export default async function DashboardPage() {
  const supabase = await createClient();

  const [summaryResult, expirationsResult] = await Promise.all([
    supabase.rpc("get_dashboard_summary").single(),
    supabase.rpc("get_upcoming_expirations", { days_ahead: 30 }),
  ]);

  const summary: DashboardSummary = (summaryResult.data as DashboardSummary) ?? {
    total_pc: 0,
    pc_perlu_peremajaan: 0,
    todo_pending: 0,
    audit_pending: 0,
    expiring_30_hari: 0,
  };

  const expirations: UpcomingExpiration[] =
    (expirationsResult.data as UpcomingExpiration[]) ?? [];

  return <DashboardContent summary={summary} expirations={expirations} />;
}
