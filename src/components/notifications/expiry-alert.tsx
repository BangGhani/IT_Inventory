"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, Clock } from "lucide-react";
import type { UpcomingExpiration } from "@/lib/types/database";
import { formatDate } from "@/lib/utils";

interface ExpiryPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  expirations: UpcomingExpiration[];
}

export function ExpiryPanel({ open, onOpenChange, expirations }: ExpiryPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[380px] sm:w-[420px] p-0">
        <SheetHeader className="px-5 pt-5 pb-3 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" />
            Akun Segera Expired
            {expirations.length > 0 && (
              <Badge variant="destructive" className="ml-auto">
                {expirations.length}
              </Badge>
            )}
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-100px)]">
          {expirations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Clock className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">Tidak ada akun yang segera expired</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-4">
              {expirations.map((exp, idx) => (
                <div
                  key={`${exp.sumber}-${exp.identitas}-${idx}`}
                  className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full shrink-0 text-xs font-bold ${
                      exp.sisa_hari <= 7
                        ? "bg-destructive/15 text-destructive"
                        : exp.sisa_hari <= 14
                        ? "bg-yellow-500/15 text-yellow-600 dark:text-yellow-400"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {exp.sisa_hari}
                  </div>
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <span className="text-sm font-medium truncate">
                      {exp.identitas}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-[10px] uppercase tracking-wider"
                      >
                        {exp.sumber}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(exp.tanggal_akhir)}
                      </span>
                    </div>
                    {exp.keterangan && (
                      <span className="text-xs text-muted-foreground truncate">
                        {exp.keterangan}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
