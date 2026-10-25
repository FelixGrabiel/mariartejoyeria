"use client";

import { useState, type FormEvent } from "react";
import { useStore } from "@/context/StoreContext";

export function AdminLogin() {
  const { signIn } = useStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const message = await signIn(email.trim(), password);
    if (message) setError(message);
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
