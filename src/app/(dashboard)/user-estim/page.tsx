"use client";

import { useState, useEffect } from "react";
import { useCrud } from "@/lib/hooks/use-crud";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FormDialog, type FieldConfig } from "@/components/forms/form-dialog";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UserEstim, DataPegawai } from "@/lib/types/database";

export default function UserEstimPage() {
  const { data, isLoading, insert, bulkInsert, update, remove, isInserting, isUpdating, isDeleting } = useCrud<UserEstim>({ table: "user_estim", primaryKey: "username", orderBy: "username", orderAsc: true });
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<UserEstim | null>(null);
  const [deleteData, setDeleteData] = useState<UserEstim | null>(null);
  const [pegawaiList, setPegawaiList] = useState<DataPegawai[]>([]);

  useEffect(() => {
    const fetchPegawai = async () => { const supabase = createClient(); const { data } = await supabase.from("data_pegawai").select("nip, nama").order("nama"); if (data) setPegawaiList(data as DataPegawai[]); };
    fetchPegawai();
  }, []);

  const fields: FieldConfig[] = [
    { key: "username", label: "Username", type: "text", required: true, placeholder: "Username Estim" },
    { key: "display", label: "Display Name", type: "text", placeholder: "Nama tampilan" },
    { key: "nip_pemegang", label: "Pemegang (Pegawai)", type: "select", options: pegawaiList.map((p) => ({ label: `${p.nama} (${p.nip})`, value: p.nip })) },
    { key: "keterangan", label: "Keterangan", type: "textarea" },
  ];

  const columns: ColumnDef<UserEstim>[] = [
    { key: "username", header: "Username", sortable: true },
    { key: "display", header: "Display Name", sortable: true },
    { key: "nip_pemegang", header: "NIP Pemegang", hideOnMobile: true },
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

  const handleSubmit = async (v: Record<string, unknown>) => { if (editData) { await update({ id: editData.username, payload: v }); } else { await insert(v); } setFormOpen(false); setEditData(null); };
  const handleDelete = async () => { if (deleteData) { await remove(deleteData.username); setDeleteData(null); } };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div><h1 className="text-2xl font-bold tracking-tight">User Estim</h1><p className="text-sm text-muted-foreground">Data akun Estim</p></div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Cari username, display..."
        searchKeys={["username", "display", "nip_pemegang"]}
        onAdd={() => { setEditData(null); setFormOpen(true); }}
        addLabel="Tambah User"
        exportFilename="Data_User_Estim"
        exportSheetName="User Estim"
        fields={fields}
        onImport={bulkInsert}
      />
      <FormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditData(null); }} title={editData ? "Edit User Estim" : "Tambah User Estim"} fields={editData ? fields.map((f) => f.key === "username" ? { ...f, disabled: true } : f) : fields} initialData={editData ?? undefined} onSubmit={handleSubmit} loading={isInserting || isUpdating} />
      <DeleteDialog open={!!deleteData} onOpenChange={(o) => { if (!o) setDeleteData(null); }} title="Hapus User Estim" description={`Hapus user "${deleteData?.username}"?`} onConfirm={handleDelete} loading={isDeleting} />
    </div>
  );
}
