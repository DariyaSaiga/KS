import type { Metadata } from "next";

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { LogContextProvider } from "@/context/LogContext";
import { FilterContextProvider } from "@/context/FilterContext";

export const metadata: Metadata = {
  title: "KoSyachhnik PRO",
  description: "приложение для трекинга по скалолазанию",
  manifest: '/manifest.json'
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} antialiased`}
      >
        <LogContextProvider>
          <FilterContextProvider>
            {children}
          </FilterContextProvider>
        </LogContextProvider>
      </body>
    </html>
  );
}
