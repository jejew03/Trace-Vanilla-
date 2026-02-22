"use client";

import React, { createContext, useCallback, useContext, useState } from "react";
import { getActorRole } from "@/lib/api";
import {
  disconnectHashConnect,
  initAndOpenPairing,
  isHashConnectAvailable,
  type PairingData,
} from "@/lib/hashconnect";

export type WalletState = {
  accountId: string | null;
  role: string | null;
  status: "idle" | "connecting" | "connected" | "demo";
  error: string | null;
};

type WalletContextValue = WalletState & {
  connectHashPack: () => Promise<void>;
  connectDemo: (accountId: string) => Promise<void>;
  disconnect: () => void;
  refreshRole: () => Promise<void>;
};

const defaultWalletValue: WalletContextValue = {
  accountId: null,
  role: null,
  status: "idle",
  error: null,
  connectHashPack: async () => {},
  connectDemo: async () => {},
  disconnect: () => {},
  refreshRole: async () => {},
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<WalletState>({
    accountId: null,
    role: null,
    status: "idle",
    error: null,
  });

  const fetchAndSetRole = useCallback(async (accountId: string) => {
    try {
      const { role } = await getActorRole(accountId);
      setState((s) => ({ ...s, role, error: null }));
    } catch (e) {
      setState((s) => ({
        ...s,
        role: null,
        error: e instanceof Error ? e.message : "Rôle inconnu",
      }));
    }
  }, []);

  const connectHashPack = useCallback(async () => {
    if (!isHashConnectAvailable()) {
      setState((s) => ({ ...s, error: "Connexion HashPack non configurée. Utilisez le mode démo." }));
      return;
    }
    setState((s) => ({ ...s, status: "connecting", error: null }));
    const ok = await initAndOpenPairing({
      onPairing: (data: PairingData) => {
        const accountId = data?.accountIds?.[0] ?? null;
        if (accountId) {
          setState((s) => ({ ...s, accountId, status: "connected" }));
          fetchAndSetRole(accountId);
        }
      },
      onDisconnect: () => {
        setState({ accountId: null, role: null, status: "idle", error: null });
      },
    });
    if (!ok) {
      setState((s) => ({ ...s, status: "idle", error: "Impossible d'ouvrir HashPack." }));
    }
  }, [fetchAndSetRole]);

  const connectDemo = useCallback(
    async (accountId: string) => {
      const id = accountId.trim();
      if (!id) return;
      setState((s) => ({ ...s, status: "connecting", error: null }));
      setState((s) => ({ ...s, accountId: id, status: "demo" }));
      await fetchAndSetRole(id);
    },
    [fetchAndSetRole]
  );

  const disconnect = useCallback(() => {
    disconnectHashConnect();
    setState({ accountId: null, role: null, status: "idle", error: null });
  }, []);

  const refreshRole = useCallback(() => {
    if (state.accountId) return fetchAndSetRole(state.accountId);
  }, [state.accountId, fetchAndSetRole]);

  const value: WalletContextValue = {
    ...state,
    connectHashPack,
    connectDemo,
    disconnect,
    refreshRole,
  };

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const ctx = useContext(WalletContext);
  return ctx ?? defaultWalletValue;
}
