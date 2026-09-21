"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Sun, Moon, LogOut, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { createClient } from "@/lib/supabase/client";

interface HeaderProps {
  onSearchOpen?: () => void;
  onMenuToggle?: () => void;
  expiringCount?: number;
  onExpiringClick?: () => void;
}

const emptySubscribe = () => () => {};

export function Header({ onSearchOpen, expiringCount = 0, onExpiringClick }: HeaderProps) {
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex items-center justify-between h-16 px-4 lg:px-6 border-b border-border bg-background/80 backdrop-blur-xl">
      {/* Left: Page title placeholder */}
      <div className="flex items-center gap-2 lg:hidden">
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <span className="text-xs font-bold">IT</span>
        </div>
      </div>
      <div className="hidden lg:block" />

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Search */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onSearchOpen}
          className="text-muted-foreground hover:text-foreground"
        >
          <Search className="w-[18px] h-[18px]" />
          <span className="sr-only">Cari</span>
        </Button>

        {/* Expiring notifications */}
        <Button
          variant="ghost"
          size="icon"
          onClick={onExpiringClick}
          className="text-muted-foreground hover:text-foreground relative"
        >
          <Bell className="w-[18px] h-[18px]" />
          {expiringCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground animate-pulse-dot">
              {expiringCount > 9 ? "9+" : expiringCount}
            </span>
          )}
          <span className="sr-only">Notifikasi</span>
        </Button>

        {/* Theme toggle */}
        {mounted && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-muted-foreground hover:text-foreground"
          >
            {theme === "dark" ? (
              <Sun className="w-[18px] h-[18px]" />
            ) : (
              <Moon className="w-[18px] h-[18px]" />
            )}
            <span className="sr-only">Toggle theme</span>
          </Button>
        )}

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center justify-center rounded-full ml-1 h-8 w-8 hover:opacity-80 transition-opacity cursor-pointer">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                IT
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-destructive focus:text-destructive"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
