"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Upload,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Download,
  Loader2,
  X,
} from "lucide-react";
import type { FieldConfig } from "./form-dialog";
import {
  parseImportFile,
  downloadTemplate,
  type ParseImportResult,
} from "@/lib/export-utils";

interface ImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldConfig[];
  filename: string;
  onImport: (records: Record<string, unknown>[]) => Promise<unknown>;
}

export function ImportDialog({
  open,
  onOpenChange,
  title,
  fields,
  filename,
  onImport,
}: ImportDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [parseResult, setParseResult] = useState<ParseImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reset when dialog closes
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setSelectedFile(null);
      setParseResult(null);
      setErrorMessage(null);
      setIsParsing(false);
      setIsSubmitting(false);
    }
  }

  const handleClose = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    setSelectedFile(null);
    setParseResult(null);
    setErrorMessage(null);
    onOpenChange(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    await processFile(file);
  };

  const processFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["xlsx", "xls", "csv"].includes(ext || "")) {
      setErrorMessage("Format file tidak didukung. Harap unggah file .xlsx, .xls, atau .csv.");
      return;
    }

    setSelectedFile(file);
    setIsParsing(true);
    setErrorMessage(null);
    setParseResult(null);

    try {
      const result = await parseImportFile(file, fields);
      setParseResult(result);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membaca file.";
      setErrorMessage(msg);
      setSelectedFile(null);
    } finally {
      setIsParsing(false);
    }
  };

  const handleConfirmImport = async () => {
    if (!parseResult || parseResult.validRows.length === 0) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onImport(parseResult.validRows);
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengimpor data.";
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearSelectedFile = () => {
    setSelectedFile(null);
    setParseResult(null);
    setErrorMessage(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) handleClose();
        else onOpenChange(true);
      }}
    >
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden border border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/60 shrink-0 bg-muted/20">
          <DialogTitle className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-[65vh]">
          {/* Template Download Section */}
          <div className="flex items-center justify-between p-3 rounded-lg border border-border/70 bg-muted/30 text-xs">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Download className="w-4 h-4 text-primary" />
              <span>Format belum siap? Unduh template data terlebih dahulu:</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => downloadTemplate({ filename, fields, format: "xlsx" })}
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Template Excel
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 text-xs gap-1"
                onClick={() => downloadTemplate({ filename, fields, format: "csv" })}
              >
                <FileText className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                Template CSV
              </Button>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span className="font-semibold block text-xs uppercase tracking-wider mb-0.5">
                  Terjadi Kesalahan
                </span>
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* File Dropzone / Selector */}
          {!selectedFile ? (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border/80 hover:border-primary/60 hover:bg-accent/20 rounded-xl p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-3"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                <Upload className="w-6 h-6" />
              </div>
              <div>
                <p className="font-medium text-sm">
                  Klik untuk memilih file atau seret file ke sini
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Mendukung file Excel (.xlsx, .xls) atau CSV (.csv)
                </p>
              </div>
            </div>
          ) : (
            <div className="p-3.5 rounded-lg border border-border bg-card flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold truncate max-w-sm">
                    {selectedFile.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
                onClick={clearSelectedFile}
                disabled={isSubmitting || isParsing}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Parsing Loading */}
          {isParsing && (
            <div className="flex items-center justify-center p-6 gap-2 text-sm text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Memproses dan memvalidasi file...</span>
            </div>
          )}

          {/* Parse Result Summary */}
          {parseResult && !isParsing && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div className="p-3 rounded-lg border border-border bg-muted/20 text-center">
                  <span className="text-xs text-muted-foreground block">Total Baris</span>
                  <span className="text-lg font-bold">{parseResult.totalRows}</span>
                </div>
                <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-center">
                  <span className="text-xs text-emerald-700 dark:text-emerald-400 block">
                    Siap Diimpor
                  </span>
                  <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                    {parseResult.validRows.length}
                  </span>
                </div>
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/10 text-center">
                  <span className="text-xs text-destructive block">Bermasalah</span>
                  <span className="text-lg font-bold text-destructive">
                    {parseResult.invalidRows.length}
                  </span>
                </div>
              </div>

              {/* Invalid Rows Warning */}
              {parseResult.invalidRows.length > 0 && (
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs space-y-1.5 max-h-32 overflow-y-auto">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    <span>Catatan baris yang dilewati karena tidak lengkap:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-muted-foreground dark:text-amber-300/80">
                    {parseResult.invalidRows.slice(0, 10).map((inv, idx) => (
                      <li key={idx}>
                        Baris {inv.rowNumber}: {inv.errors.join(", ")}
                      </li>
                    ))}
                    {parseResult.invalidRows.length > 10 && (
                      <li>...dan {parseResult.invalidRows.length - 10} baris lainnya</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Preview Table of Valid Rows (first 5 rows) */}
              {parseResult.validRows.length > 0 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Pratinjau Data (5 Baris Pertama)
                  </span>
                  <div className="border border-border rounded-lg overflow-x-auto max-h-40">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/50 border-b border-border text-muted-foreground font-semibold">
                        <tr>
                          {fields.slice(0, 6).map((f) => (
                            <th key={f.key} className="px-3 py-2 whitespace-nowrap">
                              {f.label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {parseResult.validRows.slice(0, 5).map((row, idx) => (
                          <tr key={idx} className="hover:bg-muted/30">
                            {fields.slice(0, 6).map((f) => (
                              <td key={f.key} className="px-3 py-1.5 whitespace-nowrap text-muted-foreground">
                                {String(row[f.key] ?? "-")}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-3 border-t border-border/60 bg-muted/20 shrink-0 flex items-center justify-between sm:justify-between">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleConfirmImport}
            disabled={
              !parseResult ||
              parseResult.validRows.length === 0 ||
              isSubmitting ||
              isParsing
            }
            className="gap-1.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengimpor...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Impor {parseResult?.validRows.length ? `${parseResult.validRows.length} Data` : "Data"}
                </span>
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
