"use client";

import { useMemo } from "react";
import { QRCodeSVG } from "qrcode.react";

type QRCodeProps = {
  lotId: string;
  size?: number;
  level?: "L" | "M" | "Q" | "H";
};

function getVerifyUrl(lotId: string): string {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/verify/${encodeURIComponent(lotId)}`;
  }
  const base = process.env.NEXT_PUBLIC_APP_URL || "";
  return `${base}/verify/${encodeURIComponent(lotId)}`;
}

export default function QRCodeDisplay({ lotId, size = 120, level = "M" }: QRCodeProps) {
  const url = useMemo(() => getVerifyUrl(lotId), [lotId]);
  return (
    <QRCodeSVG value={url} size={size} level={level} includeMargin />
  );
}
