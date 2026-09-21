"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { ImportDialog } from "@/components/forms/import-dialog";
import type { FieldConfig } from "@/components/forms/form-dialog";
import {
  exportToExcel,
  exportToCsv,
  type ExportColumn,
} from "@/lib/export-utils";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  ChevronDown,
} from "lucide-react";

export interface ColumnDef<T> {
  key: string;
  header: string;
  render?: (value: unknown, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  loading?: boolean;
  searchPlaceholder?: string;
  searchKeys?: string[];
  onAdd?: () => void;
  onRowClick?: (row: T) => void;
  addLabel?: string;
  pageSize?: number;
  emptyMessage?: string;
  exportFilename?: string;
  exportSheetName?: string;
  fields?: FieldConfig[];
  onImport?: (records: Record<string, unknown>[]) => Promise<unknown>;
  importTitle?: string;
  extraActions?: React.ReactNode;
}

export function DataTable<T extends object = Record<string, unknown>>({
  columns,
  data,
  loading = false,
  searchPlaceholder = "Cari...",
  searchKeys = [],
  onAdd,
  onRowClick,
  addLabel = "Tambah",
  pageSize = 15,
  emptyMessage = "Belum ada data",
  exportFilename,
  exportSheetName,
  fields,
  onImport,
  importTitle,
  extraActions,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [importOpen, setImportOpen] = useState(false);

  const exportCols: ExportColumn[] = useMemo(() => {
    if (fields && fields.length > 0) {
      return fields.map((f) => ({ key: f.key, label: f.label }));
    }
    return columns
      .filter((c) => c.key !== "_actions")
      .map((c) => ({ key: c.key, label: c.header }));
  }, [fields, columns]);

  // Filter
  const filtered = useMemo(() => {
    if (!search.trim() || searchKeys.length === 0) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      searchKeys.some((key) => {
        const val = (row as Record<string, unknown>)[key];
        return val != null && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, searchKeys]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = (a as Record<string, unknown>)[sortKey];
      const bVal = (b as Record<string, unknown>)[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), "id", {
        numeric: true,
      });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  // Paginate
  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={searchPlaceholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9 h-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap ml-auto">
          {extraActions}

          {/* Export Dropdown */}
          {exportFilename && (
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex items-center justify-center gap-1.5 rounded-md text-sm font-medium transition-colors border border-border bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3 py-2 cursor-pointer shadow-xs">
                <Download className="w-4 h-4 text-muted-foreground" />
                <span className="hidden sm:inline">Export</span>
                <ChevronDown className="w-3.5 h-3.5 opacity-60 ml-0.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-44">
                <DropdownMenuItem
                  onClick={() =>
                    exportToExcel({
                      filename: exportFilename,
                      sheetName: exportSheetName || "Data",
                      data: (sorted as unknown as Record<string, unknown>[]),
                      columns: exportCols,
                    })
                  }
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Excel (.xlsx)</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() =>
                    exportToCsv({
                      filename: exportFilename,
                      data: (sorted as unknown as Record<string, unknown>[]),
                      columns: exportCols,
                    })
                  }
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                  <span>CSV (.csv)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Import Button */}
          {onImport && fields && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 shadow-xs"
              onClick={() => setImportOpen(true)}
            >
              <Upload className="w-4 h-4 text-muted-foreground" />
              <span className="hidden sm:inline">Import</span>
            </Button>
          )}

          {/* Add Button */}
          {onAdd && (
            <Button onClick={onAdd} size="sm" className="h-9 gap-1.5 shadow-xs">
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{addLabel}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                {columns.map((col) => (
                  <TableHead
                    key={col.key}
                    className={`text-xs font-semibold uppercase tracking-wider ${
                      col.hideOnMobile ? "hidden md:table-cell" : ""
                    } ${col.className || ""}`}
                  >
                    {col.sortable ? (
                      <button
                        onClick={() => handleSort(col.key)}
                        className="flex items-center gap-1 hover:text-foreground transition-colors"
                      >
                        {col.header}
                        {sortKey === col.key ? (
                          sortDir === "asc" ? (
                            <ArrowUp className="w-3 h-3" />
                          ) : (
                            <ArrowDown className="w-3 h-3" />
                          )
                        ) : (
                          <ArrowUpDown className="w-3 h-3 opacity-30" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={
                          col.hideOnMobile ? "hidden md:table-cell" : ""
                        }
                      >
                        <Skeleton className="h-4 w-full max-w-[120px]" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : paginated.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="text-center py-10 text-muted-foreground"
                  >
                    {emptyMessage}
                  </TableCell>
                </TableRow>
              ) : (
                paginated.map((row, idx) => (
                  <TableRow
                    key={idx}
                    onClick={() => onRowClick?.(row)}
                    className={
                      onRowClick
                        ? "cursor-pointer hover:bg-muted/50 transition-colors"
                        : ""
                    }
                  >
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={`text-sm ${
                          col.hideOnMobile ? "hidden md:table-cell" : ""
                        } ${col.className || ""}`}
                      >
                        {col.render
                          ? col.render((row as Record<string, unknown>)[col.key], row)
                          : (row as Record<string, unknown>)[col.key] != null
                          ? String((row as Record<string, unknown>)[col.key])
                          : "-"}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground text-xs">
            {sorted.length} data
            {search && ` (difilter dari ${data.length})`}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="px-2 text-xs text-muted-foreground tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page + 1)}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {onImport && fields && (
        <ImportDialog
          open={importOpen}
          onOpenChange={setImportOpen}
          title={importTitle || `Import ${addLabel.replace(/^Tambah\s+/, "")}`}
          fields={fields}
          filename={exportFilename || "Data"}
          onImport={onImport}
        />
      )}
    </div>
  );
}
