"use client";

import { useCallback, useEffect, useState } from "react";
import { useToast } from "@/context/ToastContext";
import { listVerifiedFactors, removeFactor, startEnrollment, verifyCode, type Enrollment, type TotpFactor } from "@/lib/mfa";
import { ConfirmModal, Modal } from "@/components/ui/Modal";

/** Estado de la verificación en dos pasos y cómo activarla o quitarla. */
export function SecurityModal({ open, onClose, onChange }: { open: boolean; onClose: () => void; onChange?: (enabled: boolean) => void }) {
  const { showToast } = useToast();
  const [factors, setFactors] = useState<TotpFactor[] | null>(null);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const refresh = useCallback(async () => {
    const list = await listVerifiedFactors();
    setFactors(list);
    onChange?.(list.length > 0);
  }, [onChange]);

  useEffect(() => {
    if (open) {
      setEnrollment(null);
      setCode("");
      setError(null);
      refresh();
    }
  }, [open, refresh]);

  async function begin() {
    setBusy(true);
    setError(null);
    const result = await startEnrollment();
    setBusy(false);
    if ("error" in result) return setError(result.error);
    setEnrollment(result);
  }

  async function confirm() {
    if (!enrollment) return;
    setBusy(true);
    setError(null);
    const message = await verifyCode(enrollment.id, code);
    setBusy(false);
    if (message) return setError(message);
    setEnrollment(null);
    setCode("");
    await refresh();
    showToast("Verificación en dos pasos activada. Desde ahora te pediremos un código al iniciar sesión.");
  }

  async function remove() {
    if (!factors?.[0]) return;
    const message = await removeFactor(factors[0].id);
    if (message) return showToast(`No se pudo desactivar: ${message}`, { tone: "error" });
    await refresh();
    showToast("Verificación en dos pasos desactivada.", { tone: "info" });
  }

  const enabled = (factors?.length ?? 0) > 0;

  return (
    <>
      <Modal open={open} onClose={onClose} title="Seguridad de la cuenta" description="Verificación en dos pasos con una aplicación autenticadora." size="sm">
        {factors === null ? (
          <p className="text-sm text-muted" aria-busy="true">Cargando…</p>
        ) : enrollment ? (
          <div className="space-y-4">
            <ol className="list-decimal space-y-1 pl-5 text-[13.5px] text-muted">
              <li>Instala Google Authenticator, Authy o 1Password en tu celular.</li>
              <li>Escanea este código QR (o escribe la clave a mano).</li>
              <li>Escribe aquí el código de 6 dígitos que muestre la aplicación.</li>
            </ol>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enrollment.qr} alt="Código QR para la aplicación autenticadora" className="mx-auto h-44 w-44 rounded-xl border border-line bg-white p-2" />
            <p className="break-all rounded-xl bg-ivory px-3 py-2 text-center font-mono text-[12px] text-ink">{enrollment.secret}</p>
            <div>
              <label htmlFor="sec-code" className="field-label">Código de 6 dígitos</label>
              <input id="sec-code" className="field text-center tracking-[0.3em]" inputMode="numeric" autoComplete="one-time-code" maxLength={7} value={code} onChange={(e) => setCode(e.target.value)} />
            </div>
            {error && <p role="alert" className="field-error">{error}</p>}
            <div className="flex gap-2">
              <button type="button" className="btn btn-primary flex-1" disabled={busy} onClick={confirm}>{busy ? "Verificando…" : "Activar"}</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEnrollment(null)}>Cancelar</button>
            </div>
          </div>
        ) : enabled ? (
          <div className="space-y-4">
            <p className="rounded-xl bg-success-soft px-4 py-3 text-[13.5px] font-medium text-success">Verificación en dos pasos activada.</p>
            <p className="text-[13px] text-muted">Al iniciar sesión te pedimos el código de tu aplicación. Si pierdes el celular, necesitarás recuperar el acceso desde Supabase (Authentication → Users → la cuenta → eliminar el factor).</p>
            <button type="button" className="btn btn-secondary w-full" onClick={() => setConfirmRemove(true)}>Desactivar</button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="rounded-xl bg-warning-soft px-4 py-3 text-[13.5px] font-medium text-warning">Aún no está activada.</p>
            <p className="text-[13px] text-muted">Con la verificación en dos pasos, aunque alguien conozca tu contraseña no podrá entrar al panel sin el código de tu celular. Te recomendamos activarla.</p>
            {error && <p role="alert" className="field-error">{error}</p>}
            <button type="button" className="btn btn-primary w-full" disabled={busy} onClick={begin}>{busy ? "Preparando…" : "Activar ahora"}</button>
          </div>
        )}
      </Modal>
      <ConfirmModal
        open={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        onConfirm={remove}
        title="¿Desactivar la verificación en dos pasos?"
        message="Tu cuenta quedará protegida solo con la contraseña."
        confirmLabel="Desactivar"
        danger
      />
    </>
  );
}
