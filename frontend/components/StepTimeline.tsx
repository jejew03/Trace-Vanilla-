"use client";

import { hashscanTransactionUrl } from "@/lib/api";

const STEPS_ORDER: Array<"HARVEST" | "DRYING" | "PACKAGING" | "EXPORT" | "IMPORT"> = [
  "HARVEST",
  "DRYING",
  "PACKAGING",
  "EXPORT",
  "IMPORT",
];

type Event = {
  step: string;
  actorAccount: string;
  role: string;
  timestamp: string;
  txId?: string | null;
  locality?: string | null;
};

type StepLabels = Record<string, string>;

type StepTimelineProps = {
  events: Event[];
  stepLabels: StepLabels;
  completedLabel: string;
  pendingLabel: string;
  actorLabel: string;
  dateLabel: string;
  localityLabel: string;
  viewRecordLabel: string;
  network?: string;
};

export default function StepTimeline({
  events,
  stepLabels,
  completedLabel,
  pendingLabel,
  actorLabel,
  dateLabel,
  localityLabel,
  viewRecordLabel,
  network = "testnet",
}: StepTimelineProps) {
  const byStep = new Map<string | undefined, Event>();
  events.forEach((e) => byStep.set(e.step, e));

  return (
    <ul className="space-y-0">
      {STEPS_ORDER.map((step, i) => {
        const event = byStep.get(step);
        const done = !!event;
        return (
          <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
            {/* vertical line */}
            {i < STEPS_ORDER.length - 1 && (
              <span
                className="absolute left-[11px] top-6 bottom-0 w-0.5 bg-slate-200"
                aria-hidden
              />
            )}
            {/* dot */}
            <span
              className={`relative z-10 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 ${
                done ? "border-green-500 bg-green-500" : "border-slate-300 bg-white"
              }`}
            >
              {done && (
                <svg className="h-3.5 w-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </span>
            {/* content */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-medium text-slate-800">
                  {stepLabels[step] ?? step}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    done ? "bg-green-100 text-green-800" : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {done ? completedLabel : pendingLabel}
                </span>
              </div>
              {event && (
                <div className="mt-2 space-y-1 text-sm text-slate-600">
                  <p>
                    <span className="font-medium">{actorLabel}:</span>{" "}
                    {event.role} ({event.actorAccount})
                  </p>
                  <p>
                    <span className="font-medium">{dateLabel}:</span>{" "}
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                  <p>
                    <span className="font-medium">{localityLabel}:</span>{" "}
                    {event.locality || "—"}
                  </p>
                  {event.txId && (
                    <a
                      href={hashscanTransactionUrl(event.txId, network)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-green-600 underline hover:text-green-700"
                    >
                      {viewRecordLabel}
                      <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  )}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
