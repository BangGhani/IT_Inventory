"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, AlertCircle, ChevronDown } from "lucide-react";

export interface FieldConfig {
  key: string;
  label: string;
  type:
    | "text"
    | "number"
    | "email"
    | "date"
    | "textarea"
    | "select"
    | "boolean"
    | "password";
  placeholder?: string;
  required?: boolean;
  options?: { label: string; value: string }[];
  disabled?: boolean;
  defaultValue?: unknown;
  colSpan?: 1 | 2;
  helperText?: string;
}

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fields: FieldConfig[];
  initialData?: Record<string, unknown> | object | null;
  onSubmit: (data: Record<string, unknown>) => Promise<void>;
  loading?: boolean;
}

function getDefaultFormData(
  fields: FieldConfig[],
  initialData?: Record<string, unknown> | object | null
): Record<string, unknown> {
  const defaults: Record<string, unknown> = {};
  const init = initialData as Record<string, unknown> | undefined | null;
  fields.forEach((f) => {
    if (init && init[f.key] !== undefined && init[f.key] !== null) {
      defaults[f.key] = init[f.key];
    } else if (f.defaultValue !== undefined) {
      defaults[f.key] = f.defaultValue;
    } else {
      defaults[f.key] = f.type === "boolean" ? false : "";
    }
  });
  return defaults;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  fields,
  initialData,
  onSubmit,
  loading = false,
}: FormDialogProps) {
  const [prevOpen, setPrevOpen] = useState(open);
  const [prevInitialData, setPrevInitialData] = useState(initialData);

  const [formData, setFormData] = useState<Record<string, unknown>>(() =>
    getDefaultFormData(fields, initialData)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync / reset form data when dialog is opened or initialData changes without cascading renders
  if (open !== prevOpen || initialData !== prevInitialData) {
    setPrevOpen(open);
    setPrevInitialData(initialData);
    if (open) {
      setFormData(getDefaultFormData(fields, initialData));
      setErrors({});
      setSubmitError(null);
    }
  }

  const handleChange = (key: string, value: unknown) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    // Clear field-level error on change
    if (errors[key]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[key];
        return copy;
      });
    }
    if (submitError) setSubmitError(null);
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    fields.forEach((f) => {
      const val = formData[f.key];
      const strVal = val != null ? String(val).trim() : "";

      if (f.required && !strVal && f.type !== "boolean") {
        newErrors[f.key] = `${f.label} wajib diisi`;
      }

      // MAC address validation (PostgreSQL macaddr type requires hex characters 0-9, A-F)
      if (f.key === "mac_address" && strVal) {
        const macRegex = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$|^[0-9A-Fa-f]{12}$/;
        if (!macRegex.test(strVal)) {
          newErrors[f.key] =
            "Format MAC Address harus hexadecimal (0-9, A-F). Contoh: 00:1A:2B:3C:4D:5E";
        }
      }

      // IP Address & Gateway validation (PostgreSQL inet type)
      if ((f.key === "ip" || f.key === "gateway" || f.key === "ip_address" || f.key === "ip_komputer") && strVal) {
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)(?:\/(?:[0-9]|[1-2][0-9]|3[0-2]))?$/;
        if (!ipRegex.test(strVal)) {
          newErrors[f.key] = "Format IP Address tidak valid. Contoh: 192.168.1.100";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!validate()) {
      return;
    }

    // Clean up empty strings to null for optional fields and parse numbers
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(formData)) {
      const field = fields.find((f) => f.key === key);
      if (value === "" || value === undefined) {
        cleaned[key] = null;
      } else if (field?.type === "number" && value !== null) {
        cleaned[key] = Number(value);
      } else if (typeof value === "string") {
        cleaned[key] = value.trim() === "" ? null : value.trim();
      } else {
        cleaned[key] = value;
      }
    }

    setIsSubmitting(true);
    try {
      await onSubmit(cleaned);
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : typeof err === "object" && err && "message" in err
          ? String((err as { message: unknown }).message)
          : "Gagal menyimpan data ke database";
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isBusy = loading || isSubmitting;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 flex flex-col overflow-hidden border border-border shadow-2xl">
        {/* Header */}
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-border/60 shrink-0 bg-muted/20">
          <DialogTitle className="text-lg font-bold tracking-tight">
            {title}
          </DialogTitle>
        </DialogHeader>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 max-h-[65vh]">
            {/* Error Banner */}
            {submitError && (
              <div className="flex items-start gap-2.5 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm animate-fade-in">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <span className="font-semibold block text-xs uppercase tracking-wider mb-0.5">
                    Gagal Menyimpan Data
                  </span>
                  <span>{submitError}</span>
                </div>
              </div>
            )}

            {/* Grid Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
              {fields.map((field) => {
                const isFullWidth =
                  field.colSpan === 2 ||
                  field.type === "textarea" ||
                  field.type === "boolean" ||
                  field.key === "keterangan" ||
                  field.key === "rekomendasi" ||
                  field.key === "tanggapan" ||
                  field.key === "url";

                const fieldError = errors[field.key];

                return (
                  <div
                    key={field.key}
                    className={`flex flex-col gap-1.5 ${
                      isFullWidth ? "sm:col-span-2" : ""
                    }`}
                  >
                    <Label
                      htmlFor={field.key}
                      className="text-xs font-semibold text-foreground/80 flex items-center justify-between"
                    >
                      <span>
                        {field.label}
                        {field.required && (
                          <span className="text-destructive ml-1">*</span>
                        )}
                      </span>
                    </Label>

                    {field.type === "textarea" ? (
                      <Textarea
                        id={field.key}
                        placeholder={field.placeholder}
                        value={String(formData[field.key] ?? "")}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        required={field.required}
                        disabled={field.disabled || isBusy}
                        rows={3}
                        className={`text-sm ${
                          fieldError ? "border-destructive focus-visible:ring-destructive/30" : ""
                        }`}
                      />
                    ) : field.type === "select" ? (
                      <div className="relative">
                        <select
                          id={field.key}
                          value={String(formData[field.key] ?? "")}
                          onChange={(e) => handleChange(field.key, e.target.value)}
                          disabled={field.disabled || isBusy}
                          required={field.required}
                          className={`flex h-9 w-full appearance-none items-center justify-between rounded-lg border bg-background px-3 py-1.5 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 text-foreground cursor-pointer ${
                            fieldError
                              ? "border-destructive focus-visible:ring-destructive/30"
                              : "border-input"
                          }`}
                        >
                          <option value="" className="text-muted-foreground">
                            {field.placeholder || `-- Pilih ${field.label} --`}
                          </option>
                          {field.options?.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-70" />
                      </div>
                    ) : field.type === "boolean" ? (
                      <div className="flex items-center gap-3 p-2.5 rounded-lg border border-input/60 bg-muted/20">
                        <Switch
                          id={field.key}
                          checked={Boolean(formData[field.key])}
                          onCheckedChange={(v) => handleChange(field.key, v)}
                          disabled={field.disabled || isBusy}
                        />
                        <label
                          htmlFor={field.key}
                          className="text-sm font-medium cursor-pointer select-none"
                        >
                          {formData[field.key] ? "Ya / Aktif" : "Tidak / Non-Aktif"}
                        </label>
                      </div>
                    ) : (
                      <Input
                        id={field.key}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={String(formData[field.key] ?? "")}
                        onChange={(e) => handleChange(field.key, e.target.value)}
                        required={field.required}
                        disabled={field.disabled || isBusy}
                        className={`h-9 text-sm ${
                          fieldError ? "border-destructive focus-visible:ring-destructive/30" : ""
                        }`}
                      />
                    )}

                    {/* Inline Field Error */}
                    {fieldError ? (
                      <span className="text-[11px] font-medium text-destructive mt-0.5">
                        {fieldError}
                      </span>
                    ) : field.helperText ? (
                      <span className="text-[11px] text-muted-foreground">
                        {field.helperText}
                      </span>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky Footer */}
          <DialogFooter className="px-6 py-3.5 border-t border-border/60 bg-muted/20 shrink-0 flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isBusy}
            >
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={isBusy}>
              {isBusy ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                "Simpan"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
