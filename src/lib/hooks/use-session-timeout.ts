"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Monitors Supabase auth state. If the session is invalidated
 * (e.g., token expired, user signed out from another tab),
 * redirect to the login page.
 *
 * No inactivity-based auto-logout — users stay signed in
 * until they explicitly log out or the refresh token expires.
 */
export function useSessionTimeout() {
  const router = useRouter();
  const isRedirecting = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (
        (event === "SIGNED_OUT" || event === "TOKEN_REFRESHED") &&
        event === "SIGNED_OUT" &&
        !isRedirecting.current
      ) {
        isRedirecting.current = true;
        router.push("/login");
        router.refresh();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);
}
