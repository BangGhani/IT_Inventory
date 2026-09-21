"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Monitor,
  AlertTriangle,
  CheckSquare,
  ClipboardList,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Loader2,
} from "lucide-react";
import type { DashboardSummary, UpcomingExpiration } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { exportAllToMultiSheetExcel } from "@/lib/export-utils";
import { toast } from "sonner";

interface DashboardContentProps {
  summary: DashboardSummary;
  expirations: UpcomingExpiration[];
}

const statCards = [
  {
    key: "total_pc" as const,
    title: "Total PC",
    icon: Monitor,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
  },
  {
    key: "pc_perlu_peremajaan" as const,
    title: "Perlu Peremajaan",
    icon: AlertTriangle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
  {
    key: "todo_pending" as const,
    title: "To-Do Pending",
    icon: CheckSquare,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
  },
  {
    key: "audit_pending" as const,
    title: "Audit Pending",
    icon: ClipboardList,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
  },
  {
    key: "expiring_30_hari" as const,
    title: "Segera Expired",
    icon: Clock,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
  },
];

export function DashboardContent({
  summary,
  expirations,
}: DashboardContentProps) {
  const [isExportingAll, setIsExportingAll] = useState(false);

  const handleExportAll = async () => {
    setIsExportingAll(true);
    const toastId = toast.loading("Mengambil data dari seluruh menu inventaris...");
    try {
      const supabase = createClient();
      const [
        pcRes,
        printerRes,
        officeRes,
        wifiRes,
        edcRes,
        atmRes,
        forticlientRes,
        userEstimRes,
        pegawaiRes,
        credRes,
        todoRes,
        auditRes,
      ] = await Promise.all([
        supabase.from("pc").select("*").order("created_at", { ascending: false }),
        supabase.from("printer").select("*").order("created_at", { ascending: false }),
        supabase.from("office").select("*").order("created_at", { ascending: false }),
        supabase.from("wifi").select("*").order("created_at", { ascending: false }),
        supabase.from("edc").select("*").order("created_at", { ascending: false }),
        supabase.from("atm").select("*").order("id", { ascending: true }),
        supabase.from("forticlient").select("*").order("created_at", { ascending: false }),
        supabase.from("user_estim").select("*").order("created_at", { ascending: false }),
        supabase.from("data_pegawai").select("*").order("nama", { ascending: true }),
        supabase.from("user_password_it_support").select("*").order("aplikasi", { ascending: true }),
        supabase.from("todo_list").select("*").order("tanggal", { ascending: false }),
        supabase.from("audit").select("*").order("created_at", { ascending: false }),
      ]);

      const sheets = [
        { sheetName: "PC Komputer", data: (pcRes.data || []) as Record<string, unknown>[] },
        { sheetName: "Printer", data: (printerRes.data || []) as Record<string, unknown>[] },
        { sheetName: "Office", data: (officeRes.data || []) as Record<string, unknown>[] },
        { sheetName: "Wifi", data: (wifiRes.data || []) as Record<string, unknown>[] },
        { sheetName: "EDC", data: (edcRes.data || []) as Record<string, unknown>[] },
        { sheetName: "ATM & CRM", data: (atmRes.data || []) as Record<string, unknown>[] },
        { sheetName: "FortiClient", data: (forticlientRes.data || []) as Record<string, unknown>[] },
        { sheetName: "User Estim", data: (userEstimRes.data || []) as Record<string, unknown>[] },
        { sheetName: "Pegawai", data: (pegawaiRes.data || []) as Record<string, unknown>[] },
        { sheetName: "Credentials IT", data: (credRes.data || []) as Record<string, unknown>[] },
        { sheetName: "To-Do List", data: (todoRes.data || []) as Record<string, unknown>[] },
        { sheetName: "Audit", data: (auditRes.data || []) as Record<string, unknown>[] },
      ];

      const today = new Date().toISOString().split("T")[0];
      exportAllToMultiSheetExcel({
        filename: `Inventaris_IT_Bank_Jatim_Semua_Data_${today}`,
        sheets,
      });

      toast.success("Berhasil mengekspor semua data (12 sheet) ke file Excel!", { id: toastId });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengekspor data.";
      toast.error(msg, { id: toastId });
    } finally {
      setIsExportingAll(false);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Welcome & Master Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ringkasan inventaris IT — Bank Jatim
          </p>
        </div>

        <Button
          onClick={handleExportAll}
          disabled={isExportingAll}
          className="gap-2 shadow-xs shrink-0 bg-emerald-600 hover:bg-emerald-700 text-white dark:bg-emerald-600 dark:hover:bg-emerald-700"
        >
          {isExportingAll ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Mengekspor Semua Data...</span>
            </>
          ) : (
            <>
              <FileSpreadsheet className="w-4 h-4" />
              <span>Export (Excel)</span>
            </>
          )}
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.key}
            className="relative overflow-hidden border-border/50 hover:border-border transition-colors group"
          >
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {stat.title}
                  </span>
                  <span className="text-2xl lg:text-3xl font-bold tracking-tight">
                    {summary[stat.key]}
                  </span>
                </div>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl ${stat.bgColor} ${stat.color} transition-transform group-hover:scale-110`}
                >
                  <stat.icon className="w-5 h-5" />
                </div>
              </div>
              {/* Decorative gradient bar */}
              <div
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${stat.bgColor} opacity-60`}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upcoming Expirations */}
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Clock className="w-4 h-4 text-primary" />
            Akun Segera Expired (30 Hari)
            {expirations.length > 0 && (
              <Badge variant="destructive" className="ml-auto text-xs">
                {expirations.length}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expirations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <TrendingUp className="w-8 h-8 mb-2 opacity-30" />
              <p className="text-sm">Semua akun masih aman 👍</p>
            </div>
          ) : (
            <div className="space-y-2">
              {expirations.slice(0, 10).map((exp, idx) => (
                <div
                  key={`${exp.sumber}-${exp.identitas}-${idx}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Badge
                      variant="outline"
                      className="text-[10px] uppercase tracking-wider shrink-0"
                    >
                      {exp.sumber}
                    </Badge>
                    <span className="text-sm font-medium truncate">
                      {exp.identitas}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-3">
                    <span className="text-xs text-muted-foreground">
                      {formatDate(exp.tanggal_akhir)}
                    </span>
                    <Badge
                      variant={
                        exp.sisa_hari <= 7 ? "destructive" : "secondary"
                      }
                      className="text-[10px] tabular-nums"
                    >
                      {exp.sisa_hari}d
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
