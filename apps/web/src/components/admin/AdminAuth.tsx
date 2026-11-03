"use client";

import { useRouter } from "next/navigation";
import { SignInLoader } from "@/components/auth/SignInLoader";

export function AdminAuth({ state, address }: { state: "anon" | "denied"; address: string | null }) {
  const router = useRouter();
  return (
    <div className="max-w-sm panel p-5">
      {state === "denied" ? (
        <p role="alert" className="mb-4 font-semibold text-red-300">
          Not allowed
        </p>
      ) : (
        <p className="mb-4 text-muted">Sign in with the owner wallet to continue.</p>
      )}
      <SignInLoader
        user={address ? { address, displayName: null } : null}
        onUser={() => router.refresh()}
        openSignal={0}
      />
    </div>
  );
}
