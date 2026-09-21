"use client";

import { useState, useEffect } from "react";
import { useCrud } from "@/lib/hooks/use-crud";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FormDialog, type FieldConfig } from "@/components/forms/form-dialog";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { daysUntil, formatDate } from "@/lib/utils";
import type { FortiClient, DataPegawai } from "@/lib/types/database";

export default function FortiClientPage() {
  const { data, isLoading, insert, bulkInsert, update, remove, isInserting, isUpdating, isDeleting } = useCrud<FortiClient>({ table: "forticlient", primaryKey: "username", orderBy: "username", orderAsc: true });
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<FortiClient | null>(null);
  const [deleteData, setDeleteData] = useState<FortiClient | null>(null);
  const [pegawaiList, setPegawaiList] = useState<DataPegawai[]>([]);

  useEffect(() => {
    const fetchPegawai = async () => { const supabase = createClient(); const { data } = await supabase.from("data_pegawai").select("nip, nama").order("nama"); if (data) setPegawaiList(data as DataPegawai[]); };
    fetchPegawai();
  }, []);

  const fields: FieldConfig[] = [
    { key: "username", label: "Username", type: "text", required: true, placeholder: "Username VPN" },
    { key: "password", label: "Password", type: "password" },
    { key: "pemegang_nip", label: "Pemegang (Pegawai)", type: "select", options: pegawaiList.map((p) => ({ label: `${p.nama} (${p.nip})`, value: p.nip })) },
    { key: "tanggal_pengajuan", label: "Tanggal Pengajuan", type: "date" },
    { key: "tanggal_akhir_akses", label: "Tanggal Akhir Akses", type: "date" },
    { key: "nomor_surat_pengajuan", label: "No. Surat Pengajuan", type: "text" },
    { key: "keterangan", label: "Keterangan", type: "textarea" },
  ];

  const columns: ColumnDef<FortiClient>[] = [
    { key: "username", header: "Username", sortable: true },
    { key: "pemegang_nip", header: "NIP Pemegang", hideOnMobile: true },
    { key: "tanggal_akhir_akses", header: "Akhir Akses", sortable: true,
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
    { key: "nomor_surat_pengajuan", header: "No. Surat", hideOnMobile: true },
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
      <div><h1 className="text-2xl font-bold tracking-tight">FortiClient VPN</h1><p className="text-sm text-muted-foreground">Akses VPN FortiClient</p></div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Cari username, NIP..."
        searchKeys={["username", "pemegang_nip", "nomor_surat_pengajuan"]}
        onAdd={() => { setEditData(null); setFormOpen(true); }}
        addLabel="Tambah FortiClient"
        exportFilename="Data_FortiClient"
        exportSheetName="FortiClient"
        fields={fields}
        onImport={bulkInsert}
      />
      <FormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditData(null); }} title={editData ? "Edit FortiClient" : "Tambah FortiClient"} fields={editData ? fields.map((f) => f.key === "username" ? { ...f, disabled: true } : f) : fields} initialData={editData ?? undefined} onSubmit={handleSubmit} loading={isInserting || isUpdating} />
      <DeleteDialog open={!!deleteData} onOpenChange={(o) => { if (!o) setDeleteData(null); }} title="Hapus FortiClient" description={`Hapus akun "${deleteData?.username}"?`} onConfirm={handleDelete} loading={isDeleting} />
    </div>
  );
}
