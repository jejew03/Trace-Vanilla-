/**
 * HashConnect helper — init et pairing HashPack.
 * Utilise NEXT_PUBLIC_HASHCONNECT_PROJECT_ID (WalletConnect project ID).
 */

const APP_NAME = process.env.NEXT_PUBLIC_HASHCONNECT_APP_NAME || "VanillaTrace";
const PROJECT_ID = process.env.NEXT_PUBLIC_HASHCONNECT_PROJECT_ID || "";
const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";

export function isHashConnectAvailable(): boolean {
  return typeof PROJECT_ID === "string" && PROJECT_ID.length > 0;
}

export type PairingData = {
  accountIds: string[];
  network: string;
};

export type HashConnectListeners = {
  onPairing: (data: PairingData) => void;
  onDisconnect: () => void;
};

let hashconnectInstance: unknown = null;

export async function getHashConnect(): Promise<unknown> {
  if (hashconnectInstance) return hashconnectInstance;
  if (typeof window === "undefined") return null;
  try {
    const [{ HashConnect }, { LedgerId }] = await Promise.all([
      import("hashconnect"),
      import("@hashgraph/sdk").then((m) => ({ LedgerId: m.LedgerId ?? { MAINNET: 0, TESTNET: 1 } })),
    ]);
    const ledgerId = NETWORK === "mainnet" ? LedgerId.MAINNET : LedgerId.TESTNET;
    const meta = {
      name: APP_NAME,
      description: "Traçabilité vanille",
      icons: ["https://vanilla-trace.vercel.app/icon.png"],
      url: typeof window !== "undefined" ? window.location.origin : "",
    };
    const hc = new (HashConnect as new (
      ledger: number,
      projectId: string,
      metadata: { name: string; description: string; icons: string[]; url: string },
      debug: boolean
    ) => unknown)(ledgerId, PROJECT_ID, meta, false);
    hashconnectInstance = hc;
    return hc;
  } catch (e) {
    console.warn("HashConnect init failed", e);
    return null;
  }
}

export async function initAndOpenPairing(listeners: HashConnectListeners): Promise<boolean> {
  const hc = await getHashConnect();
  if (!hc) return false;
  const H = hc as {
    pairingEvent: { on: (cb: (data: PairingData) => void) => void };
    disconnectionEvent: { on: (cb: () => void) => void };
    init: () => Promise<unknown>;
    openPairingModal: () => void;
  };
  H.pairingEvent.on((data: PairingData) => listeners.onPairing(data));
  H.disconnectionEvent.on(() => listeners.onDisconnect());
  await H.init();
  H.openPairingModal();
  return true;
}

export async function disconnectHashConnect(): Promise<void> {
  const hc = await getHashConnect();
  if (hc && typeof (hc as { disconnect: () => void }).disconnect === "function") {
    (hc as { disconnect: () => void }).disconnect();
  }
  hashconnectInstance = null;
}
