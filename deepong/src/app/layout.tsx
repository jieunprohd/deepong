import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "디퐁",
  description: "친구와 편히 소통하면서도 서로의 집중을 지켜주는 데스크톱 메신저",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
