"use client";

import { useState } from "react";
import { useCrud } from "@/lib/hooks/use-crud";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FormDialog, type FieldConfig } from "@/components/forms/form-dialog";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import type { UserPasswordITSupport } from "@/lib/types/database";

const fields: FieldConfig[] = [
  { key: "aplikasi", label: "Aplikasi", type: "text", required: true, placeholder: "Nama aplikasi" },
  { key: "url", label: "URL", type: "text", placeholder: "https://..." },
  { key: "username", label: "Username", type: "text", placeholder: "Username login" },
  { key: "password", label: "Password", type: "password", placeholder: "Password" },
  { key: "sandi", label: "Sandi / PIN", type: "password", placeholder: "Sandi tambahan" },
  { key: "keterangan", label: "Keterangan", type: "textarea" },
];

export default function CredentialsPage() {
  const { data, isLoading, insert, bulkInsert, update, remove, isInserting, isUpdating, isDeleting } = useCrud<UserPasswordITSupport>({ table: "user_password_it_support", orderBy: "aplikasi", orderAsc: true });
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<UserPasswordITSupport | null>(null);
  const [deleteData, setDeleteData] = useState<UserPasswordITSupport | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  const togglePassword = (id: string) => setShowPasswords((p) => ({ ...p, [id]: !p[id] }));

  const columns: ColumnDef<UserPasswordITSupport>[] = [
    { key: "aplikasi", header: "Aplikasi", sortable: true },
    {
      key: "url", header: "URL", hideOnMobile: true,
      render: (val) => val ? (
        <a href={String(val)} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs" onClick={(e) => e.stopPropagation()}>
          {String(val).replace(/^https?:\/\//, "").slice(0, 30)}
          <ExternalLink className="w-3 h-3" />
        </a>
      ) : "-",
    },
    { key: "username", header: "Username" },
    {
      key: "password", header: "Password",
      render: (val, row) => (
        <div className="flex items-center gap-1">
          <span className="text-sm font-mono">{showPasswords[row.id] ? String(val ?? "") : "••••••"}</span>
          <button onClick={(e) => { e.stopPropagation(); togglePassword(row.id); }} className="text-muted-foreground hover:text-foreground">
            {showPasswords[row.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      ),
    },
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
      <div><h1 className="text-2xl font-bold tracking-tight">Credentials</h1><p className="text-sm text-muted-foreground">User & password IT Support</p></div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Cari aplikasi, username..."
        searchKeys={["aplikasi", "username", "url"]}
        onAdd={() => { setEditData(null); setFormOpen(true); }}
        addLabel="Tambah Credential"
        exportFilename="Data_Credentials_IT"
        exportSheetName="Credentials IT"
        fields={fields}
        onImport={bulkInsert}
      />
      <FormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditData(null); }} title={editData ? "Edit Credential" : "Tambah Credential"} fields={fields} initialData={editData ?? undefined} onSubmit={handleSubmit} loading={isInserting || isUpdating} />
      <DeleteDialog open={!!deleteData} onOpenChange={(o) => { if (!o) setDeleteData(null); }} title="Hapus Credential" description={`Hapus credential "${deleteData?.aplikasi}"?`} onConfirm={handleDelete} loading={isDeleting} />
    </div>
  );
}
