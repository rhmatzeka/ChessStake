"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { getAddress } from "viem";
import { useConnectWallet, useLogin, useLogout, usePrivy, useWallets } from "@privy-io/react-auth";
import { ApiError, apiFetch } from "@/lib/api";
import type { AuthUser } from "@/hooks/useMyState";
import { privyAppId } from "./SignInProvider";
import { buildSignInMessage } from "./siwe";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

type Props = {
  user: AuthUser | null | undefined;
  onUser: (u: AuthUser | null) => void;
  /** Bump this number to start the sign-in flow from outside (for example after a pick while signed out). */
  openSignal: number;
};

/** Log in with Privy (email or a wallet), then sign one free message. Also shows who is signed in, lets them rename or sign out. */
export function SignInButton(props: Props) {
  if (!privyAppId) {
    return (
      <p role="status" className="text-xs text-muted">
        Sign-in is not configured on this server yet.
      </p>
    );
  }
  return <PrivySignIn {...props} />;
}

function PrivySignIn({ user, onUser, openSignal }: Props) {
  const { ready, authenticated, user: privyUser } = usePrivy();
  const { wallets, ready: walletsReady } = useWallets();
  const { logout } = useLogout();
  const wanting = useRef(false);
  const busyRef = useRef(false);
  const handledSignal = useRef(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");

  const cancel = useCallback(() => {
    wanting.current = false;
  }, []);
  const { login } = useLogin({ onError: cancel });
  const { connectWallet } = useConnectWallet({ onError: cancel });

  // The wallet to sign with: the one Privy marks as the user's, else any connected one.
  const primary = privyUser?.wallet?.address?.toLowerCase();
  const wallet = wallets.find((w) => w.address.toLowerCase() === primary) ?? wallets[0];

  const run = useCallback(async () => {
    if (!wallet || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const { nonce } = await apiFetch<{ nonce: string }>("/api/auth/nonce");
      const chainId = Number(wallet.chainId.split(":")[1]) || 1;
      const message = buildSignInMessage({
        address: getAddress(wallet.address),
        chainId,
        nonce,
        host: window.location.host,
        origin: window.location.origin,
      });
      const signature = (await wallet.sign(message)) as `0x${string}`;
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
  }, [wallet, onUser]);

  const start = useCallback(() => {
    if (!ready) return;
    setError(null);
    wanting.current = true;
    if (!authenticated) login();
    else if (wallet) void run();
    else if (walletsReady) connectWallet();
  }, [ready, authenticated, wallet, walletsReady, login, run, connectWallet]);

  // After Privy login finishes and the wallet is ready, carry on to the signature without another click.
  useEffect(() => {
    if (wanting.current && authenticated && wallet && user === null) void run();
  }, [authenticated, wallet, user, run]);

  useEffect(() => {
    if (openSignal > handledSignal.current && user === null && ready) {
      handledSignal.current = openSignal;
      start();
    }
  }, [openSignal, user, ready, start]);

  async function signOut() {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } finally {
      onUser(null);
      void logout().catch(() => {});
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
        disabled={busy || !ready || user === undefined}
        className="btn btn-gold w-full"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
      <p className="mt-2 text-xs text-muted">Free. Use your email or any wallet. No transaction is ever sent.</p>
      {error && (
        <p role="alert" className="mt-2 text-xs text-red-300">
          {error}
        </p>
      )}
    </div>
  );
}
