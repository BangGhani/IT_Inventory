"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

function formatDbError(error: unknown): Error {
  if (!error) return new Error("Terjadi kesalahan pada database");
  if (error instanceof Error) return error;

  const errObj = error as { code?: string; message?: string; details?: string };
  let msg = errObj.message || "Terjadi kesalahan pada database";

  if (errObj.code === "22P02" && (msg.includes("macaddr") || msg.toLowerCase().includes("mac"))) {
    msg = "Format MAC Address tidak valid. Harus hexadecimal (contoh: 00:1A:2B:3C:4D:5E)";
  } else if (errObj.code === "22P02" && (msg.includes("inet") || msg.toLowerCase().includes("ip"))) {
    msg = "Format IP Address tidak valid (contoh: 192.168.1.100)";
  } else if (errObj.code === "23505") {
    if (msg.includes("edc_mid_tid_key")) {
      msg = "Kombinasi MID dan TID EDC sudah terdaftar di database (duplikat).";
    } else {
      msg = "Data dengan nilai tersebut sudah ada di sistem (duplikat).";
    }
  } else if (errObj.code === "23503") {
    if (msg.includes("edc_pic_nip_fkey") || msg.includes("pic_nip")) {
      msg = "NIP Pegawai pada kolom PIC tidak ditemukan di master Data Pegawai. Pastikan pegawai sudah terdaftar di menu Pegawai atau kosongkan jika bukan pegawai.";
    } else if (msg.includes("nip_pengguna")) {
      msg = "NIP Pengguna tidak ditemukan di Data Pegawai. Pastikan pegawai sudah terdaftar.";
    } else if (msg.includes("nip_pemegang") || msg.includes("pemegang_nip")) {
      msg = "NIP Pemegang tidak ditemukan di Data Pegawai. Pastikan pegawai sudah terdaftar.";
    } else {
      msg = "Data relasi (NIP/ID) tidak ditemukan di database. Pastikan data master sudah terdaftar.";
    }
  }

  const result = new Error(msg);
  (result as unknown as { code?: string }).code = errObj.code;
  return result;
}

interface UseCrudOptions {
  table: string;
  primaryKey?: string;
  orderBy?: string;
  orderAsc?: boolean;
  select?: string;
}

export function useCrud<T>({
  table,
  primaryKey = "id",
  orderBy = "created_at",
  orderAsc = false,
  select = "*",
}: UseCrudOptions) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const queryKey = [table];

  // Fetch all
  const query = useQuery<T[]>({
    queryKey,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(table)
        .select(select)
        .order(orderBy, { ascending: orderAsc });
      if (error) throw formatDbError(error);
      return data as T[];
    },
  });

  // Insert
  const insertMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from(table)
        .insert(payload)
        .select()
        .single();
      if (error) throw formatDbError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Data berhasil ditambahkan");
    },
    onError: (error) => {
      toast.error("Gagal menambahkan data", {
        description: error.message,
      });
    },
  });

  // Update
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from(table)
        .update(payload)
        .eq(primaryKey, id)
        .select()
        .single();
      if (error) throw formatDbError(error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Data berhasil diperbarui");
    },
    onError: (error) => {
      toast.error("Gagal memperbarui data", {
        description: error.message,
      });
    },
  });

  // Delete
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq(primaryKey, id);
      if (error) throw formatDbError(error);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast.success("Data berhasil dihapus");
    },
    onError: (error) => {
      toast.error("Gagal menghapus data", {
        description: error.message,
      });
    },
  });

  // Bulk Insert
  const bulkInsertMutation = useMutation({
    mutationFn: async (payloads: Record<string, unknown>[]) => {
      const { data, error } = await supabase
        .from(table)
        .insert(payloads)
        .select();
      if (error) throw formatDbError(error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey });
      const count = Array.isArray(data) ? data.length : "Beberapa";
      toast.success(`${count} data berhasil diimport`);
    },
    onError: (error) => {
      toast.error("Gagal mengimport data", {
        description: error.message,
      });
    },
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    refetch: query.refetch,
    insert: insertMutation.mutateAsync,
    bulkInsert: bulkInsertMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    remove: deleteMutation.mutateAsync,
    isInserting: insertMutation.isPending,
    isBulkInserting: bulkInsertMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
