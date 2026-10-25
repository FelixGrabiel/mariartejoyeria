import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { StoreProvider } from "@/context/StoreContext";
import { ToastProvider } from "@/context/ToastContext";
import { site } from "@/data/site";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: `${site.fullName} · ${site.tagline}`,
    template: `%s · ${site.name}`,
  },
  description: site.description,
  applicationName: site.name,
  keywords: ["MariArte", "joyería", "pulseras", "hilo rojo", "ojo turco", "regalos", "Perú", "accesorios"],
  openGraph: {
    title: site.fullName,
    description: site.description,
    locale: "es_PE",
    type: "website",
    siteName: site.name,
  },
  robots: { index: false, follow: false }, // Prototipo: no indexar hasta publicar la versión real.
};

export const viewport: Viewport = {
  themeColor: "#FFF9F5",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es-PE" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <ToastProvider>
          <StoreProvider>
            <SiteShell>{children}</SiteShell>
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
