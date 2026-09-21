"use client";

import { useState } from "react";
import { useCrud } from "@/lib/hooks/use-crud";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FormDialog, type FieldConfig } from "@/components/forms/form-dialog";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { ATM } from "@/lib/types/database";

const fields: FieldConfig[] = [
  { key: "id", label: "ID ATM", type: "text", required: true, placeholder: "Kode ATM" },
  { key: "nama", label: "Nama / Lokasi", type: "text", placeholder: "ATM Kantor Cabang X" },
  { key: "tipe", label: "Tipe", type: "select", options: [{ label: "ATM", value: "ATM" }, { label: "CRM", value: "CRM" }] },
  { key: "merk", label: "Merk", type: "text", placeholder: "NCR, Diebold, dll." },
  { key: "denom", label: "Denom", type: "text", placeholder: "50K, 100K" },
  { key: "serial_number", label: "Serial Number", type: "text" },
  { key: "ip_address", label: "IP Address", type: "text", placeholder: "10.0.0.1", helperText: "Contoh: 10.0.0.1" },
  { key: "mac_address", label: "MAC Address", type: "text", placeholder: "00:1A:2B:3C:4D:5E", helperText: "Harus karakter hex (0-9, A-F)" },
  { key: "gateway", label: "Gateway", type: "text", placeholder: "10.0.0.254" },
  { key: "keterangan", label: "Keterangan", type: "textarea" },
];

export default function ATMPage() {
  const { data, isLoading, insert, bulkInsert, update, remove, isInserting, isUpdating, isDeleting } = useCrud<ATM>({ table: "atm", primaryKey: "id", orderBy: "id", orderAsc: true });
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<ATM | null>(null);
  const [deleteData, setDeleteData] = useState<ATM | null>(null);

  const columns: ColumnDef<ATM>[] = [
    { key: "id", header: "ID", sortable: true },
    { key: "nama", header: "Nama / Lokasi", sortable: true },
    { key: "tipe", header: "Tipe", render: (val) => val ? <Badge variant={val === "CRM" ? "default" : "outline"} className="text-[10px]">{String(val)}</Badge> : "-" },
    { key: "merk", header: "Merk", hideOnMobile: true },
    { key: "ip_address", header: "IP", hideOnMobile: true },
    { key: "denom", header: "Denom", hideOnMobile: true },
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
      <div><h1 className="text-2xl font-bold tracking-tight">ATM / CRM</h1><p className="text-sm text-muted-foreground">Inventaris mesin ATM dan CRM</p></div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Cari ID, nama, merk, IP..."
        searchKeys={["id", "nama", "merk", "ip_address"]}
        onAdd={() => { setEditData(null); setFormOpen(true); }}
        addLabel="Tambah ATM"
        exportFilename="Data_ATM_CRM"
        exportSheetName="ATM & CRM"
        fields={fields}
        onImport={bulkInsert}
      />
      <FormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditData(null); }} title={editData ? "Edit ATM" : "Tambah ATM"} fields={editData ? fields.map((f) => f.key === "id" ? { ...f, disabled: true } : f) : fields} initialData={editData ?? undefined} onSubmit={handleSubmit} loading={isInserting || isUpdating} />
      <DeleteDialog open={!!deleteData} onOpenChange={(o) => { if (!o) setDeleteData(null); }} title="Hapus ATM" description={`Hapus ATM "${deleteData?.nama || deleteData?.id}"?`} onConfirm={handleDelete} loading={isDeleting} />
    </div>
  );
}
