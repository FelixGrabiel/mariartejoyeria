import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Inter } from "next/font/google";
import type { ReactNode } from "react";
import { SiteShell } from "@/components/layout/SiteShell";
import { StoreProvider } from "@/context/StoreContext";
import { ToastProvider } from "@/context/ToastContext";
import { site, siteUrl } from "@/data/site";
import { getCatalog } from "@/lib/server-catalog";
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

/** Regenera el catálogo desde Supabase como máximo cada 60 s; el navegador refresca el stock en vivo. */
export const revalidate = 60;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
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
    url: "/",
    images: [{ url: "/images/pulsera-duo.jpg", alt: "Pulseras de hilo rojo de MariArte" }],
  },
  twitter: { card: "summary_large_image", title: site.fullName, description: site.description, images: ["/images/pulsera-duo.jpg"] },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#FFF9F5",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const catalog = await getCatalog();
  return (
    <html lang="es-PE" className={`${cormorant.variable} ${inter.variable}`}>
      <body>
        <ToastProvider>
          <StoreProvider initialCatalog={catalog}>
            <SiteShell>{children}</SiteShell>
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
