"use client";

import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ConnectKitProvider, getDefaultConfig } from 'connectkit';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { baseSepolia, localhost } from 'wagmi/chains';

const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || 'your_project_id_placeholder';
const config = createConfig(
  getDefaultConfig({
    appName: 'ChessStake',
    walletConnectProjectId: projectId,
    chains: [baseSepolia, localhost],
    transports: {
      [baseSepolia.id]: http(),
      [localhost.id]: http(),
    },
  }),
);
const queryClient = new QueryClient();

export default function WalletProviders({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ConnectKitProvider>{children}</ConnectKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
