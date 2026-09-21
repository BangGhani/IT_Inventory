"use client";

import { useState } from "react";
import { useCrud } from "@/lib/hooks/use-crud";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FormDialog, type FieldConfig } from "@/components/forms/form-dialog";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock, Pencil, Trash2 } from "lucide-react";
import type { Audit } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

const fields: FieldConfig[] = [
  {
    key: "jenis_audit",
    label: "Jenis Audit",
    type: "text",
    placeholder: "Contoh: Audit Internal, OJK, Eksternal",
  },
  {
    key: "tahun_audit",
    label: "Tahun Audit",
    type: "number",
    defaultValue: new Date().getFullYear(),
  },
  {
    key: "no_temuan",
    label: "No Temuan",
    type: "text",
    placeholder: "Contoh: 1 5.3 1",
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "Pending",
    options: [
      { label: "Pending", value: "Pending" },
      { label: "Finish", value: "Finish" },
    ],
  },
  {
    key: "rekomendasi",
    label: "Rekomendasi",
    type: "textarea",
    placeholder: "Rekomendasi dari temuan audit",
  },
  {
    key: "tanggapan",
    label: "Tanggapan",
    type: "textarea",
    placeholder: "Tanggapan / rencana perbaikan",
  },
  {
    key: "bulan_komitmen",
    label: "Bulan Komitmen",
    type: "text",
    placeholder: "Contoh: Maret 2026",
  },
  {
    key: "tanggal_tindak_lanjut",
    label: "Tanggal Tindak Lanjut",
    type: "date",
  },
  {
    key: "keterangan",
    label: "Keterangan",
    type: "textarea",
    placeholder: "Catatan tambahan",
  },
];

export default function AuditPage() {
  const [filterStatus, setFilterStatus] = useState<string>("All");

  const {
    data,
    isLoading,
    insert,
    bulkInsert,
    update,
    remove,
    isInserting,
    isUpdating,
    isDeleting,
  } = useCrud<Audit>({
    table: "audit",
    orderBy: "created_at",
    orderAsc: false,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Audit | null>(null);
  const [deleteData, setDeleteData] = useState<Audit | null>(null);

  const filteredData =
    filterStatus === "All"
      ? data
      : data.filter((item) => item.status === filterStatus);

  const columns: ColumnDef<Audit>[] = [
    {
      key: "no_temuan",
      header: "No Temuan",
      sortable: true,
      className: "w-[120px] font-mono font-medium",
      render: (val) => (val ? String(val) : "-"),
    },
    {
      key: "jenis_audit",
      header: "Jenis Audit",
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{val ? String(val) : "-"}</span>
          {row.tahun_audit && (
            <span className="text-xs text-muted-foreground">
              Tahun {row.tahun_audit}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "rekomendasi",
      header: "Rekomendasi",
      hideOnMobile: true,
      render: (val) => (
        <span className="text-xs text-muted-foreground line-clamp-2 max-w-[280px]">
          {val ? String(val) : "-"}
        </span>
      ),
    },
    {
      key: "bulan_komitmen",
      header: "Komitmen",
      hideOnMobile: true,
      className: "w-[120px]",
      render: (val) => (val ? String(val) : "-"),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      className: "w-[110px]",
      render: (val) => {
        const s = val as string;
        if (s === "Finish") {
          return (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              Finish
            </Badge>
          );
        }
        return (
          <Badge
            variant="outline"
            className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px]"
          >
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      },
    },
    {
      key: "tanggal_tindak_lanjut",
      header: "Tgl Tindak Lanjut",
      hideOnMobile: true,
      className: "w-[130px]",
      render: (val) => (val ? formatDate(val as string) : "-"),
    },
    {
      key: "_actions",
      header: "",
      className: "w-[80px] text-right",
      render: (_, row) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditData(row);
              setFormOpen(true);
            }}
          >
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={() => setDeleteData(row)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (formValues: Record<string, unknown>) => {
    if (editData) {
      await update({ id: editData.id, payload: formValues });
    } else {
      await insert(formValues);
    }
    setFormOpen(false);
    setEditData(null);
  };

  const handleDelete = async () => {
    if (deleteData) {
      await remove(deleteData.id);
      setDeleteData(null);
    }
  };

  const pendingCount = data.filter((a) => a.status === "Pending").length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Temuan Audit</h1>
            {pendingCount > 0 && (
              <Badge
                variant="outline"
                className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs"
              >
                {pendingCount} Pending
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Monitoring temuan audit internal & eksternal serta tindak lanjutnya
          </p>
        </div>

        {/* Filter status buttons */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg self-start">
          {(["All", "Pending", "Finish"] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                filterStatus === status
                  ? "bg-background text-foreground shadow-xs font-semibold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {status === "All" ? "Semua" : status}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        loading={isLoading}
        searchPlaceholder="Cari jenis audit, no temuan, rekomendasi..."
        searchKeys={["jenis_audit", "no_temuan", "rekomendasi", "tanggapan"]}
        onAdd={() => {
          setEditData(null);
          setFormOpen(true);
        }}
        addLabel="Tambah Temuan"
        onRowClick={(row) => {
          setEditData(row);
          setFormOpen(true);
        }}
        exportFilename="Data_Audit"
        exportSheetName="Audit"
        fields={fields}
        onImport={bulkInsert}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editData ? "Edit Temuan Audit" : "Tambah Temuan Audit Baru"}
        fields={fields}
        initialData={editData}
        onSubmit={handleSubmit}
        loading={isInserting || isUpdating}
      />

      <DeleteDialog
        open={!!deleteData}
        onOpenChange={(open) => !open && setDeleteData(null)}
        title="Hapus Temuan Audit"
        description={`Apakah Anda yakin ingin menghapus temuan "${deleteData?.no_temuan || deleteData?.jenis_audit}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
