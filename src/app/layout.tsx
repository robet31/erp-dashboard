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
    /**
     * suppressHydrationWarning ditambahkan pada html dan body 
     * untuk mencegah error akibat ekstensi browser yang menyuntikkan 
     * atribut tambahan (seperti cz-shortcut-listen).
     */
    <html lang="id" suppressHydrationWarning>
      <body 
        style={{ fontFamily: "'Montserrat', sans-serif" }} 
        suppressHydrationWarning
      >
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}