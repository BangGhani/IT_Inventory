import * as XLSX from "xlsx";
import type { FieldConfig } from "@/components/forms/form-dialog";

export interface ExportColumn {
  key: string;
  label: string;
}

/**
 * Format records for export by mapping internal keys to human-friendly labels,
 * converting boolean to "Ya"/"Tidak", and formatting null/undefined as empty strings.
 */
function prepareDataForExport(
  data: Record<string, unknown>[],
  columns?: ExportColumn[]
): Record<string, unknown>[] {
  return data.map((row) => {
    const formattedRow: Record<string, unknown> = {};

    if (columns && columns.length > 0) {
      columns.forEach((col) => {
        const val = row[col.key];
        if (typeof val === "boolean") {
          formattedRow[col.label] = val ? "Ya" : "Tidak";
        } else if (val === null || val === undefined) {
          formattedRow[col.label] = "";
        } else {
          formattedRow[col.label] = val;
        }
      });
    } else {
      // If no columns specified, export all non-internal keys
      Object.entries(row).forEach(([k, val]) => {
        if (k.startsWith("_")) return;
        if (typeof val === "boolean") {
          formattedRow[k] = val ? "Ya" : "Tidak";
        } else if (val === null || val === undefined) {
          formattedRow[k] = "";
        } else {
          formattedRow[k] = val;
        }
      });
    }

    return formattedRow;
  });
}

/**
 * Calculate auto-fitted column widths for a worksheet.
 */
function autoFitColumns(rows: Record<string, unknown>[]): { wch: number }[] {
  if (rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((key) => {
    let maxLen = key.length;
    rows.forEach((row) => {
      const val = row[key];
      const strVal = val != null ? String(val) : "";
      if (strVal.length > maxLen) {
        maxLen = strVal.length;
      }
    });
    // Add padding and cap width to 50
    return { wch: Math.min(Math.max(maxLen + 3, 10), 50) };
  });
}

/**
 * Export data to an Excel (.xlsx) file
 */
export function exportToExcel(options: {
  filename: string;
  sheetName?: string;
  data: Record<string, unknown>[];
  columns?: ExportColumn[];
}) {
  const { filename, sheetName = "Data", data, columns } = options;
  const formattedRows = prepareDataForExport(data, columns);
  const worksheet = XLSX.utils.json_to_sheet(formattedRows);

  // Set column widths
  worksheet["!cols"] = autoFitColumns(formattedRows);

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName.slice(0, 31));

  const validFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, validFilename);
}

/**
 * Export data to a CSV (.csv) file with UTF-8 BOM
 */
