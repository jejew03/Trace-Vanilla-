"use client";

import { useState } from "react";
import { useWallet } from "@/contexts/WalletContext";
import { isHashConnectAvailable } from "@/lib/hashconnect";

export default function WalletConnect() {
  const { accountId, role, status, error, connectHashPack, connectDemo, disconnect } = useWallet();
  const [demoAccountId, setDemoAccountId] = useState("");

  const connected = status === "connected" || status === "demo";
  const canUseHashPack = isHashConnectAvailable();

  return (
    <div className="wallet-connect flex flex-col gap-2">
      {!connected ? (
        <>
          {canUseHashPack && (
            <button
              type="button"
              onClick={connectHashPack}
              disabled={status === "connecting"}
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
            >
              {status === "connecting" ? "Connexion…" : "Connecter HashPack"}
            </button>
          )}
          {!canUseHashPack && (
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="0.0.12345"
                  value={demoAccountId}
                  onChange={(e) => setDemoAccountId(e.target.value)}
                  className="rounded border border-gray-300 px-3 py-2 text-sm min-w-[10rem]"
                  aria-label="ID compte Hedera"
                />
                <button
                type="button"
                onClick={() => connectDemo(demoAccountId)}
                disabled={status === "connecting" || !demoAccountId.trim()}
                className="rounded bg-gray-700 px-4 py-2 text-white hover:bg-gray-800 disabled:opacity-50"
              >
                Utiliser ce compte
              </button>
              </div>
              <p className="text-xs text-gray-500">
                ID compte (ex. 0.0.12345), pas l’ID d’un lot (0.0.xxx-1).
              </p>
            </div>
          )}
          {error && (
            <p className="text-sm text-red-600">
              {error}
              {error.includes("non trouvé") && " Vérifiez qu’il s’agit d’un ID compte (0.0.12345), pas d’un ID lot."}
            </p>
          )}
        </>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-gray-700">Mon compte</span>
          <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm">
            {accountId} {role ? `· ${role}` : ""}
          </span>
          <button
            type="button"
            onClick={disconnect}
            className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-100"
          >
            Déconnexion
          </button>
        </div>
      )}
    </div>
  );
}
