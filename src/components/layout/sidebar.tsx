"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col h-full max-h-screen border-r border-sidebar-border bg-sidebar shrink-0",
        "transition-all duration-300 ease-in-out select-none",
        collapsed ? "w-[68px]" : "w-[250px]"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 h-16 shrink-0 border-b border-sidebar-border">
        <div className="flex items-center justify-center w-9 h-9 shrink-0">
          <Image
            src="/app-logo.png"
            alt="IT Inventory Logo"
            width={36}
            height={24}
            priority
            className="w-auto h-8 object-contain"
          />
        </div>
        {!collapsed && (
          <div className="flex flex-col overflow-hidden animate-fade-in">
            <span className="text-sm font-bold text-sidebar-foreground truncate">
              IT Inventory
            </span>
            <span className="text-[11px] text-muted-foreground truncate">
              Bank Jatim
            </span>
          </div>
        )}
      </div>

      {/* Navigation (Smooth scrollable with min-h-0) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden py-3 px-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/50 hover:[&::-webkit-scrollbar-thumb]:bg-border">
        <nav className="flex flex-col gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  "transition-all duration-150",
                  "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold"
                    : "text-sidebar-foreground/70",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? item.title : undefined}
              >
                <item.icon
                  className={cn(
                    "w-[18px] h-[18px] shrink-0",
                    isActive && "text-primary"
                  )}
                />
                {!collapsed && <span className="truncate">{item.title}</span>}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2 shrink-0">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center justify-center w-full rounded-lg py-2",
            "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "transition-colors duration-150 cursor-pointer"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronLeft
            className={cn(
              "w-4 h-4 transition-transform duration-300",
              collapsed && "rotate-180"
            )}
          />
        </button>
      </div>
    </aside>
  );
}
