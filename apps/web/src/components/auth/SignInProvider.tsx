"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export const privyAppId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;

/**
 * Privy handles the login sheet: email or social login gets a free embedded wallet, and
 * MetaMask, WalletConnect and other external wallets still work. Signing in never sends a transaction.
 */
export function SignInProvider({ children }: { children: React.ReactNode }) {
  if (!privyAppId) return <>{children}</>;
  return (
    <PrivyProvider
      appId={privyAppId}
      config={{
        appearance: {
          theme: "dark",
          accentColor: "#e6a855",
          landingHeader: "Sign in to PawnPool",
          loginMessage: "Free. No transaction is ever sent.",
          walletChainType: "ethereum-only",
        },
        embeddedWallets: {
          ethereum: { createOnLogin: "users-without-wallets" },
          // The sign-in message is free and harmless, so embedded wallets sign it without a second popup.
          showWalletUIs: false,
        },
      }}
    >
      {children}
    </PrivyProvider>
  );
}
