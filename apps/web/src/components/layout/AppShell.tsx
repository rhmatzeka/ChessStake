"use client";

import React from 'react';
import dynamic from 'next/dynamic';

const WalletProviders = dynamic(() => import('./WalletProviders'), {
  ssr: false,
  loading: () => <div className="min-h-screen bg-[#1e1713]" />,
});

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <WalletProviders>{children}</WalletProviders>;
};
export default AppShell;
