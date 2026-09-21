"use client";

import { useState } from "react";
import { useCrud } from "@/lib/hooks/use-crud";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FormDialog, type FieldConfig } from "@/components/forms/form-dialog";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";
import type { Wifi } from "@/lib/types/database";

const fields: FieldConfig[] = [
  { key: "ssid", label: "SSID", type: "text", required: true, placeholder: "Nama jaringan" },
  { key: "password", label: "Password", type: "password", placeholder: "Password Wifi" },
  { key: "lokasi", label: "Lokasi", type: "text", placeholder: "Lantai 2, Gedung A" },
  { key: "user_router", label: "User Router", type: "text", placeholder: "admin" },
  { key: "password_router", label: "Password Router", type: "password", placeholder: "Password router" },
  { key: "provider", label: "Provider", type: "text", placeholder: "Telkom, Biznet, dll." },
  { key: "id_pelanggan", label: "ID Pelanggan", type: "text", placeholder: "Nomor pelanggan" },
  { key: "bandwidth", label: "Bandwidth", type: "text", placeholder: "100 Mbps" },
  { key: "keterangan", label: "Keterangan", type: "textarea" },
];

export default function WifiPage() {
  const { data, isLoading, insert, bulkInsert, update, remove, isInserting, isUpdating, isDeleting } = useCrud<Wifi>({ table: "wifi", orderBy: "ssid", orderAsc: true });
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<Wifi | null>(null);
  const [deleteData, setDeleteData] = useState<Wifi | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => setShowPasswords((p) => ({ ...p, [id]: !p[id] }));

  const columns: ColumnDef<Wifi>[] = [
    { key: "ssid", header: "SSID", sortable: true },
    {
      key: "password", header: "Password", hideOnMobile: true,
      render: (val, row) => (
        <div className="flex items-center gap-1">
          <span className="text-sm font-mono">{showPasswords[row.id] ? String(val ?? "") : "••••••"}</span>
          <button onClick={(e) => { e.stopPropagation(); togglePassword(row.id); }} className="text-muted-foreground hover:text-foreground">
            {showPasswords[row.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
    { key: "lokasi", header: "Lokasi", sortable: true, hideOnMobile: true },
    { key: "provider", header: "Provider", hideOnMobile: true },
    { key: "bandwidth", header: "Bandwidth", hideOnMobile: true },
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
      <div><h1 className="text-2xl font-bold tracking-tight">Wifi</h1><p className="text-sm text-muted-foreground">Data jaringan Wifi</p></div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Cari SSID, lokasi, provider..."
        searchKeys={["ssid", "lokasi", "provider"]}
        onAdd={() => { setEditData(null); setFormOpen(true); }}
        addLabel="Tambah Wifi"
        exportFilename="Data_Wifi"
        exportSheetName="Wifi"
        fields={fields}
        onImport={bulkInsert}
      />
      <FormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditData(null); }} title={editData ? "Edit Wifi" : "Tambah Wifi"} fields={fields} initialData={editData ?? undefined} onSubmit={handleSubmit} loading={isInserting || isUpdating} />
      <DeleteDialog open={!!deleteData} onOpenChange={(o) => { if (!o) setDeleteData(null); }} title="Hapus Wifi" description={`Hapus wifi "${deleteData?.ssid}"?`} onConfirm={handleDelete} loading={isDeleting} />
    </div>
  );
}
