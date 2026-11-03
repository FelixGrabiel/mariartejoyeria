import { supabase } from "@/lib/supabase";

let sent = 0;

/** Envía un error del navegador a la base (límite por visita para no saturar). Nunca lanza. */
export function reportError(error: unknown, extra = ""): void {
  try {
    if (!supabase || sent >= 5) return;
    const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : JSON.stringify(error));
    if (/ResizeObserver loop|Script error/i.test(err.message)) return;
    sent += 1;
    void supabase
      .rpc("log_client_error", {
        p_message: extra ? `${extra}: ${err.message}` : err.message,
        p_stack: err.stack ?? "",
        p_url: typeof location !== "undefined" ? location.pathname : "",
      })
      .then(
        () => undefined,
        () => undefined,
      );
  } catch {
    /* el registro de errores jamás debe causar otro error */
  }
}
