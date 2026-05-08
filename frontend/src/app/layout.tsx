import type { Metadata } from "next";
import { Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import ClientLayout from "./client-layout";

const noto = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-noto",
  display: "swap",
});

export const metadata: Metadata = {
  title: "سكك حديد مصر - نظام السكرتارية",
  description: "نظام إدارة المراسلات الواردة والصادرة",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className={`${noto.variable} h-full antialiased`}>
      <body className="min-h-full bg-gray-50 dark:bg-gray-900 font-sans">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
