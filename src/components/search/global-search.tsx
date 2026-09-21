"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Monitor, Printer, Landmark, CreditCard, Wifi } from "lucide-react";
import type { SearchResult } from "@/lib/types/database";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  pc: Monitor,
  printer: Printer,
  atm: Landmark,
  edc: CreditCard,
  wifi: Wifi,
};

const routeMap: Record<string, string> = {
  pc: "/pc",
  printer: "/printer",
  atm: "/atm",
  edc: "/edc",
  wifi: "/wifi",
};

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GlobalSearch({ open, onOpenChange }: GlobalSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async (keyword: string) => {
    if (keyword.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { data } = await supabase.rpc("search_inventory", { keyword });
    setResults((data as SearchResult[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => search(query), 300);
    return () => clearTimeout(timer);
  }, [query, search]);

  // Reset when closed without cascading renders
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (!open) {
      setQuery("");
      setResults([]);
    }
  }

  const handleSelect = (result: SearchResult) => {
    const route = routeMap[result.sumber];
    if (route) {
      router.push(`${route}/${result.id}`);
      onOpenChange(false);
    }
  };

  // Group results by sumber
  const grouped = results.reduce<Record<string, SearchResult[]>>(
    (acc, item) => {
      if (!acc[item.sumber]) acc[item.sumber] = [];
      acc[item.sumber].push(item);
      return acc;
    },
    {}
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Cari inventaris... (hostname, merk, SN, SSID)"
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>
          {loading
            ? "Mencari..."
            : query.length < 2
            ? "Ketik minimal 2 karakter"
            : "Tidak ditemukan"}
        </CommandEmpty>
        {Object.entries(grouped).map(([sumber, items]) => {
          const Icon = iconMap[sumber] || Monitor;
          return (
            <CommandGroup
              key={sumber}
              heading={sumber.toUpperCase()}
            >
              {items.map((item) => (
                <CommandItem
                  key={`${item.sumber}-${item.id}`}
                  onSelect={() => handleSelect(item)}
                  className="cursor-pointer"
                >
                  <Icon className="w-4 h-4 mr-2 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span className="text-sm">{item.judul}</span>
                    {item.keterangan && (
                      <span className="text-xs text-muted-foreground truncate max-w-[300px]">
                        {item.keterangan}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
