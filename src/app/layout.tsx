import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/providers";

export const metadata: Metadata = {
  title: "ERP Dashboard | Manufacturing System",
  description: "Mini Manufacturing ERP System - Selling, Stock & Manufacturing",
  keywords: "ERP, Manufacturing, Inventory, Sales, Dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body style={{ fontFamily: "'Montserrat', sans-serif" }}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
