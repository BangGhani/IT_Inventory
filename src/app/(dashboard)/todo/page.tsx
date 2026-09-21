"use client";

import { useState } from "react";
import { useCrud } from "@/lib/hooks/use-crud";
import { createClient } from "@/lib/supabase/client";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FormDialog, type FieldConfig } from "@/components/forms/form-dialog";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Check, Pencil, Trash2, Clock, XCircle } from "lucide-react";
import type { TodoList } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const fields: FieldConfig[] = [
  {
    key: "tanggal",
    label: "Tanggal",
    type: "date",
    required: true,
    defaultValue: new Date().toISOString().split("T")[0],
  },
  {
    key: "kegiatan",
    label: "Kegiatan / Tugas",
    type: "text",
    required: true,
    placeholder: "Deskripsi kegiatan yang harus dilakukan",
  },
  {
    key: "status",
    label: "Status",
    type: "select",
    required: true,
    defaultValue: "Pending",
    options: [
      { label: "Pending", value: "Pending" },
      { label: "Done", value: "Done" },
      { label: "Cancelled", value: "Cancelled" },
    ],
  },
  {
    key: "keterangan",
    label: "Keterangan",
    type: "textarea",
    placeholder: "Catatan tambahan atau tindak lanjut",
  },
];

export default function TodoPage() {
  const queryClient = useQueryClient();
  const supabase = createClient();
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
  } = useCrud<TodoList>({
    table: "todo_list",
    orderBy: "tanggal",
    orderAsc: false,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<TodoList | null>(null);
  const [deleteData, setDeleteData] = useState<TodoList | null>(null);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const handleMarkDone = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setMarkingId(id);
    try {
      const { error } = await supabase.rpc("mark_todo_done", { p_id: id });
      if (error) {
        // Fallback to standard update if RPC fails
        await update({ id, payload: { status: "Done" } });
      } else {
        queryClient.invalidateQueries({ queryKey: ["todo_list"] });
        toast.success("To-Do berhasil diselesaikan");
      }
    } catch {
      toast.error("Gagal menyelesaikan to-do");
    } finally {
      setMarkingId(null);
    }
  };

  const filteredData = filterStatus === "All"
    ? data
    : data.filter((item) => item.status === filterStatus);

  const columns: ColumnDef<TodoList>[] = [
    {
      key: "tanggal",
      header: "Tanggal",
      sortable: true,
      className: "w-[120px]",
      render: (val) => formatDate(val as string),
    },
    {
      key: "kegiatan",
      header: "Kegiatan",
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span
            className={`font-medium ${
              row.status === "Done" ? "line-through text-muted-foreground" : ""
            }`}
          >
            {val as string}
          </span>
          {row.keterangan && (
            <span className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
              {row.keterangan}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      sortable: true,
      className: "w-[110px]",
      render: (val) => {
        const s = val as string;
        if (s === "Done") {
          return (
            <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 gap-1 text-[11px]">
              <CheckCircle2 className="w-3 h-3" />
              Done
            </Badge>
          );
        }
        if (s === "Cancelled") {
          return (
            <Badge variant="secondary" className="gap-1 text-[11px] text-muted-foreground">
              <XCircle className="w-3 h-3" />
              Cancelled
            </Badge>
          );
        }
        return (
          <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 text-[11px]">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        );
      },
    },
    {
      key: "_actions",
      header: "",
      className: "w-[120px] text-right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
          {row.status === "Pending" && (
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 border-emerald-500/30 gap-1"
              disabled={markingId === row.id}
              onClick={(e) => handleMarkDone(row.id, e)}
              title="Tandai Selesai"
            >
              <Check className="w-3 h-3" />
              <span className="hidden sm:inline">Selesai</span>
            </Button>
          )}
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

  const pendingCount = data.filter((t) => t.status === "Pending").length;

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">To-Do List</h1>
            {pendingCount > 0 && (
              <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs">
                {pendingCount} Pending
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Catatan aktivitas dan tugas operasional IT Support
          </p>
        </div>

        {/* Filter status buttons */}
        <div className="flex items-center gap-1.5 bg-muted/60 p-1 rounded-lg self-start">
          {(["All", "Pending", "Done", "Cancelled"] as const).map((status) => (
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
        searchPlaceholder="Cari tugas, kegiatan, keterangan..."
        searchKeys={["kegiatan", "keterangan", "tanggal"]}
        onAdd={() => {
          setEditData(null);
          setFormOpen(true);
        }}
        addLabel="Tambah Tugas"
        onRowClick={(row) => {
          setEditData(row);
          setFormOpen(true);
        }}
        exportFilename="Data_TodoList"
        exportSheetName="To-Do List"
        fields={fields}
        onImport={bulkInsert}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        title={editData ? "Edit Tugas" : "Tambah Tugas Baru"}
        fields={fields}
        initialData={editData}
        onSubmit={handleSubmit}
        loading={isInserting || isUpdating}
      />

      <DeleteDialog
        open={!!deleteData}
        onOpenChange={(open) => !open && setDeleteData(null)}
        title="Hapus Tugas"
        description={`Apakah Anda yakin ingin menghapus tugas "${deleteData?.kegiatan}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
