"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { navItems } from "@/lib/nav-items";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import Image from "next/image";
import { Menu } from "lucide-react";
import { useState } from "react";

export function MobileNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Show only items marked as mobileVisible in the bottom bar, plus "More"
  const bottomItems = navItems.filter((item) => item.mobileVisible);

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/80 backdrop-blur-xl">
        <div className="flex items-center justify-around h-16 px-2">
          {bottomItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg",
                  "transition-colors duration-150 min-w-[56px]",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.title}</span>
              </Link>
            );
          })}

          {/* More button → opens sheet */}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className={cn(
                "flex flex-col items-center justify-center gap-0.5 px-2 py-1 rounded-lg",
                "text-muted-foreground hover:text-foreground transition-colors min-w-[56px] cursor-pointer"
              )}
            >
              <Menu className="w-5 h-5" />
              <span className="text-[10px] font-medium">More</span>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] p-0">
              <SheetTitle className="sr-only">Menu Navigasi</SheetTitle>
              {/* Sheet header */}
              <div className="flex items-center gap-3 px-5 h-16 border-b border-border">
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
                <div className="flex flex-col">
                  <span className="text-sm font-bold">IT Inventory</span>
                  <span className="text-[11px] text-muted-foreground">
                    Bank Jatim
                  </span>
                </div>
              </div>

              {/* All nav items */}
              <nav className="flex flex-col gap-1 p-3">
                {navItems.map((item) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname.startsWith(item.href));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                        "transition-colors duration-150",
                        "hover:bg-accent hover:text-accent-foreground",
                        isActive
                          ? "bg-accent text-accent-foreground"
                          : "text-foreground/70"
                      )}
                    >
                      <item.icon
                        className={cn(
                          "w-[18px] h-[18px] shrink-0",
                          isActive && "text-primary"
                        )}
                      />
                      <span>{item.title}</span>
                    </Link>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </nav>

      {/* Spacer to prevent content being hidden behind bottom nav */}
      <div className="lg:hidden h-16" />
    </>
  );
}
