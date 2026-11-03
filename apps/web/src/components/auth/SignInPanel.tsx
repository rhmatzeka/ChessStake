"use client";

import type { AuthUser } from "@/hooks/useMyState";
import { SignInProvider } from "./SignInProvider";
import { SignInButton } from "./SignInButton";

export default function SignInPanel(props: {
  user: AuthUser | null | undefined;
  onUser: (u: AuthUser | null) => void;
  openSignal: number;
}) {
  return (
    <SignInProvider>
      <SignInButton {...props} />
    </SignInProvider>
  );
}
