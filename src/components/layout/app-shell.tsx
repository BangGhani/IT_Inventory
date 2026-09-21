"use client";

import { Sidebar } from "./sidebar";
import { MobileNav } from "./mobile-nav";
import { Header } from "./header";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UpcomingExpiration } from "@/lib/types/database";
import { GlobalSearch } from "@/components/search/global-search";
import { ExpiryPanel } from "@/components/notifications/expiry-alert";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [expiryOpen, setExpiryOpen] = useState(false);
  const [expirations, setExpirations] = useState<UpcomingExpiration[]>([]);

  useEffect(() => {
    const fetchExpirations = async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("get_upcoming_expirations", {
        days_ahead: 30,
      });
      if (data) setExpirations(data as UpcomingExpiration[]);
    };
    fetchExpirations();
  }, []);

  // Keyboard shortcut: Ctrl+K for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Header
          onSearchOpen={() => setSearchOpen(true)}
          expiringCount={expirations.length}
          onExpiringClick={() => setExpiryOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">
          <div className="animate-fade-in">{children}</div>
          <MobileNav />
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />

      {/* Expiry Notifications Panel */}
      <ExpiryPanel
        open={expiryOpen}
        onOpenChange={setExpiryOpen}
        expirations={expirations}
      />
    </div>
  );
}
