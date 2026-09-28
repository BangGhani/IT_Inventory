"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

const INACTIVITY_TIMEOUT_MS = 20 * 60 * 1000; // 20 minutes
const STORAGE_KEY = "it_inventory_last_active";
const THROTTLE_INTERVAL_MS = 5 * 1000; // Throttle storage writes to every 5s

/**
 * Hook that monitors user activity (mouse, keyboard, touch, scroll)
 * and auto-logs out after 20 minutes of inactivity.
 * Uses localStorage to persist last-active time across tab refreshes,
 * browser restarts, and tab switching.
 */
export function useSessionTimeout() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLoggingOut = useRef(false);
  const lastWriteRef = useRef<number>(0);

  const handleLogout = useCallback(async () => {
    if (isLoggingOut.current) return;
    isLoggingOut.current = true;

    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(STORAGE_KEY);
      }
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error("Sign out error during inactivity timeout:", err);
    } finally {
      toast.info("Sesi berakhir", {
        description: "Anda telah logout otomatis karena tidak ada aktivitas selama 20 menit.",
        duration: 6000,
      });
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  const scheduleTimeout = useCallback((remainingMs: number) => {
    if (isLoggingOut.current) return;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    if (remainingMs <= 0) {
      handleLogout();
      return;
    }

    timerRef.current = setTimeout(handleLogout, remainingMs);
  }, [handleLogout]);

  const recordActivity = useCallback(() => {
    if (isLoggingOut.current) return;

    const now = Date.now();

    // Throttle writing to localStorage to prevent high frequency I/O
    if (now - lastWriteRef.current > THROTTLE_INTERVAL_MS) {
      lastWriteRef.current = now;
      try {
        localStorage.setItem(STORAGE_KEY, now.toString());
      } catch {
        // Ignore localStorage quota errors if any
      }
    }

    scheduleTimeout(INACTIVITY_TIMEOUT_MS);
  }, [scheduleTimeout]);

  useEffect(() => {
    // Check initial state on mount
    const checkSessionState = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        const now = Date.now();

        if (stored) {
          const lastActive = parseInt(stored, 10);
          if (!isNaN(lastActive)) {
            const elapsed = now - lastActive;
            if (elapsed >= INACTIVITY_TIMEOUT_MS) {
              handleLogout();
              return;
            }
            // Resume with remaining time
            scheduleTimeout(INACTIVITY_TIMEOUT_MS - elapsed);
            return;
          }
        }

        // No prior timestamp stored, initialize now
        localStorage.setItem(STORAGE_KEY, now.toString());
        scheduleTimeout(INACTIVITY_TIMEOUT_MS);
      } catch {
        scheduleTimeout(INACTIVITY_TIMEOUT_MS);
      }
    };

    checkSessionState();

    const events: (keyof WindowEventMap)[] = [
      "mousemove",
      "mousedown",
      "keydown",
      "touchstart",
      "scroll",
      "click",
    ];

    events.forEach((event) => {
      window.addEventListener(event, recordActivity, { passive: true });
    });

    // Check again when user switches back to this tab/window
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkSessionState();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Sync across tabs via storage event
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        const otherTabActive = parseInt(e.newValue, 10);
        if (!isNaN(otherTabActive)) {
          const elapsed = Date.now() - otherTabActive;
          if (elapsed < INACTIVITY_TIMEOUT_MS) {
            scheduleTimeout(INACTIVITY_TIMEOUT_MS - elapsed);
          }
        }
      }
    };
    window.addEventListener("storage", handleStorageChange);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      events.forEach((event) => {
        window.removeEventListener(event, recordActivity);
      });
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [handleLogout, recordActivity, scheduleTimeout]);
}
