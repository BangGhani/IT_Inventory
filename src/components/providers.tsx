"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useSessionTimeout } from "@/lib/hooks/use-session-timeout";

function SessionTimeoutActive({ children }: { children: React.ReactNode }) {
  useSessionTimeout();
  return <>{children}</>;
}

function SessionTimeoutGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login" || pathname.startsWith("/auth");

  // Render different components to avoid conditional hook call
  if (isLoginPage) {
    return <>{children}</>;
  }

  return <SessionTimeoutActive>{children}</SessionTimeoutActive>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        <TooltipProvider>
          <SessionTimeoutGuard>
            {children}
          </SessionTimeoutGuard>
          <Toaster richColors position="top-right" />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
