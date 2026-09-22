"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";
import { ChevronLeft } from "lucide-react";
import { useState } from "react";

export function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col border-r border-sidebar-border bg-sidebar",
        "transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-[250px]"
      )}
    >
      {/* Logo / Brand */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
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

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="flex flex-col gap-1 px-2">
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
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
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
      </ScrollArea>

      {/* Collapse toggle */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "flex items-center justify-center w-full rounded-lg py-2",
            "text-muted-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            "transition-colors duration-150"
          )}
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
