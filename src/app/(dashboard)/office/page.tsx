"use client";

import { useState } from "react";
import { useCrud } from "@/lib/hooks/use-crud";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FormDialog, type FieldConfig } from "@/components/forms/form-dialog";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { daysUntil, formatDate } from "@/lib/utils";
import type { Office } from "@/lib/types/database";

const fields: FieldConfig[] = [
  { key: "email", label: "Email", type: "email", required: true, placeholder: "user@outlook.com" },
  { key: "product_key", label: "Product Key", type: "text", placeholder: "XXXXX-XXXXX-..." },
  { key: "password", label: "Password", type: "password" },
  { key: "jenis", label: "Jenis", type: "select", options: [{ label: "365", value: "365" }, { label: "Retail", value: "Retail" }, { label: "WPS", value: "WPS" }] },
  { key: "tanggal_pembelian", label: "Tanggal Pembelian", type: "date" },
  { key: "tanggal_expired", label: "Tanggal Expired", type: "date" },
  { key: "ip_komputer", label: "IP Komputer", type: "text", placeholder: "192.168.x.x" },
  { key: "keterangan", label: "Keterangan", type: "textarea" },
];

export default function OfficePage() {
  const { data, isLoading, insert, bulkInsert, update, remove, isInserting, isUpdating, isDeleting } = useCrud<Office>({ table: "office", primaryKey: "email", orderBy: "email", orderAsc: true });
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Office | null>(null);
  const [deleteData, setDeleteData] = useState<Office | null>(null);

  const columns: ColumnDef<Office>[] = [
    { key: "email", header: "Email", sortable: true },
    { key: "jenis", header: "Jenis", render: (val) => val ? <Badge variant="outline" className="text-[10px]">{String(val)}</Badge> : "-" },
    { key: "tanggal_expired", header: "Expired", sortable: true,
      render: (val) => {
        if (!val) return "-";
        const days = daysUntil(String(val));
        return (
          <div className="flex items-center gap-1.5">
            <span className="text-xs">{formatDate(String(val))}</span>
            {days !== null && days <= 0 ? <Badge variant="destructive" className="text-[10px]">Expired</Badge> :
             days !== null && days <= 30 ? <Badge className="text-[10px] bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30">{days}d</Badge> : null}
          </div>
        );
      },
    },
    { key: "ip_komputer", header: "IP Komputer", hideOnMobile: true },
    {
      key: "_actions", header: "", className: "w-[80px]",
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditData(row); setFormOpen(true); }}><Pencil className="w-3.5 h-3.5" /></Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteData(row)}><Trash2 className="w-3.5 h-3.5" /></Button>
        </div>
      ),
    },
  ];

  const handleSubmit = async (v: Record<string, unknown>) => { if (editData) { await update({ id: editData.email, payload: v }); } else { await insert(v); } setFormOpen(false); setEditData(null); };
  const handleDelete = async () => { if (deleteData) { await remove(deleteData.email); setDeleteData(null); } };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div><h1 className="text-2xl font-bold tracking-tight">Office</h1><p className="text-sm text-muted-foreground">Lisensi Office / WPS</p></div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Cari email, jenis..."
        searchKeys={["email", "jenis", "ip_komputer"]}
        onAdd={() => { setEditData(null); setFormOpen(true); }}
        addLabel="Tambah Office"
        exportFilename="Data_Office"
        exportSheetName="Office"
        fields={fields}
        onImport={bulkInsert}
      />
      <FormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditData(null); }} title={editData ? "Edit Office" : "Tambah Office"} fields={editData ? fields.map((f) => f.key === "email" ? { ...f, disabled: true } : f) : fields} initialData={editData ?? undefined} onSubmit={handleSubmit} loading={isInserting || isUpdating} />
      <DeleteDialog open={!!deleteData} onOpenChange={(o) => { if (!o) setDeleteData(null); }} title="Hapus Office" description={`Hapus lisensi "${deleteData?.email}"?`} onConfirm={handleDelete} loading={isDeleting} />
    </div>
  );
}
