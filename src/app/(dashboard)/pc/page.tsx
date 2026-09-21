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
import type { PC, DataPegawai } from "@/lib/types/database";

export default function PCPage() {
  const { data, isLoading, insert, bulkInsert, update, remove, isInserting, isUpdating, isDeleting } = useCrud<PC>({
    table: "pc",
    orderBy: "hostname",
    orderAsc: true,
  });

  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<PC | null>(null);
  const [deleteData, setDeleteData] = useState<PC | null>(null);
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
    { key: "hostname", label: "Hostname", type: "text", placeholder: "D09PC99201" },
    { key: "ip", label: "IP Address", type: "text", placeholder: "192.168.1.100", helperText: "Contoh: 192.168.1.100" },
    { key: "mac_address", label: "MAC Address", type: "text", placeholder: "00:1A:2B:3C:4D:5E", helperText: "Harus karakter hex (0-9, A-F)" },
    { key: "gateway", label: "Gateway", type: "text", placeholder: "192.168.1.1" },
    { key: "merk", label: "Merk", type: "text", placeholder: "Lenovo, HP, Dell, dll." },
    { key: "serial_number", label: "Serial Number", type: "text", placeholder: "SN PC" },
    { key: "windows_version", label: "Windows Version", type: "text", placeholder: "Windows 11 Pro" },
    { key: "windows_version_number", label: "Version Number", type: "text", placeholder: "23H2" },
    { key: "processor", label: "Processor", type: "text", placeholder: "Intel Core i5-12400" },
    { key: "ram_mb", label: "RAM (MB)", type: "number", placeholder: "8192" },
    {
      key: "storage_type", label: "Tipe Storage", type: "select",
      options: [
        { label: "HDD", value: "HDD" },
        { label: "SSD", value: "SSD" },
        { label: "NVMe", value: "NVMe" },
      ],
    },
    { key: "storage_size_gb", label: "Storage (GB)", type: "number", placeholder: "256" },
    { key: "tahun_pembelian", label: "Tahun Pembelian", type: "number", placeholder: "2023" },
    {
      key: "nip_pengguna", label: "Pengguna (Pegawai)", type: "select",
      options: pegawaiList.map((p) => ({ label: `${p.nama} (${p.nip})`, value: p.nip })),
    },
    { key: "perlu_peremajaan", label: "Perlu Peremajaan", type: "boolean", defaultValue: false },
    { key: "keterangan", label: "Keterangan", type: "textarea", placeholder: "Catatan tambahan" },
  ];

  const columns: ColumnDef<PC>[] = [
    { key: "hostname", header: "Hostname", sortable: true },
    { key: "ip", header: "IP", hideOnMobile: true, sortable: true },
    { key: "merk", header: "Merk", hideOnMobile: true, sortable: true },
    { key: "serial_number", header: "SN", hideOnMobile: true },
    {
      key: "storage_type",
      header: "Storage",
      hideOnMobile: true,
      render: (_, row) => {
        if (!row.storage_type) return "-";
        return `${row.storage_type} ${row.storage_size_gb ? row.storage_size_gb + "GB" : ""}`;
      },
    },
    {
      key: "ram_mb",
      header: "RAM",
      hideOnMobile: true,
      render: (val) => val ? `${Math.round(Number(val) / 1024)}GB` : "-",
    },
    {
      key: "perlu_peremajaan",
      header: "Status",
      render: (val) =>
        val ? (
          <Badge variant="destructive" className="text-[10px]">Perlu Peremajaan</Badge>
        ) : (
          <Badge variant="secondary" className="text-[10px]">OK</Badge>
        ),
    },
    {
      key: "_actions",
      header: "",
      className: "w-[80px]",
      render: (_, row) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditData(row); setFormOpen(true); }}>
            <Pencil className="w-3.5 h-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteData(row)}>
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

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">PC / Komputer</h1>
        <p className="text-sm text-muted-foreground">Inventaris komputer & laptop</p>
      </div>

      <DataTable
        columns={columns}
        data={data}
        loading={isLoading}
        searchPlaceholder="Cari hostname, IP, merk, SN..."
        searchKeys={["hostname", "ip", "merk", "serial_number"]}
        onAdd={() => { setEditData(null); setFormOpen(true); }}
        addLabel="Tambah PC"
        exportFilename="Data_PC_Komputer"
        exportSheetName="PC Komputer"
        fields={fields}
        onImport={bulkInsert}
      />

      <FormDialog
        open={formOpen}
        onOpenChange={(open) => { setFormOpen(open); if (!open) setEditData(null); }}
        title={editData ? "Edit PC" : "Tambah PC"}
        fields={fields}
        initialData={editData ?? undefined}
        onSubmit={handleSubmit}
        loading={isInserting || isUpdating}
      />

      <DeleteDialog
        open={!!deleteData}
        onOpenChange={(open) => { if (!open) setDeleteData(null); }}
        title="Hapus PC"
        description={`Hapus PC "${deleteData?.hostname || deleteData?.merk}"?`}
        onConfirm={handleDelete}
        loading={isDeleting}
      />
    </div>
  );
}
