import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthProvider } from "../components/auth/auth-provider";
import { InterfaceContextProvider } from "../hooks/use-interface-context";
import { OptimisticProvider } from "../hooks/use-optimistic-updates";
import { ServiceWorkerProvider } from "../components/interface/service-worker-provider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: "MEUGRIND Productivity System",
  description: "Offline-first productivity system for multi-hyphenate creative professionals",
  manifest: "/manifest.json",
  themeColor: "#000000",
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "MEUGRIND",
  },
  icons: {
    icon: "/icon-192x192.png",
    apple: "/icon-192x192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <InterfaceContextProvider>
            <OptimisticProvider>
              <ServiceWorkerProvider>
                {children}
              </ServiceWorkerProvider>
            </OptimisticProvider>
          </InterfaceContextProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
