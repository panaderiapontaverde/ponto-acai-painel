import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ponto do Açaí Farol — Painel",
  description:
    "Ecossistema Ponto do Açaí Farol — painel de gestão (v2, em construção em paralelo ao site atual).",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
