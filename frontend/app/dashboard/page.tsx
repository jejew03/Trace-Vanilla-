"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import WalletConnect from "@/components/WalletConnect";
import QRCodeDisplay from "@/components/QRCode";
import TraceabilityScore from "@/components/TraceabilityScore";
import {
  getLots,
  getVerify,
  getNextStepFromEvents,
  type LotSummary,
  type VerifyResponse,
} from "@/lib/api";
import { useWallet } from "@/contexts/WalletContext";

const STEP_LABEL: Record<string, string> = {
  HARVEST: "Récolte",
  DRYING: "Séchage",
  PACKAGING: "Emballage",
  EXPORT: "Export",
  IMPORT: "Import",
};

type LotWithDetails = LotSummary & { score: number; nextStep: string | null };

function LotCard({ lot }: { lot: LotWithDetails }) {
  return (
    <article className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-mono font-medium text-gray-800">{lot.lotId}</span>
        <TraceabilityScore score={lot.score} size={44} />
      </div>
      <p className="mb-2 text-sm text-gray-600">
        Prochaine étape : {lot.nextStep ? STEP_LABEL[lot.nextStep] ?? lot.nextStep : "—"}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <QRCodeDisplay lotId={lot.lotId} size={80} />
        <div className="flex flex-col gap-1">
          <Link
            href={`/verify/${encodeURIComponent(lot.lotId)}`}
            className="text-sm text-emerald-600 hover:underline"
          >
            Voir la fiche
          </Link>
          <Link
            href={`/lots/${encodeURIComponent(lot.lotId)}/step`}
            className="text-sm text-emerald-600 hover:underline"
          >
            Valider une étape
          </Link>
        </div>
      </div>
    </article>
  );
}

export default function DashboardPage() {
  const { accountId, role, status, error: walletError } = useWallet();
  const [lots, setLots] = useState<LotWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchLots = useCallback(async () => {
    if (!accountId || !role) {
      setLots([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const params: { creatorAccountId?: string; nextStep?: string } = {};
      if (role === "FARMER") {
        params.creatorAccountId = accountId;
      } else if (role === "DRYER") {
        params.nextStep = "DRYING";
      } else if (role === "EXPORTER") {
        params.nextStep = "PACKAGING";
      } else if (role === "ADMIN") {
        // Admin voit tous les lots ou on garde un filtre; ici pas de filtre
      }
      const { lots: list } = await getLots({ ...params, limit: 50 });
      const withDetails: LotWithDetails[] = await Promise.all(
        list.map(async (lot): Promise<LotWithDetails> => {
          try {
            const v: VerifyResponse = await getVerify(lot.lotId);
            const nextStep = getNextStepFromEvents(v.events);
            return { ...lot, score: v.score, nextStep };
          } catch {
            return { ...lot, score: 0, nextStep: "HARVEST" };
          }
        })
      );
      setLots(withDetails);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur chargement");
      setLots([]);
    } finally {
      setLoading(false);
    }
  }, [accountId, role]);

  useEffect(() => {
    if (status === "connected" || status === "demo") fetchLots();
    else setLots([]);
  }, [status, fetchLots]);

  const connected = status === "connected" || status === "demo";

  return (
    <main className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <WalletConnect />
        </header>

        {!connected && (
          <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-center">
            <p className="text-amber-800">
              Connectez-vous pour voir vos lots et les étapes à valider.
            </p>
          </section>
        )}

        {connected && !role && (
          <section className="rounded-lg border border-red-200 bg-red-50 p-4 text-center space-y-2">
            <p className="text-red-800">
              Compte non enregistré. Demandez à un administrateur d&apos;attribuer votre rôle.
            </p>
            {walletError && (
              <p className="text-sm text-red-600">
                Détail : {walletError}
                {walletError.includes("fetch") && " Vérifiez que le backend tourne et que NEXT_PUBLIC_API_URL pointe vers lui (ex. http://localhost:3001), puis redémarrez le frontend."}
              </p>
            )}
          </section>
        )}

        {connected && role === "ADMIN" && (
          <section className="mb-6">
            <Link
              href="/admin"
              className="inline-block rounded bg-gray-800 px-4 py-2 text-white hover:bg-gray-900"
            >
              Dashboard admin
            </Link>
          </section>
        )}

        {connected && role === "FARMER" && (
          <section className="mb-6 flex flex-wrap gap-2">
            <Link
              href="/lots/new"
              className="rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700"
            >
              Créer un nouveau lot
            </Link>
            {lots.some((l) => l.nextStep === "HARVEST") ? (
              <Link
                href={`/lots/${encodeURIComponent(lots.find((l) => l.nextStep === "HARVEST")!.lotId)}/step`}
                className="rounded border border-emerald-600 px-4 py-2 text-emerald-700 hover:bg-emerald-50"
              >
                Valider récolte
              </Link>
            ) : (
              <Link
                href="/lots/new"
                className="rounded border border-emerald-600 px-4 py-2 text-emerald-700 hover:bg-emerald-50"
              >
                Valider récolte
              </Link>
            )}
          </section>
        )}

        {connected && (role === "DRYER" || role === "EXPORTER") && (
          <p className="mb-4 text-sm text-gray-600">
            {role === "DRYER"
              ? "Lots en attente de séchage (récolte validée)."
              : "Lots en attente d'emballage ou d'export."}
          </p>
        )}

        {connected && role && (
          <>
            {error && (
              <p className="mb-4 text-sm text-red-600">{error}</p>
            )}
            {loading ? (
              <p className="text-gray-500">Chargement des lots…</p>
            ) : lots.length === 0 ? (
              <p className="text-gray-500">Aucun lot à afficher.</p>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {lots.map((lot) => (
                  <li key={lot.lotId}>
                    <LotCard lot={lot} />
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
    </main>
  );
}
