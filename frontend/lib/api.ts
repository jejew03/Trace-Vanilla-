const API_URL = process.env.NEXT_PUBLIC_API_URL || "";

export type VerifyResponse = {
  lot: {
    lotId: string;
    tokenId: string;
    serial: number;
    ipfsRef: string | null;
    createdAt: string;
  } | null;
  events: Array<{
    step: string;
    actorAccount: string;
    role: string;
    timestamp: string;
    txId?: string | null;
    ipfsRef?: string | null;
    eventHash?: string | null;
  }>;
  score: number;
};

export async function getVerify(lotId: string): Promise<VerifyResponse> {
  const res = await fetch(`${API_URL}/verify/${encodeURIComponent(lotId)}`, {
    next: { revalidate: 0 },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || "Erreur vérification");
  }
  return res.json();
}

export function hashscanTransactionUrl(txId: string, network = "testnet"): string {
  const id = txId.replace("@", "-");
  return `https://hashscan.io/${network}/transaction/${id}`;
}

export function hashscanTokenUrl(tokenId: string, serial: number, network = "testnet"): string {
  return `https://hashscan.io/${network}/token/${tokenId}?serial=${serial}`;
}

export type ActorRoleResponse = { role: string };

export async function getActorRole(accountId: string): Promise<ActorRoleResponse> {
  const res = await fetch(`${API_URL}/actors/${encodeURIComponent(accountId)}/role`, {
    cache: "no-store",
  });
  if (res.status === 404) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || "Acteur non trouvé");
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || "Erreur");
  }
  return res.json();
}

export type LotSummary = {
  lotId: string;
  tokenId: string;
  serial: number;
  ipfsRef: string | null;
  createdAt: string;
};

export type LotsListParams = {
  page?: number;
  limit?: number;
  creatorAccountId?: string;
  nextStep?: string;
};

export type LotsListResponse = {
  lots: LotSummary[];
  total: number;
  page: number;
  limit: number;
};

const NEXT_STEP_ORDER = ["HARVEST", "DRYING", "PACKAGING", "EXPORT", "IMPORT"];

export function getNextStepFromEvents(events: VerifyResponse["events"]): string | null {
  if (!events?.length) return NEXT_STEP_ORDER[0];
  const done = new Set(events.map((e) => e.step));
  return NEXT_STEP_ORDER.find((s) => !done.has(s)) ?? null;
}

export async function getLots(params: LotsListParams = {}): Promise<LotsListResponse> {
  const sp = new URLSearchParams();
  if (params.page != null) sp.set("page", String(params.page));
  if (params.limit != null) sp.set("limit", String(params.limit));
  if (params.creatorAccountId) sp.set("creatorAccountId", params.creatorAccountId);
  if (params.nextStep) sp.set("nextStep", params.nextStep);
  const q = sp.toString();
  const url = `${API_URL}/lots${q ? `?${q}` : ""}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || err.error || "Erreur");
  }
  return res.json();
}
