"use client";

type TraceabilityScoreProps = {
  score: number;
  size?: number;
  label?: string;
  className?: string;
};

const STROKE_WIDTH = 10;
const RADIUS_OFFSET = STROKE_WIDTH / 2;

export default function TraceabilityScore({
  score,
  size = 160,
  label,
  className = "",
}: TraceabilityScoreProps) {
  const r = size / 2 - RADIUS_OFFSET;
  const circumference = 2 * Math.PI * r;
  const clamped = Math.min(100, Math.max(0, score));
  const dash = (clamped / 100) * circumference;
  const color = clamped >= 75 ? "#22c55e" : clamped >= 25 ? "#eab308" : "#94a3b8";

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="rotate-[-90deg]"
          aria-hidden
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="#e2e8f0"
            strokeWidth={STROKE_WIDTH}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={STROKE_WIDTH}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeLinecap="round"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-2xl font-bold text-slate-800"
          style={{ fontSize: size * 0.2 }}
        >
          {Math.round(clamped)}%
        </span>
      </div>
      {label && (
        <p className="text-center text-sm font-medium text-slate-600">{label}</p>
      )}
    </div>
  );
}
