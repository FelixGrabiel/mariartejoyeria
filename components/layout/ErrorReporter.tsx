"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";

/** Registra los errores no controlados del navegador para verlos en el panel. No muestra nada. */
export function ErrorReporter() {
  useEffect(() => {
    const onError = (e: ErrorEvent) => reportError(e.error ?? e.message);
    const onRejection = (e: PromiseRejectionEvent) => reportError(e.reason ?? "Promesa rechazada", "promesa");
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);
  return null;
}
