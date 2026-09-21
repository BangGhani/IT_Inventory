"use client";

import { useState } from "react";
import { useCrud } from "@/lib/hooks/use-crud";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { FormDialog, type FieldConfig } from "@/components/forms/form-dialog";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import type { DataPegawai } from "@/lib/types/database";

const fields: FieldConfig[] = [
  { key: "nip", label: "NIP", type: "text", required: true, placeholder: "Nomor Induk Pegawai" },
  { key: "nama", label: "Nama", type: "text", required: true, placeholder: "Nama lengkap" },
  { key: "jabatan", label: "Jabatan", type: "text", placeholder: "Jabatan pegawai" },
  { key: "unit_kerja", label: "Unit Kerja", type: "text", placeholder: "Unit kerja / divisi" },
  { key: "keterangan", label: "Keterangan", type: "textarea", placeholder: "Catatan tambahan" },
];

export default function PegawaiPage() {
  const { data, isLoading, insert, bulkInsert, update, remove, isInserting, isUpdating, isDeleting } = useCrud<DataPegawai>({
    table: "data_pegawai",
    primaryKey: "nip",
    orderBy: "nama",
    orderAsc: true,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<DataPegawai | null>(null);
  const [deleteData, setDeleteData] = useState<DataPegawai | null>(null);

  const columns: ColumnDef<DataPegawai>[] = [
    { key: "nip", header: "NIP", sortable: true },
    { key: "nama", header: "Nama", sortable: true },
    { key: "jabatan", header: "Jabatan", sortable: true, hideOnMobile: true },
    { key: "unit_kerja", header: "Unit Kerja", sortable: true, hideOnMobile: true },
    {
      key: "keterangan",
      header: "Ket.",
      hideOnMobile: true,
      render: (val) => val ? <Badge variant="outline" className="text-[10px]">Ada</Badge> : "-",
    },
    {
      key: "_actions",
      header: "",
      className: "w-[80px]",
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => { setEditData(row); setFormOpen(true); }}
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
      await update({ id: editData.nip, payload: formValues });
    } else {
      await insert(formValues);
    }
    setFormOpen(false);
    setEditData(null);
  };

  const handleDelete = async () => {
    if (deleteData) {
      await remove(deleteData.nip);
      setDeleteData(null);
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Data Pegawai</h1>
        <p className="text-sm text-muted-foreground">Kelola data pegawai Bank Jatim</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Cari NIP, nama, jabatan..."
        searchKeys={["nip", "nama", "jabatan", "unit_kerja"]}
        onAdd={() => { setEditData(null); setFormOpen(true); }}
        addLabel="Tambah Pegawai"
        exportFilename="Data_Pegawai"
        exportSheetName="Pegawai"
        fields={fields}
        onImport={bulkInsert}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditData(null); }}
        title={editData ? "Edit Pegawai" : "Tambah Pegawai"}
        fields={editData ? fields.map((f) => f.key === "nip" ? { ...f, disabled: true } : f) : fields}
        initialData={editData ?? undefined}
        onSubmit={handleSubmit}
        loading={isInserting || isUpdating}
      />

      <DeleteDialog
        open={!!deleteData}
        onOpenChange={(open) => { if (!open) setDeleteData(null); }}
        title="Hapus Pegawai"
        description={`Hapus data pegawai "${deleteData?.nama}" (${deleteData?.nip})?`}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
