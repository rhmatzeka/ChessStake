"use client";

import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, createConfig, http } from "wagmi";
import { mainnet } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { ConnectKitProvider, getDefaultConfig } from "connectkit";

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID;

/** Mainnet only, read-only transport: signing in never sends a transaction. Without a WalletConnect id only browser wallets are offered. */
const config = projectId
  ? createConfig(
      getDefaultConfig({
        chains: [mainnet],
        transports: { [mainnet.id]: http() },
        walletConnectProjectId: projectId,
        appName: "PawnPool",
        ssr: false,
      }),
    )
  : createConfig({
      chains: [mainnet],
      transports: { [mainnet.id]: http() },
      connectors: [injected()],
      ssr: false,
    });

export function SignInProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={client}>
        <ConnectKitProvider
          theme="midnight"
          customTheme={{ "--ck-accent-color": "#e6a855", "--ck-accent-text-color": "#000000" }}
        >
          {children}
        </ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
