import type { Metadata } from "next";

import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import "./globals.css";
import { LogContextProvider } from "@/context/LogContext";
import { FilterContextProvider } from "@/context/FilterContext";

export const metadata: Metadata = {
  title: "KoSyachhnik PRO",
  description: "приложение для трекинга по скалолазанию",
  manifest: '/manifest.json',
  viewport: {
    width: "device-width",
    initialScale: 1,
    viewportFit: "cover",
  },
  appleWebApp: {
    capable: true,
    title: "KS",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <meta name="theme-color" content="#001B3B" />
      </head>
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
