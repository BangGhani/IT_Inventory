"use client";

import { useState } from "react";
import { useCrud } from "@/lib/hooks/use-crud";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FormDialog, type FieldConfig } from "@/components/forms/form-dialog";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { Printer } from "@/lib/types/database";

const fields: FieldConfig[] = [
  {
    key: "jenis", label: "Jenis", type: "select", required: true,
    options: [
      { label: "Printer", value: "Printer" },
      { label: "Passbook", value: "Passbook" },
      { label: "Printer Besar", value: "Printer Besar" },
      { label: "Lainnya", value: "Lainnya" },
    ],
  },
  { key: "merk_type", label: "Merk / Type", type: "text", placeholder: "Epson LQ-2190" },
  { key: "serial_number", label: "Serial Number", type: "text", placeholder: "SN Printer" },
  { key: "tahun_pembelian", label: "Tahun Pembelian", type: "number", placeholder: "2023" },
  { key: "keterangan", label: "Keterangan", type: "textarea", placeholder: "Catatan tambahan" },
];

export default function PrinterPage() {
  const { data, isLoading, insert, bulkInsert, update, remove, isInserting, isUpdating, isDeleting } = useCrud<Printer>({ table: "printer", orderBy: "merk_type", orderAsc: true });
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Printer | null>(null);
  const [deleteData, setDeleteData] = useState<Printer | null>(null);

  const columns: ColumnDef<Printer>[] = [
    { key: "jenis", header: "Jenis", sortable: true, render: (val) => val ? <Badge variant="outline" className="text-[10px]">{String(val)}</Badge> : "-" },
    { key: "merk_type", header: "Merk / Type", sortable: true },
    { key: "serial_number", header: "SN", hideOnMobile: true },
    { key: "tahun_pembelian", header: "Tahun", hideOnMobile: true, sortable: true },
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

  const handleSubmit = async (v: Record<string, unknown>) => { if (editData) { await update({ id: editData.id, payload: v }); } else { await insert(v); } setFormOpen(false); setEditData(null); };
  const handleDelete = async () => { if (deleteData) { await remove(deleteData.id); setDeleteData(null); } };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div><h1 className="text-2xl font-bold tracking-tight">Printer</h1><p className="text-sm text-muted-foreground">Inventaris printer & passbook</p></div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Cari merk, SN..."
        searchKeys={["merk_type", "serial_number", "jenis"]}
        onAdd={() => { setEditData(null); setFormOpen(true); }}
        addLabel="Tambah Printer"
        exportFilename="Data_Printer"
        exportSheetName="Printer"
        fields={fields}
        onImport={bulkInsert}
      />
      <FormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditData(null); }} title={editData ? "Edit Printer" : "Tambah Printer"} fields={fields} initialData={editData ?? undefined} onSubmit={handleSubmit} loading={isInserting || isUpdating} />
      <DeleteDialog open={!!deleteData} onOpenChange={(o) => { if (!o) setDeleteData(null); }} title="Hapus Printer" description={`Hapus printer "${deleteData?.merk_type}"?`} onConfirm={handleDelete} loading={isDeleting} />
    </div>
  );
}
