"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AssistantBot } from "@/components/bot/AssistantBot";
import { Footer } from "./Footer";
import { Header } from "./Header";
import { TopBar } from "./TopBar";
import { WhatsAppFloat } from "./WhatsAppFloat";

/** Envuelve la tienda con barra superior, header y footer. El panel admin usa su propio layout. */
export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[90] focus:rounded-full focus:bg-ink focus:px-5 focus:py-3 focus:text-ivory"
      >
        Saltar al contenido
      </a>
      <TopBar />
      <Header />
      <main id="contenido" className="min-h-[60vh]">
        {children}
      </main>
      <Footer />
      {pathname !== "/carrito" && !pathname?.startsWith("/producto/") && <WhatsAppFloat />}
      <AssistantBot />
    </>
  );
}
