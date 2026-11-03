import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { ErrorReporter } from "@/components/layout/ErrorReporter";
import { SiteShell } from "@/components/layout/SiteShell";
import { StoreProvider } from "@/context/StoreContext";
import { ToastProvider } from "@/context/ToastContext";
import { site } from "@/data/site";
import { ALLOW_INDEXING, SITE_URL } from "@/lib/seo";
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

/** Visitas y velocidad (Vercel). Se activa con NEXT_PUBLIC_VERCEL_ANALYTICS=true una vez habilitado en el panel de Vercel. */
const ANALYTICS = process.env.NEXT_PUBLIC_VERCEL_ANALYTICS === "true";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
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
    images: [{ url: "/og-mariarte.jpg", width: 1200, height: 630, alt: "MariArte · Joyas con significado, detalles que conectan" }],
  },
  twitter: { card: "summary_large_image", title: site.fullName, description: site.description, images: ["/og-mariarte.jpg"] },
  // Con datos de ejemplo no se indexa. Define NEXT_PUBLIC_ALLOW_INDEXING=true en Vercel cuando cargues los datos reales.
  robots: ALLOW_INDEXING ? { index: true, follow: true } : { index: false, follow: false },
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
            <ErrorReporter />
            <SiteShell>{children}</SiteShell>
          </StoreProvider>
        </ToastProvider>
        {ANALYTICS && (
          <>
            <Analytics />
            <SpeedInsights />
          </>
        )}
      </body>
    </html>
  );
}
