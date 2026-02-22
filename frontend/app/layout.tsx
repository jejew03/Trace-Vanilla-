import type { Metadata } from "next";
import ClientRoot from "@/components/ClientRoot";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vanilla Trace",
  description: "Traçabilité vanille",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <ClientRoot>{children}</ClientRoot>
      </body>
    </html>
  );
}
