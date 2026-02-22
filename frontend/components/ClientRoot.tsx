"use client";

import React, { useEffect, useState } from "react";

type WalletProviderComponent = React.ComponentType<{ children: React.ReactNode }>;

export default function ClientRoot({ children }: { children: React.ReactNode }) {
  const [WalletProvider, setWalletProvider] = useState<WalletProviderComponent | null>(null);

  useEffect(() => {
    import("@/contexts/WalletContext").then((mod) => setWalletProvider(() => mod.WalletProvider));
  }, []);

  if (!WalletProvider) return <>{children}</>;
  return <WalletProvider>{children}</WalletProvider>;
}
