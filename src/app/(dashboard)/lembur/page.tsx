"use client";

import { useState, useCallback, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { DataTable, type ColumnDef } from "@/components/data-table/data-table";
import { DeleteDialog } from "@/components/forms/delete-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, FileDown, Loader2, Clock, Search, UserCheck } from "lucide-react";
import type { LemburDetail } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { exportLemburToExcel } from "@/lib/export-utils";

// ─── Lembur Form Dialog ─────────────────────────────────────────────

interface LemburFormData {
  nip: string;
  tanggal: string;
  waktu_mulai: string;
  waktu_selesai: string;
  keterangan: string;
  estimasi_biaya: string;
}

function LemburFormDialog({
  open,
  onOpenChange,
  initialData,
  onSubmit,
  loading,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialData: LemburDetail | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  loading: boolean;
}) {
  const supabase = createClient();

  const [formData, setFormData] = useState<LemburFormData>({
    nip: "",
    tanggal: new Date().toISOString().split("T")[0],
    waktu_mulai: "",
    waktu_selesai: "",
    keterangan: "",
    estimasi_biaya: "",
  });

  const [pegawaiInfo, setPegawaiInfo] = useState<{
    nama: string;
    jabatan: string;
  } | null>(null);
  const [nipLoading, setNipLoading] = useState(false);
  const [nipError, setNipError] = useState<string | null>(null);

  // Reset form when dialog opens/closes or initialData changes
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);
    if (open) {
      if (initialData) {
        setFormData({
          nip: initialData.nip || "",
          tanggal: initialData.tanggal || "",
          waktu_mulai: initialData.waktu_mulai?.slice(0, 5) || "",
          waktu_selesai: initialData.waktu_selesai?.slice(0, 5) || "",
          keterangan: initialData.keterangan || "",
          estimasi_biaya: initialData.estimasi_biaya != null ? String(initialData.estimasi_biaya) : "",
        });
        setPegawaiInfo(
          initialData.nama
            ? { nama: initialData.nama, jabatan: initialData.jabatan || "-" }
            : null
        );
        setNipError(null);
      } else {
        setFormData({
          nip: "",
          tanggal: new Date().toISOString().split("T")[0],
          waktu_mulai: "",
          waktu_selesai: "",
          keterangan: "",
          estimasi_biaya: "",
        });
        setPegawaiInfo(null);
        setNipError(null);
      }
    }
  }

  // NIP lookup
  const lookupNip = useCallback(
    async (nip: string) => {
      if (!nip.trim()) {
        setPegawaiInfo(null);
        setNipError(null);
        return;
      }

      setNipLoading(true);
      setNipError(null);

      try {
        const { data, error } = await supabase
          .from("data_pegawai")
          .select("nama, jabatan")
          .eq("nip", nip.trim())
          .maybeSingle();

        if (error) throw error;

        if (data) {
          setPegawaiInfo({ nama: data.nama, jabatan: data.jabatan || "-" });
          setNipError(null);
        } else {
          setPegawaiInfo(null);
          setNipError("NIP tidak ditemukan di data pegawai");
        }
      } catch {
        setPegawaiInfo(null);
        setNipError("Gagal mencari data pegawai");
      } finally {
        setNipLoading(false);
      }
    },
    [supabase]
  );

  // Debounced NIP lookup
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      if (formData.nip.trim().length >= 3) {
        lookupNip(formData.nip);
      } else {
        setPegawaiInfo(null);
        setNipError(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [formData.nip, open, lookupNip]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!pegawaiInfo) {
      setNipError("NIP harus valid dan ada di data pegawai");
      return;
    }

    const payload: Record<string, unknown> = {
      nip: formData.nip.trim(),
      tanggal: formData.tanggal,
      waktu_mulai: formData.waktu_mulai,
      waktu_selesai: formData.waktu_selesai,
      keterangan: formData.keterangan.trim() || null,
      estimasi_biaya: formData.estimasi_biaya ? Number(formData.estimasi_biaya) : null,
    };

    try {
      await onSubmit(payload);
    } catch {
      // Error handled by parent
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            {initialData ? "Edit Data Lembur" : "Tambah Data Lembur"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-2">
          {/* NIP Input with auto-lookup */}
          <div className="space-y-2">
            <Label htmlFor="nip">NIP *</Label>
            <div className="relative">
              <Input
                id="nip"
                value={formData.nip}
                onChange={(e) => setFormData((p) => ({ ...p, nip: e.target.value }))}
                placeholder="Masukkan NIP pegawai..."
                required
                className="pr-10"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {nipLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                ) : (
                  <Search className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
            {pegawaiInfo && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-sm">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-emerald-700 dark:text-emerald-300">
                    {pegawaiInfo.nama}
                  </p>
                  <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80">
                    {pegawaiInfo.jabatan}
                  </p>
                </div>
              </div>
            )}
            {nipError && (
              <p className="text-xs text-destructive">{nipError}</p>
            )}
          </div>

          {/* Tanggal */}
          <div className="space-y-2">
            <Label htmlFor="tanggal">Tanggal *</Label>
            <Input
              id="tanggal"
              type="date"
              value={formData.tanggal}
              onChange={(e) => setFormData((p) => ({ ...p, tanggal: e.target.value }))}
              required
            />
          </div>

          {/* Waktu Mulai & Selesai */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="waktu_mulai">Waktu Mulai *</Label>
              <Input
                id="waktu_mulai"
                type="time"
                value={formData.waktu_mulai}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, waktu_mulai: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="waktu_selesai">Waktu Selesai *</Label>
              <Input
                id="waktu_selesai"
                type="time"
                value={formData.waktu_selesai}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, waktu_selesai: e.target.value }))
                }
                required
              />
            </div>
          </div>

          {/* Keterangan */}
          <div className="space-y-2">
            <Label htmlFor="keterangan">Keterangan / Kegiatan</Label>
            <Textarea
              id="keterangan"
              value={formData.keterangan}
              onChange={(e) =>
                setFormData((p) => ({ ...p, keterangan: e.target.value }))
              }
              placeholder="Contoh: Pendampingan Audit TI"
              rows={3}
            />
          </div>

          {/* Estimasi Biaya */}
          <div className="space-y-2">
            <Label htmlFor="estimasi_biaya">Estimasi Biaya</Label>
            <Input
              id="estimasi_biaya"
              type="number"
              value={formData.estimasi_biaya}
              onChange={(e) =>
                setFormData((p) => ({ ...p, estimasi_biaya: e.target.value }))
              }
              placeholder="Opsional — kosongkan jika belum ada"
              min="0"
              step="any"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" disabled={loading || !pegawaiInfo}>
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : initialData ? (
                "Simpan Perubahan"
              ) : (
                "Tambah Lembur"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Export Month Picker Dialog ──────────────────────────────────────

function ExportDialog({
  open,
  onOpenChange,
  onExport,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (bulan: number, tahun: number) => void;
}) {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1));
  const [tahun, setTahun] = useState(String(now.getFullYear()));

  const bulanOptions = [
    { label: "Januari", value: "1" },
    { label: "Februari", value: "2" },
    { label: "Maret", value: "3" },
    { label: "April", value: "4" },
    { label: "Mei", value: "5" },
    { label: "Juni", value: "6" },
    { label: "Juli", value: "7" },
    { label: "Agustus", value: "8" },
    { label: "September", value: "9" },
    { label: "Oktober", value: "10" },
    { label: "November", value: "11" },
    { label: "Desember", value: "12" },
  ];

  // Generate year options (current year ± 3)
  const currentYear = now.getFullYear();
  const yearOptions = Array.from({ length: 7 }, (_, i) => {
    const y = currentYear - 3 + i;
    return { label: String(y), value: String(y) };
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="w-5 h-5" />
            Ekspor Data Lembur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <p className="text-sm text-muted-foreground">
            Pilih bulan dan tahun untuk mengekspor data lembur ke format Excel
            sesuai template resmi.
          </p>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Bulan</Label>
              <Select value={bulan} onValueChange={(v) => v && setBulan(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {bulanOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tahun</Label>
              <Select value={tahun} onValueChange={(v) => v && setTahun(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            onClick={() => {
              onExport(Number(bulan), Number(tahun));
              onOpenChange(false);
            }}
            className="gap-2"
          >
            <FileDown className="w-4 h-4" />
            Ekspor Excel
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Lembur Page ───────────────────────────────────────────────

function formatDbError(error: unknown): Error {
  if (!error) return new Error("Terjadi kesalahan pada database");
  if (error instanceof Error) return error;

  const errObj = error as { code?: string; message?: string; details?: string };
  let msg = errObj.message || "Terjadi kesalahan pada database";

  if (errObj.code === "42501" || msg.toLowerCase().includes("row-level security") || msg.toLowerCase().includes("rls")) {
    msg = "Akses ditolak oleh RLS (Row Level Security). Jalankan kebijakan RLS untuk tabel lembur di Supabase SQL Editor atau pastikan sudah login.";
  } else if (errObj.code === "23503") {
    msg = "NIP tidak ditemukan di data pegawai.";
  }

  const result = new Error(msg);
  (result as unknown as { code?: string }).code = errObj.code;
  return result;
}

export default function LemburPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  // Fetch all lembur data via the view (includes nama & jabatan)
  const { data: allData = [], isLoading } = useQuery<LemburDetail[]>({
    queryKey: ["lembur"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("v_lembur_detail")
        .select("*")
        .order("tanggal", { ascending: false });
      if (error) throw formatDbError(error);
      return data as LemburDetail[];
    },
  });

  // Mutations
  const insertMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Sesi login Anda telah berakhir. Silakan login kembali.");
      }
      const { error } = await supabase.from("lembur").insert(payload).select().single();
      if (error) throw formatDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lembur"] });
      toast.success("Data lembur berhasil ditambahkan");
    },
    onError: (error: Error) => {
      toast.error("Gagal menambahkan data lembur", { description: error.message });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: Record<string, unknown> }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Sesi login Anda telah berakhir. Silakan login kembali.");
      }
      const { error } = await supabase.from("lembur").update(payload).eq("id", id).select().single();
      if (error) throw formatDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lembur"] });
      toast.success("Data lembur berhasil diperbarui");
    },
    onError: (error: Error) => {
      toast.error("Gagal memperbarui data lembur", { description: error.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lembur").delete().eq("id", id);
      if (error) throw formatDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lembur"] });
      toast.success("Data lembur berhasil dihapus");
    },
    onError: (error: Error) => {
      toast.error("Gagal menghapus data lembur", { description: error.message });
    },
  });

  // UI state
  const [formOpen, setFormOpen] = useState(false);
  const [editData, setEditData] = useState<LemburDetail | null>(null);
  const [deleteData, setDeleteData] = useState<LemburDetail | null>(null);
  const [exportOpen, setExportOpen] = useState(false);

  const handleSubmit = async (payload: Record<string, unknown>) => {
    try {
      if (editData) {
        await updateMutation.mutateAsync({ id: editData.id, payload });
      } else {
        await insertMutation.mutateAsync(payload);
      }
      setFormOpen(false);
      setEditData(null);
    } catch {
      // Handled by mutation onError toast
    }
  };

  const handleDelete = async () => {
    if (deleteData) {
      await deleteMutation.mutateAsync(deleteData.id);
      setDeleteData(null);
    }
  };

  const handleExport = async (bulan: number, tahun: number) => {
    // Fetch data for the selected month
    const startDate = `${tahun}-${String(bulan).padStart(2, "0")}-01`;
    const endMonth = bulan === 12 ? 1 : bulan + 1;
    const endYear = bulan === 12 ? tahun + 1 : tahun;
    const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

    const { data, error } = await supabase
      .from("v_lembur_detail")
      .select("*")
      .gte("tanggal", startDate)
      .lt("tanggal", endDate)
      .order("tanggal", { ascending: true });

    if (error) {
      toast.error("Gagal mengambil data lembur untuk ekspor", {
        description: error.message,
      });
      return;
    }

    if (!data || data.length === 0) {
      toast.warning("Tidak ada data lembur", {
        description: `Tidak ada data lembur untuk bulan yang dipilih.`,
      });
      return;
    }

    exportLemburToExcel({
      data: data as LemburDetail[],
      bulan,
      tahun,
    });

    toast.success("File berhasil diunduh", {
      description: `Data lembur bulan ${bulan}/${tahun} telah diekspor.`,
    });
  };

  // Format currency
  const formatCurrency = (val: number | null) => {
    if (val == null) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const columns: ColumnDef<LemburDetail>[] = [
    {
      key: "tanggal",
      header: "Tanggal",
      sortable: true,
      className: "w-[110px]",
      render: (val) => formatDate(val as string),
    },
    {
      key: "nama",
      header: "Pegawai",
      sortable: true,
      render: (val, row) => (
        <div className="flex flex-col">
          <span className="font-medium">{val as string || "-"}</span>
          <span className="text-xs text-muted-foreground">{row.nip}</span>
        </div>
      ),
    },
    {
      key: "jabatan",
      header: "Jabatan",
      sortable: true,
      className: "hidden md:table-cell",
      render: (val) => (val as string) || "-",
    },
    {
      key: "waktu_mulai",
      header: "Mulai",
      className: "w-[80px]",
      render: (val) => {
        const t = val as string;
        return t ? t.slice(0, 5) : "-";
      },
    },
    {
      key: "waktu_selesai",
      header: "Selesai",
      className: "w-[80px]",
      render: (val) => {
        const t = val as string;
        return t ? t.slice(0, 5) : "-";
      },
    },
    {
      key: "keterangan",
      header: "Keterangan",
      className: "hidden lg:table-cell max-w-[300px]",
      render: (val) => (
        <span className="line-clamp-2 text-sm">{(val as string) || "-"}</span>
      ),
    },
    {
      key: "estimasi_biaya",
      header: "Estimasi Biaya",
      className: "hidden xl:table-cell w-[140px] text-right",
      sortable: true,
      render: (val) => (
        <span className="tabular-nums">
          {formatCurrency(val as number | null)}
        </span>
      ),
    },
    {
      key: "_actions",
      header: "",
      className: "w-[80px] text-right",
      render: (_, row) => (
        <div
          className="flex items-center justify-end gap-1"
          onClick={(e) => e.stopPropagation()}
        >
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => {
              setEditData(row);
              setFormOpen(true);
            }}
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

  return (
    <div className="p-4 lg:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Lembur</h1>
            <span className="text-sm text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md">
              {allData.length} data
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Catatan lembur pegawai — terintegrasi dengan data pegawai
          </p>
        </div>

        <Button
          variant="outline"
          className="gap-2 self-start"
          onClick={() => setExportOpen(true)}
        >
          <FileDown className="w-4 h-4" />
          Ekspor Bulanan
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={allData}
        loading={isLoading}
        searchPlaceholder="Cari NIP, nama, keterangan..."
        searchKeys={["nip", "nama", "keterangan", "jabatan"]}
        onAdd={() => {
          setEditData(null);
          setFormOpen(true);
        }}
        addLabel="Tambah Lembur"
        onRowClick={(row) => {
          setEditData(row);
          setFormOpen(true);
        }}
      />

      <LemburFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditData(null);
        }}
        initialData={editData}
        onSubmit={handleSubmit}
        loading={insertMutation.isPending || updateMutation.isPending}
      />

      <DeleteDialog
        open={!!deleteData}
        onOpenChange={(open) => !open && setDeleteData(null)}
        title="Hapus Data Lembur"
        description={`Apakah Anda yakin ingin menghapus data lembur ${deleteData?.nama || deleteData?.nip} tanggal ${deleteData?.tanggal ? formatDate(deleteData.tanggal) : ""}? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={handleDelete}
        loading={deleteMutation.isPending}
      />

      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        onExport={handleExport}
      />
    </div>
  );
}
