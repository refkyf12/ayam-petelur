import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { PenjagaLogin } from "@/components/PenjagaLogin";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Catatan Ayam Petelur",
  description: "Pencatatan produksi telur, biaya, HPP, dan penjualan",
  appleWebApp: { capable: true, title: "Ayam Petelur", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#256338",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="antialiased">
        <PenjagaLogin>{children}</PenjagaLogin>
      </body>
    </html>
  );
}
