"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAccount, useDisconnect, useSignMessage } from "wagmi";
import { useModal } from "connectkit";
import { ApiError, apiFetch } from "@/lib/api";
import type { AuthUser } from "@/hooks/useMyState";
import { buildSignInMessage } from "./siwe";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

/** Connect wallet, then sign one free message. Also shows who is signed in, lets them rename or sign out. */
export function SignInButton({
  user,
  onUser,
  openSignal,
}: {
  user: AuthUser | null | undefined;
  onUser: (u: AuthUser | null) => void;
  /** Bump this number to start the sign-in flow from outside (for example after a pick while signed out). */
  openSignal: number;
}) {
  const { address, isConnected, chainId } = useAccount();
  const { open, setOpen } = useModal();
  const { signMessageAsync } = useSignMessage();
  const { disconnect } = useDisconnect();
  const wanting = useRef(false);
  const busyRef = useRef(false);
  const handledSignal = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const run = useCallback(async () => {
    if (!address || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const { nonce } = await apiFetch<{ nonce: string }>("/api/auth/nonce");
      const message = buildSignInMessage({
        address,
        chainId: chainId ?? 1,
        nonce,
        host: window.location.host,
        origin: window.location.origin,
      });
      const signature = await signMessageAsync({ message });
      const me = await apiFetch<AuthUser>("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature }),
      });
      onUser(me);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Signing was cancelled. Press Sign in to try again.");
    } finally {
      wanting.current = false;
      busyRef.current = false;
      setBusy(false);
    }
  }, [address, chainId, onUser, signMessageAsync]);

  const start = useCallback(() => {
    setError(null);
    wanting.current = true;
    if (isConnected && address) void run();
    else setOpen(true);
  }, [address, isConnected, run, setOpen]);

  // After the wallet connects, carry on to the signature without another click.
  useEffect(() => {
    if (wanting.current && isConnected && address && user === null) void run();
  }, [isConnected, address, user, run]);

  // Closing the wallet sheet without connecting cancels the pending sign-in.
  useEffect(() => {
    if (!open && !isConnected) wanting.current = false;
  }, [open, isConnected]);

  useEffect(() => {
    if (openSignal > handledSignal.current && user === null) {
      handledSignal.current = openSignal;
      start();
    }
  }, [openSignal, user, start]);

  async function signOut() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      disconnect();
      onUser(null);
    }
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      onUser(
        await apiFetch<AuthUser>("/api/auth/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ displayName: name }),
        }),
      );
      setEditing(false);
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : "Could not save the name");
    }
  }

  if (user) {
    return (
      <div className="text-sm">
        <p className="font-medium text-foreground">{user.displayName ?? short(user.address)}</p>
        {user.displayName && <p className="text-xs text-muted">{short(user.address)}</p>}
        {editing ? (
          <form onSubmit={saveName} className="mt-2 flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              minLength={2}
              required
              aria-label="Display name"
              placeholder="2 to 20 characters"
              className="field min-w-0 flex-1 !px-2 !py-1 !text-sm"
            />
            <button className="btn btn-gold btn-sm">Save</button>
          </form>
        ) : (
          <div className="mt-2 flex gap-4 text-xs text-muted">
            <button
              onClick={() => {
                setName(user.displayName ?? "");
                setEditing(true);
              }}
              className="underline-offset-2 hover:text-foreground hover:underline"
            >
              Set display name
            </button>
            <button onClick={signOut} className="underline-offset-2 hover:text-foreground hover:underline">
              Sign out
            </button>
          </div>
        )}
        {error && (
          <p role="alert" className="mt-2 text-xs text-red-300">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        onClick={start}
        disabled={busy || user === undefined}
        className="btn btn-gold w-full"
      >
        {busy ? "Check your wallet…" : "Sign in with wallet"}
      </button>
      <p className="mt-2 text-xs text-muted">Free. You sign one message, no transaction is sent.</p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
