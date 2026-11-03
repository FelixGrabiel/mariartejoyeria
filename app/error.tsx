"use client";

import { useEffect } from "react";
import { site } from "@/data/site";
import { reportError } from "@/lib/report-error";
import { whatsappUrl } from "@/lib/whatsapp";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportError(error, "pantalla");
  }, [error]);
  return (
    <div className="container-page max-w-xl py-24 text-center">
      <h1 className="font-serif text-[2.4rem] font-semibold">Algo salió mal</h1>
      <p className="mt-3 text-[15px] text-muted">
        Ya registramos el problema. Puedes intentarlo de nuevo o escribirnos por WhatsApp al {site.whatsappDisplay}.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>Intentar de nuevo</button>
        <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">Escribir por WhatsApp</a>
      </div>
    </div>
  );
}
