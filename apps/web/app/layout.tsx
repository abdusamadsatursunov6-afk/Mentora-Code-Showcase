import type { Metadata, Viewport } from "next";

import { PwaRegister } from "@/components/pwa-register";
import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n-context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mentora — Education Operating System",
  description: "Mentora turns teaching intent into structured, verifiable, and editable lessons.",
  applicationName: "Mentora",
  manifest: "/manifest.webmanifest",
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [
      { url: "/icons/mentora-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/mentora-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/mentora-apple-touch.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Mentora",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#172554",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>
        <AuthProvider>
          <I18nProvider>
            <PwaRegister />
            {children}
          </I18nProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
