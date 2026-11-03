import { supabase } from "@/lib/supabase";

/** Verificación en dos pasos (TOTP: Google Authenticator, Authy, 1Password…) con Supabase Auth. */

export interface TotpFactor {
  id: string;
  friendlyName?: string;
}

/** Factores TOTP ya verificados del administrador con sesión. */
export async function listVerifiedFactors(): Promise<TotpFactor[]> {
  if (!supabase) return [];
  const { data } = await supabase.auth.mfa.listFactors();
  return (data?.totp ?? []).map((f) => ({ id: f.id, friendlyName: f.friendly_name ?? undefined }));
}

/** ¿La sesión necesita un código? (tiene la verificación activada pero aún no la completó). */
export async function needsMfaChallenge(): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  return data?.nextLevel === "aal2" && data.currentLevel !== "aal2";
}

export interface Enrollment {
  id: string;
  qr: string;
  secret: string;
}

/** Empieza a activar la verificación: devuelve el código QR y la clave para escribir a mano. */
export async function startEnrollment(): Promise<Enrollment | { error: string }> {
  if (!supabase) return { error: "Supabase no está configurado." };
  // Limpia intentos anteriores sin terminar.
  const { data: existing } = await supabase.auth.mfa.listFactors();
  for (const f of existing?.all ?? []) {
    if (f.factor_type === "totp" && f.status === "unverified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp", friendlyName: `MariArte ${new Date().toISOString().slice(0, 16)}` });
  if (error || !data) return { error: error?.message ?? "No se pudo iniciar la activación. ¿Está habilitada la verificación en dos pasos (TOTP) en Supabase?" };
  return { id: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

/** Confirma un código de 6 dígitos para un factor (sirve para activar y para iniciar sesión). Devuelve un error o null. */
export async function verifyCode(factorId: string, code: string): Promise<string | null> {
  if (!supabase) return "Supabase no está configurado.";
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return "Escribe los 6 dígitos del código.";
  const challenge = await supabase.auth.mfa.challenge({ factorId });
  if (challenge.error || !challenge.data) return "No se pudo validar el código. Inténtalo de nuevo.";
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.data.id, code: clean });
  return error ? "Código incorrecto o vencido. Prueba con el que muestra tu aplicación ahora." : null;
}

export async function removeFactor(factorId: string): Promise<string | null> {
  if (!supabase) return "Supabase no está configurado.";
  const { error } = await supabase.auth.mfa.unenroll({ factorId });
  return error?.message ?? null;
}
