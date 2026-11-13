"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useToast } from "@/context/ToastContext";
import { couponLabel, couponStatus, isValidCouponCode, normalizeCouponCode, type Coupon, type CouponKind, type CouponStatus } from "@/lib/coupon";
import { formatDate, formatPrice } from "@/lib/format";
import { dbDeleteCoupon, dbSaveCoupon, fetchCoupons } from "@/lib/supabase";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { ConfirmModal } from "@/components/ui/Modal";
import { Plus, Trash } from "@/components/ui/icons";

const statusTone: Record<CouponStatus, BadgeTone> = { activo: "success", pausado: "neutral", programado: "champagne", vencido: "danger", agotado: "warning" };

function parseNumber(text: string): number | null {
  const n = Number(text.trim().replace(",", "."));
  return text.trim() === "" || Number.isNaN(n) ? null : n;
}

/** «2026-12-31» del input de fecha → fin de ese día en hora de Perú (UTC-5). */
const endOfDay = (d: string): string => new Date(`${d}T23:59:59-05:00`).toISOString();
const startOfDay = (d: string): string => new Date(`${d}T00:00:00-05:00`).toISOString();

/** Cupones de descuento: código, % o monto fijo, compra mínima, vigencia y límite de usos. El servidor los valida al registrar el pedido. */
export function CouponsPanel() {
  const { showToast } = useToast();
  const [coupons, setCoupons] = useState<Coupon[] | null>(null);
  const [code, setCode] = useState("");
  const [kind, setKind] = useState<CouponKind>("percent");
  const [value, setValue] = useState("");
  const [min, setMin] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [maxUses, setMaxUses] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [toDelete, setToDelete] = useState<Coupon | null>(null);

  const load = useCallback(async () => {
    const list = await fetchCoupons();
    if (list) setCoupons(list);
    else showToast("No se pudieron cargar los cupones. ¿Ya aplicaste la migración de cupones en Supabase?", { tone: "error" });
  }, [showToast]);

  useEffect(() => {
    load();
  }, [load]);

  async function save(c: Coupon, okMessage: string) {
    const message = await dbSaveCoupon(c);
    if (message) showToast(`No se pudo guardar: ${message}`, { tone: "error" });
    else showToast(okMessage);
    load();
  }

  async function onAdd(event: FormEvent) {
    event.preventDefault();
    const clean = normalizeCouponCode(code);
    if (!isValidCouponCode(clean)) return setError("El código debe tener entre 3 y 24 letras, números, guion o guion bajo (sin espacios).");
    if (coupons?.some((c) => c.code === clean)) return setError("Ya existe un cupón con ese código.");
    const v = parseNumber(value);
    if (v === null || v <= 0) return setError(kind === "percent" ? "Escribe el porcentaje (1 a 100)." : "Escribe el monto de descuento en soles.");
    if (kind === "percent" && v > 100) return setError("El porcentaje no puede pasar de 100.");
    const minimum = min.trim() === "" ? 0 : parseNumber(min);
    if (minimum === null || minimum < 0) return setError("La compra mínima debe ser 0 o más.");
    const uses = maxUses.trim() === "" ? undefined : parseNumber(maxUses);
    if (uses === null || (uses !== undefined && (!Number.isInteger(uses) || uses < 1))) return setError("El límite de usos debe ser un número entero mayor que 0, o vacío.");
    if (from && to && to < from) return setError("La fecha final no puede ser anterior a la inicial.");
    await save(
      {
        code: clean,
        kind,
        value: Math.round(v * 100) / 100,
        minSubtotal: Math.round(minimum * 100) / 100,
        startsAt: from ? startOfDay(from) : undefined,
        endsAt: to ? endOfDay(to) : undefined,
        maxUses: uses,
        uses: 0,
        active: true,
        note: note.trim().slice(0, 120),
      },
      `Cupón ${clean} creado.`,
    );
    setCode("");
    setValue("");
    setMin("");
    setFrom("");
    setTo("");
    setMaxUses("");
    setNote("");
    setError("");
  }

  const now = new Date();

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-line bg-white p-5 text-[13.5px] leading-relaxed text-muted">
        <p className="font-semibold text-ink">Cómo funcionan los cupones</p>
        <ul className="mt-2 list-disc space-y-1 pl-5">
          <li>La clienta escribe el código en el carrito y ve el descuento antes de pedir. El servidor lo vuelve a calcular al registrar el pedido: no se puede alterar.</li>
          <li>El descuento se aplica sobre el subtotal de productos (ya con los precios de los combos) y no sobre el envío. Un pedido usa un solo cupón.</li>
          <li>Los códigos no se pueden listar desde la web, y los intentos se limitan por persona para que nadie los adivine. Comparte el código solo con quien quieras.</li>
          <li>Si un cupón se pausa o vence, los pedidos ya hechos conservan su descuento.</li>
        </ul>
      </div>

      <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
        <form onSubmit={onAdd} noValidate className="rounded-2xl border border-line bg-white p-5 xl:self-start">
          <h3 className="font-serif text-[1.5rem] font-semibold">Nuevo cupón</h3>
          <div className="mt-5 space-y-4">
            <div>
              <label htmlFor="cp-code" className="field-label">Código</label>
              <input id="cp-code" className="field uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="BIENVENIDA10" maxLength={24} autoComplete="off" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cp-kind" className="field-label">Tipo</label>
                <select id="cp-kind" className="field" value={kind} onChange={(e) => setKind(e.target.value as CouponKind)}>
                  <option value="percent">Porcentaje (%)</option>
                  <option value="amount">Monto fijo (S/)</option>
                </select>
              </div>
              <div>
                <label htmlFor="cp-value" className="field-label">{kind === "percent" ? "Porcentaje" : "Monto (S/)"}</label>
                <input id="cp-value" inputMode="decimal" className="field" value={value} onChange={(e) => setValue(e.target.value)} placeholder={kind === "percent" ? "10" : "15"} />
              </div>
            </div>
            <div>
              <label htmlFor="cp-min" className="field-label">Compra mínima (S/) · opcional</label>
              <input id="cp-min" inputMode="decimal" className="field" value={min} onChange={(e) => setMin(e.target.value)} placeholder="Ej.: 80" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="cp-from" className="field-label">Desde · opcional</label>
                <input id="cp-from" type="date" className="field" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <label htmlFor="cp-to" className="field-label">Hasta · opcional</label>
                <input id="cp-to" type="date" className="field" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
            </div>
            <div>
              <label htmlFor="cp-max" className="field-label">Máximo de usos · opcional</label>
              <input id="cp-max" inputMode="numeric" className="field" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} placeholder="Ej.: 50" />
            </div>
            <div>
              <label htmlFor="cp-note" className="field-label">Nota interna · opcional</label>
              <input id="cp-note" className="field" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Ej.: sorteo de Instagram" maxLength={120} />
            </div>
            {error && <p role="alert" className="field-error">{error}</p>}
            <button type="submit" className="btn btn-primary w-full">
              <Plus size={17} /> Crear cupón
            </button>
          </div>
        </form>

        <div className="space-y-3">
          {coupons === null && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">Cargando cupones…</p>}
          {coupons?.length === 0 && <p className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">Aún no hay cupones.</p>}
          {coupons?.map((c) => {
            const status = couponStatus(c, now);
            return (
              <div key={c.code} className="rounded-2xl border border-line bg-white p-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="font-mono text-[15px] font-semibold tracking-wide text-ink">{c.code}</p>
                  <Badge tone={statusTone[status]}>{status}</Badge>
                  <span className="flex-1 text-[13.5px] font-medium text-rose-deep">{couponLabel(c)}</span>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => save({ ...c, active: !c.active }, c.active ? `Cupón ${c.code} pausado.` : `Cupón ${c.code} activado.`)}>
                    {c.active ? "Pausar" : "Activar"}
                  </button>
                  <button type="button" className="icon-btn text-muted hover:text-danger" aria-label={`Eliminar el cupón ${c.code}`} onClick={() => setToDelete(c)}>
                    <Trash size={18} />
                  </button>
                </div>
                <p className="mt-2 text-[12.5px] text-muted">
                  Usos: {c.uses}
                  {c.maxUses !== undefined ? ` de ${c.maxUses}` : " (sin límite)"}
                  {c.minSubtotal > 0 ? ` · compra mínima ${formatPrice(c.minSubtotal)}` : ""}
                  {c.startsAt ? ` · desde ${formatDate(c.startsAt)}` : ""}
                  {c.endsAt ? ` · hasta ${formatDate(c.endsAt)}` : ""}
                  {c.note ? ` · ${c.note}` : ""}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <ConfirmModal
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={async () => {
          if (toDelete) {
            const message = await dbDeleteCoupon(toDelete.code);
            if (message) showToast(`No se pudo eliminar: ${message}`, { tone: "error" });
            else showToast(`Cupón ${toDelete.code} eliminado.`);
            load();
          }
          setToDelete(null);
        }}
        title="¿Eliminar este cupón?"
        message="Los pedidos ya hechos conservan el código y el descuento que tenían. Si solo quieres dejar de ofrecerlo, pausa el cupón."
        confirmLabel="Eliminar"
        danger
      />
    </div>
  );
}