export function exportToCsv(options: {
  filename: string;
  data: Record<string, unknown>[];
  columns?: ExportColumn[];
}) {
  const { filename, data, columns } = options;
  const formattedRows = prepareDataForExport(data, columns);
  const worksheet = XLSX.utils.json_to_sheet(formattedRows);
  const csvContent = XLSX.utils.sheet_to_csv(worksheet);

  // Add UTF-8 BOM (\uFEFF) so Excel opens CSV without character encoding glitches
  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".csv") ? filename : `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export multiple sheets into a single Excel (.xlsx) file (e.g. for Dashboard Master Export)
 */
export interface MultiSheetExportItem {
  sheetName: string;
  data: Record<string, unknown>[];
  columns?: ExportColumn[];
}

export function exportAllToMultiSheetExcel(options: {
  filename: string;
  sheets: MultiSheetExportItem[];
}) {
  const { filename, sheets } = options;
  const workbook = XLSX.utils.book_new();

  sheets.forEach((item) => {
    const formattedRows = prepareDataForExport(item.data, item.columns);
    const worksheet = XLSX.utils.json_to_sheet(formattedRows);
    worksheet["!cols"] = autoFitColumns(formattedRows);
    // Excel sheet name max length is 31 characters
    const cleanSheetName = item.sheetName.replace(/[:\\/?*\[\]]/g, " ").slice(0, 31);
    XLSX.utils.book_append_sheet(workbook, worksheet, cleanSheetName);
  });

  const validFilename = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, validFilename);
}

/**
 * Parse an uploaded Excel (.xlsx, .xls) or CSV file for importing.
 */
export interface ParseImportResult {
  validRows: Record<string, unknown>[];
  invalidRows: { rowNumber: number; data: Record<string, unknown>; errors: string[] }[];
  totalRows: number;
}

export async function parseImportFile(
  file: File,
  fields: FieldConfig[]
): Promise<ParseImportResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });

  const firstSheetName = workbook.SheetNames[0];
  if (!firstSheetName) {
    throw new Error("File kosong atau tidak memiliki lembar kerja (sheet).");
  }

  const worksheet = workbook.Sheets[firstSheetName];
  // Convert sheet to array of raw objects
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
    defval: "",
  });

  if (rawRows.length === 0) {
    throw new Error("File tidak memiliki baris data untuk diimpor.");
  }

  // Create lookup maps for fuzzy matching columns
  // Users might upload headers matching field.label, field.key, or slight variations
  const fieldLookup = new Map<string, FieldConfig>();
  fields.forEach((f) => {
    fieldLookup.set(f.key.toLowerCase().trim(), f);
    fieldLookup.set(f.label.toLowerCase().trim(), f);
    // Common aliases (e.g. without spaces, dashes, or underscores)
    fieldLookup.set(f.key.replace(/_/g, "").toLowerCase(), f);
    fieldLookup.set(f.label.replace(/\s+/g, "").toLowerCase(), f);
  });

  const validRows: Record<string, unknown>[] = [];
  const invalidRows: { rowNumber: number; data: Record<string, unknown>; errors: string[] }[] = [];

  rawRows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // +2 considering 1-based index and header row at row 1
    const mappedRow: Record<string, unknown> = {};
    const rowErrors: string[] = [];

    // Map each raw column to the appropriate FieldConfig
    Object.entries(rawRow).forEach(([rawHeader, rawVal]) => {
      const normalizedHeader = String(rawHeader).toLowerCase().trim();
      const matchedField =
        fieldLookup.get(normalizedHeader) ||
        fieldLookup.get(normalizedHeader.replace(/\s+/g, "")) ||
        fieldLookup.get(normalizedHeader.replace(/_/g, ""));

      if (matchedField) {
        let parsedVal: unknown = rawVal;

        if (typeof rawVal === "string") {
          const trimmed = rawVal.trim();
          if (trimmed === "") {
            parsedVal = null;
          } else {
            parsedVal = trimmed;
          }
        }

        // Type transformations
        if (matchedField.type === "number") {
          if (parsedVal !== null && parsedVal !== "") {
            const num = Number(parsedVal);
            if (isNaN(num)) {
              rowErrors.push(`${matchedField.label} harus berupa angka`);
            } else {
              parsedVal = num;
            }
          } else {
            parsedVal = null;
          }
        } else if (matchedField.type === "boolean") {
          if (typeof parsedVal === "boolean") {
            // Keep boolean
          } else if (parsedVal != null) {
            const strVal = String(parsedVal).toLowerCase().trim();
            parsedVal = ["ya", "yes", "true", "1", "ok", "perlu"].includes(strVal);
          } else {
            parsedVal = false;
          }
        }

        mappedRow[matchedField.key] = parsedVal;
      }
    });

    // Check required fields
    fields.forEach((f) => {
      if (f.required) {
        const val = mappedRow[f.key];
        if (val === null || val === undefined || val === "") {
          rowErrors.push(`${f.label} wajib diisi`);
        }
      }
    });

    if (rowErrors.length > 0) {
      invalidRows.push({ rowNumber, data: rawRow, errors: rowErrors });
    } else {
      validRows.push(mappedRow);
    }
  });

  return {
    validRows,
    invalidRows,
    totalRows: rawRows.length,
  };
}

/**
 * Generate and download an empty template file (Excel or CSV) with example data
 */
export function downloadTemplate(options: {
  filename: string;
  fields: FieldConfig[];
  format: "xlsx" | "csv";
}) {
  const { filename, fields, format } = options;

  // Header row + 1 sample row
  const headerRow: Record<string, unknown> = {};
  const sampleRow: Record<string, unknown> = {};

  fields.forEach((f) => {
    // Label as column title
    const colName = f.label;
    headerRow[colName] = "";

    // Generate meaningful sample values based on field type
    if (f.type === "boolean") {
      sampleRow[colName] = "Tidak";
    } else if (f.type === "number") {
      sampleRow[colName] = f.placeholder && !isNaN(Number(f.placeholder)) ? Number(f.placeholder) : 0;
    } else if (f.type === "date") {
      sampleRow[colName] = "2026-01-15";
    } else if (f.type === "select" && f.options && f.options.length > 0) {
      sampleRow[colName] = f.options[0].label;
    } else {
      sampleRow[colName] = f.placeholder || `Contoh ${f.label}`;
    }
  });

  const worksheet = XLSX.utils.json_to_sheet([sampleRow], {
    header: Object.keys(headerRow),
  });
  worksheet["!cols"] = autoFitColumns([sampleRow]);

  if (format === "xlsx") {
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Template");
    XLSX.writeFile(workbook, `${filename}_Template.xlsx`);
  } else {
    const csvContent = XLSX.utils.sheet_to_csv(worksheet);
    const blob = new Blob(["\uFEFF" + csvContent], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_Template.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
