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
import type { EDC, DataPegawai } from "@/lib/types/database";

export default function EDCPage() {
  const { data, isLoading, insert, bulkInsert, update, remove, isInserting, isUpdating, isDeleting } = useCrud<EDC>({ table: "edc", orderBy: "mid", orderAsc: true });
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<EDC | null>(null);
  const [deleteData, setDeleteData] = useState<EDC | null>(null);
  const [pegawaiList, setPegawaiList] = useState<DataPegawai[]>([]);

  useEffect(() => {
    const fetchPegawai = async () => {
      const supabase = createClient();
      const { data } = await supabase.from("data_pegawai").select("nip, nama").order("nama");
      if (data) setPegawaiList(data as DataPegawai[]);
    };
    fetchPegawai();
  }, []);

  const fields: FieldConfig[] = [
    { key: "mid", label: "MID", type: "text", placeholder: "Merchant ID" },
    { key: "tid", label: "TID", type: "text", placeholder: "Terminal ID" },
    { key: "serial_number", label: "Serial Number", type: "text" },
    { key: "tipe", label: "Tipe", type: "select", options: [{ label: "Pinpad", value: "Pinpad" }, { label: "Android", value: "Android" }] },
    { key: "lokasi", label: "Lokasi", type: "text", placeholder: "Lokasi EDC" },
    { key: "peruntukan", label: "Peruntukan", type: "select", options: [{ label: "Bank Jatim", value: "Bank Jatim" }, { label: "Merchant", value: "Merchant" }] },
    { key: "pic_nip", label: "PIC (Pegawai)", type: "select", options: pegawaiList.map((p) => ({ label: `${p.nama} (${p.nip})`, value: p.nip })) },
    { key: "pic_nama", label: "PIC Nama (jika bukan pegawai)", type: "text", placeholder: "Nama PIC external" },
    { key: "keterangan", label: "Keterangan", type: "textarea" },
  ];

  const columns: ColumnDef<EDC>[] = [
    { key: "mid", header: "MID", sortable: true },
    { key: "tid", header: "TID", sortable: true },
    { key: "tipe", header: "Tipe", render: (val) => val ? <Badge variant="outline" className="text-[10px]">{String(val)}</Badge> : "-" },
    { key: "lokasi", header: "Lokasi", hideOnMobile: true, sortable: true },
    { key: "peruntukan", header: "Peruntukan", hideOnMobile: true, render: (val) => val ? <Badge variant={val === "Bank Jatim" ? "default" : "secondary"} className="text-[10px]">{String(val)}</Badge> : "-" },
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
      <div><h1 className="text-2xl font-bold tracking-tight">EDC</h1><p className="text-sm text-muted-foreground">Inventaris mesin EDC</p></div>
      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Cari MID, TID, lokasi..."
        searchKeys={["mid", "tid", "lokasi", "serial_number"]}
        onAdd={() => { setEditData(null); setFormOpen(true); }}
        addLabel="Tambah EDC"
        exportFilename="Data_EDC"
        exportSheetName="EDC"
        fields={fields}
        onImport={bulkInsert}
      />
      <FormDialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditData(null); }} title={editData ? "Edit EDC" : "Tambah EDC"} fields={fields} initialData={editData ?? undefined} onSubmit={handleSubmit} loading={isInserting || isUpdating} />
      <DeleteDialog open={!!deleteData} onOpenChange={(o) => { if (!o) setDeleteData(null); }} title="Hapus EDC" description={`Hapus EDC MID "${deleteData?.mid}"?`} onConfirm={handleDelete} loading={isDeleting} />
    </div>
  );
}
