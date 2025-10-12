import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "保険ロープレ（断る人 練習用）",
  description: "営業担当者向けロールプレイ練習アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">{children}</body>
    </html>
  );
}
