"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError, apiFetch } from "@/lib/api";
import { useVisiblePolling } from "./useVisiblePolling";

export type MyState = { pickUci: string | null; points: number; turnsPicked: number; rank: number | null };
export type AuthUser = { address: string; displayName: string | null };

/** Polls /me every 3 s while signed in and the tab is visible. */
export function useMyState(slug: string, signedIn: boolean): { me: MyState | null; refresh: () => Promise<void> } {
  const [me, setMe] = useState<MyState | null>(null);

  const refresh = useCallback(async () => {
    try {
      setMe(await apiFetch<MyState>(`/api/events/${encodeURIComponent(slug)}/me`));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) setMe(null);
      throw e;
    }
  }, [slug]);

  useEffect(() => {
    if (!signedIn) setMe(null);
  }, [signedIn]);

  useVisiblePolling(refresh, 3000, signedIn);
  return { me, refresh };
}

/** The signed-in player, from the session cookie. `undefined` while loading. */
export function useAuthUser(): { user: AuthUser | null | undefined; setUser: (u: AuthUser | null) => void } {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  useEffect(() => {
    let live = true;
    apiFetch<AuthUser | null>("/api/auth/me")
      .then((u) => live && setUser(u))
      .catch(() => live && setUser(null));
    return () => {
      live = false;
    };
  }, []);
  return { user, setUser };
}
