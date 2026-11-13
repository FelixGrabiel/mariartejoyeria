"use client";

import { useRef, useState, type FormEvent } from "react";

const MAX_ATTEMPTS = 5;
const LOCK_MS = 60_000;
import { useStore } from "@/context/StoreContext";

export function AdminLogin() {
  const { signIn } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const failures = useRef(0);
  const lockedUntil = useRef(0);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    // Freno básico en el navegador; el límite real de intentos lo aplica Supabase Auth.
    const wait = lockedUntil.current - Date.now();
    if (wait > 0) {
      setError(`Demasiados intentos. Espera ${Math.ceil(wait / 1000)} s e inténtalo de nuevo.`);
      return;
    }
    setBusy(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    if (message) {
      failures.current += 1;
      if (failures.current >= MAX_ATTEMPTS) {
        failures.current = 0;
        lockedUntil.current = Date.now() + LOCK_MS;
      }
      setError(message);
    } else {
      failures.current = 0;
    }
    setBusy(false);
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-[#faf5f2] px-4">
      <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-white p-6 sm:p-8">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose">Panel administrativo</p>
          <h1 className="font-serif text-[1.9rem] font-semibold leading-tight">Iniciar sesión</h1>
        </div>
        <div>
          <label htmlFor="admin-email" className="field-label">Correo</label>
          <input
            id="admin-email"
            type="email"
            className="field"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="admin-password" className="field-label">Contraseña</label>
          <input
            id="admin-password"
            type="password"
            className="field"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && (
          <p role="alert" className="text-[13px] font-medium text-danger">
            {error}
          </p>
        )}
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {busy ? "Ingresando…" : "Ingresar"}
        </button>
      </form>
    </div>
  );
}
