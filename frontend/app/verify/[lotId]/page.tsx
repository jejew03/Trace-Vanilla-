"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import TraceabilityScore from "@/components/TraceabilityScore";
import StepTimeline from "@/components/StepTimeline";
import { getVerify, hashscanTokenUrl, type VerifyResponse } from "@/lib/api";
import { getT, type Locale } from "@/lib/i18n";

const NETWORK = process.env.NEXT_PUBLIC_HEDERA_NETWORK || "testnet";

export default function VerifyLotPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const lotId = (params?.lotId as string) || "";
  const locale: Locale = (searchParams?.get("lang") === "en" ? "en" : "fr") as Locale;
  const t = getT(locale);

  const [data, setData] = useState<VerifyResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [shareFeedback, setShareFeedback] = useState(false);

  const fetchVerify = useCallback(async () => {
    if (!lotId) {
      setLoading(false);
      setError(t.notFound);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await getVerify(lotId);
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : t.error);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [lotId, t.error, t.notFound]);

  useEffect(() => {
    fetchVerify();
  }, [fetchVerify]);

  const handleShare = useCallback(() => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    if (url && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(url).then(() => {
        setShareFeedback(true);
        setTimeout(() => setShareFeedback(false), 2000);
      });
    }
  }, []);

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-lg text-center">
          <p className="text-slate-600">{t.loading}</p>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-8">
        <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm">
          <h1 className="text-xl font-semibold text-slate-800">{t.notFound}</h1>
          <p className="mt-2 text-slate-600">{error || t.error}</p>
        </div>
      </main>
    );
  }

  const { lot, events, score } = data;
  const stepLabels = t.step as Record<string, string>;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="mx-auto max-w-lg space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-xl font-semibold text-slate-800">{t.title}</h1>
          <div className="flex items-center gap-2">
            <a
              href={`/verify/${lotId}?lang=fr`}
              className={`rounded px-2 py-1 text-sm ${locale === "fr" ? "font-semibold text-slate-800 underline" : "text-slate-500 hover:text-slate-700"}`}
            >
              FR
            </a>
            <span className="text-slate-300">|</span>
            <a
              href={`/verify/${lotId}?lang=en`}
              className={`rounded px-2 py-1 text-sm ${locale === "en" ? "font-semibold text-slate-800 underline" : "text-slate-500 hover:text-slate-700"}`}
            >
              EN
            </a>
          </div>
          <button
            type="button"
            onClick={handleShare}
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            {shareFeedback ? t.shareOk : t.share}
          </button>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <TraceabilityScore
            score={score}
            size={180}
            label={t.scoreLabel}
          />
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">{t.stepsTitle}</h2>
          <StepTimeline
            events={events}
            stepLabels={stepLabels}
            completedLabel={t.completed}
            pendingLabel={t.pending}
            actorLabel={t.actor}
            dateLabel={t.date}
            localityLabel={t.locality}
            viewRecordLabel={t.viewRecord}
            network={NETWORK}
          />
        </section>

        {lot && (
          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-slate-800">{t.details}</h2>
            <dl className="grid gap-2 text-sm">
              <div>
                <dt className="font-medium text-slate-500">{t.origin}</dt>
                <dd className="text-slate-800">—</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">{t.variety}</dt>
                <dd className="text-slate-800">—</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">{t.weight}</dt>
                <dd className="text-slate-800">—</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">{t.grade}</dt>
                <dd className="text-slate-800">—</dd>
              </div>
            </dl>
            <a
              href={hashscanTokenUrl(lot.tokenId, lot.serial, NETWORK)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1 text-green-600 underline hover:text-green-700"
            >
              {t.viewCertificate}
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
          </section>
        )}
      </div>
    </main>
  );
}
