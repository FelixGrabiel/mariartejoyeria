"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useStore } from "@/context/StoreContext";
import { listVerifiedFactors, verifyCode } from "@/lib/mfa";

/** Segundo paso del inicio de sesión: código de 6 dígitos de la aplicación autenticadora. */
export function MfaChallenge() {
  const { completeMfa, signOut } = useStore();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    listVerifiedFactors().then((f) => setFactorId(f[0]?.id ?? null));
  }, []);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setError(null);
    const message = await verifyCode(factorId, code);
    setBusy(false);
    if (message) {
      setError(message);
      setCode("");
      return;
    }
    await completeMfa();
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-[#faf5f2] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose">Verificación en dos pasos</p>
          <h1 className="font-serif text-[1.9rem] font-semibold leading-tight">Escribe tu código</h1>
          <p className="mt-2 text-[13px] text-muted">Abre tu aplicación autenticadora y escribe el código de 6 dígitos de MariArte.</p>
        </div>
        <div>
          <label htmlFor="mfa-code" className="field-label">Código</label>
          <input
            id="mfa-code"
            className="field text-center text-[1.4rem] tracking-[0.4em]"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={7}
            autoFocus
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
        </div>
        {error && <p role="alert" className="text-[13px] font-medium text-danger">{error}</p>}
        <button type="submit" className="btn btn-primary w-full" disabled={busy || !factorId}>
          {busy ? "Verificando…" : "Verificar"}
        </button>
        <button type="button" className="btn btn-secondary w-full" onClick={() => signOut()}>
          Cerrar sesión
        </button>
      </form>
    </div>
  );
}
