"use client";

import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { emptyCustomer, isCustomerValid, validateCustomer, type Customer } from "@/lib/customer";
import { readStorage, writeStorage } from "@/lib/storage";
import { dbPreviewCoupon, supabase } from "@/lib/supabase";
import { normalizeCouponCode } from "@/lib/coupon";
import { formatPrice } from "@/lib/format";
import { missingForFreeShipping, shippingQuote } from "@/lib/shipping";
import { buildOrderMessage, type CouponInfo, type ShippingInfo } from "@/lib/whatsapp";
import { ChevronDown, Info } from "@/components/ui/icons";
import { WhatsAppCheckoutButton } from "./WhatsAppCheckoutButton";

export function CartSummary() {
  const { cartLines, comboLines, cartSubtotal, giftNote, activeShippingZones } = useStore();
  const valid = cartLines.filter((l) => !l.issue);
  const validCombos = comboLines.filter((l) => !l.issue);
  const units =
    valid.reduce((sum, l) => sum + l.item.quantity, 0) +
    validCombos.reduce((sum, l) => sum + l.components.reduce((s, c) => s + c.quantity, 0) * l.item.quantity, 0);
  const hasIssues = cartLines.some((l) => l.issue) || comboLines.some((l) => l.issue);
  const totalSavings = validCombos.reduce((sum, l) => sum + l.savings, 0);
  const [customer, setCustomer] = useState<Customer>(emptyCustomer);
  const [touched, setTouched] = useState(false);
  const needsContact = Boolean(supabase);
  const errors = validateCustomer(customer);
  const contactOk = !needsContact || isCustomerValid(customer);
  const [zoneId, setZoneId] = useState("");
  const zone = activeShippingZones.find((z) => z.id === zoneId);
  const zonesMode = needsContact && activeShippingZones.length > 0;
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<CouponInfo | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const discount = coupon?.discount ?? 0;
  const payable = Math.max(cartSubtotal - discount, 0);
  const quote = shippingQuote(zone, payable);
  const missingFree = missingForFreeShipping(zone, payable);
  const shipping: ShippingInfo | undefined = useMemo(
    () => (zonesMode && zone ? { zone: zone.name, cost: quote.cost, free: quote.free, pickup: zone.pickup } : undefined),
    [zonesMode, zone, quote.cost, quote.free],
  );
  const total = payable + (quote.cost ?? 0);
  const zoneOk = !zonesMode || Boolean(zone);
  const message = buildOrderMessage(cartLines, giftNote, needsContact ? customer : undefined, undefined, comboLines, shipping, coupon ?? undefined);

  useEffect(() => {
    setZoneId(readStorage<string>("mariarte.v1.shippingZone", ""));
  }, []);
  useEffect(() => {
    writeStorage("mariarte.v1.shippingZone", zoneId);
  }, [zoneId]);
  useEffect(() => {
    setCustomer(readStorage<Customer>("mariarte.v1.customer", emptyCustomer));
  }, []);
  useEffect(() => {
    writeStorage("mariarte.v1.customer", customer);
  }, [customer]);
  // Si cambia el carrito, el descuento se vuelve a pedir al servidor (compra mínima, porcentaje).
  useEffect(() => {
    if (!coupon) return;
    let cancelled = false;
    dbPreviewCoupon(coupon.code, cartSubtotal).then((res) => {
      if (cancelled) return;
      if ("error" in res) {
        setCoupon(null);
        setCouponError(res.error);
      } else if (res.discount !== coupon.discount) {
        setCoupon({ code: res.code, discount: res.discount });
      }
    });
    return () => {
      cancelled = true;
    };
    // Solo depende del subtotal y del código aplicado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cartSubtotal, coupon?.code]);

  async function applyCoupon() {
    const code = normalizeCouponCode(couponInput);
    if (!code) return setCouponError("Escribe tu código de cupón.");
    setCouponBusy(true);
    setCouponError("");
    const res = await dbPreviewCoupon(code, cartSubtotal);
    setCouponBusy(false);
    if ("error" in res) return setCouponError(res.error);
    setCoupon({ code: res.code, discount: res.discount });
    setCouponInput("");
  }

  const set = (patch: Partial<Customer>) => setCustomer((c) => ({ ...c, ...patch }));

  return (
    <aside aria-labelledby="summary-title" className="card p-6 sm:p-7 lg:sticky lg:top-28">
      <h2 id="summary-title" className="font-serif text-[1.9rem] font-semibold">
        Resumen del pedido
      </h2>

      <dl className="mt-5 space-y-3 text-[15px]">
        <div className="flex justify-between">
          <dt className="text-muted">Subtotal ({units} {units === 1 ? "pieza" : "piezas"})</dt>
          <dd className="font-semibold tabular-nums">{formatPrice(cartSubtotal)}</dd>
        </div>
        {totalSavings > 0 && (
          <div className="flex justify-between text-success">
            <dt>Ahorro en combos</dt>
            <dd className="font-semibold tabular-nums">- {formatPrice(totalSavings)}</dd>
          </div>
        )}
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <dt>Cupón {coupon?.code}</dt>
            <dd className="font-semibold tabular-nums">- {formatPrice(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt className="text-muted">{zone?.pickup ? "Recojo" : "Envío"}</dt>
          <dd className={quote.cost === null ? "font-medium text-rose-deep" : quote.free || quote.cost === 0 ? "font-semibold text-success" : "font-semibold tabular-nums"}>
            {!zone ? (zonesMode ? "Elige tu zona" : "Por confirmar") : quote.cost === null ? "Por confirmar" : quote.free ? "Gratis" : quote.cost === 0 ? "Sin costo" : formatPrice(quote.cost)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <dt className="font-semibold">Total referencial</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatPrice(zonesMode && !zone ? payable : total)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-right text-[12px] text-muted">{zonesMode && zone && quote.cost !== null ? "envío incluido" : "sin incluir envío"}</p>
      {missingFree > 0 && (
        <p className="mt-2 rounded-xl bg-success-soft px-3 py-2 text-[12.5px] text-success">Te faltan {formatPrice(missingFree)} para tener envío gratis a {zone?.name}.</p>
      )}

      {hasIssues && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">
          Hay piezas sin stock suficiente. No se incluirán en el mensaje hasta que ajustes la cantidad o las quites.
        </p>
      )}

      {needsContact && (
        <div className="mt-5">
          {coupon ? (
            <p className="flex items-center justify-between rounded-xl bg-success-soft px-3 py-2 text-[13px] text-success">
              <span>Cupón <strong>{coupon.code}</strong> aplicado</span>
              <button type="button" className="font-semibold underline" onClick={() => { setCoupon(null); setCouponError(""); }}>Quitar</button>
            </p>
          ) : (
            <>
              <label htmlFor="cu-coupon" className="field-label">¿Tienes un cupón?</label>
              <div className="flex gap-2">
                <input
                  id="cu-coupon"
                  className="field min-h-11 flex-1 uppercase"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyCoupon(); } }}
                  placeholder="CÓDIGO"
                  maxLength={24}
                  autoComplete="off"
                  aria-invalid={Boolean(couponError)}
                  aria-describedby={couponError ? "cu-coupon-error" : undefined}
                />
                <button type="button" className="btn btn-secondary btn-sm" onClick={applyCoupon} disabled={couponBusy || !couponInput.trim()}>
                  {couponBusy ? "Revisando…" : "Aplicar"}
                </button>
              </div>
            </>
          )}
          {couponError && <p id="cu-coupon-error" role="alert" className="field-error">{couponError}</p>}
        </div>
      )}

      {zonesMode && (
        <div className="mt-5">
          <label htmlFor="cu-zone" className="field-label">Zona de envío</label>
          <select id="cu-zone" className="field" value={zoneId} onChange={(e) => setZoneId(e.target.value)} aria-invalid={touched && !zone}>
            <option value="">Elige tu zona…</option>
            {activeShippingZones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name} · {z.price === null ? "costo por confirmar" : z.price === 0 ? "sin costo" : formatPrice(z.price)}
                {z.eta ? ` · ${z.eta}` : ""}
              </option>
            ))}
          </select>
          {touched && !zone && <p className="field-error">Elige una zona de envío.</p>}
          {zone && zone.freeFrom !== null && zone.price !== null && !quote.free && (
            <p className="mt-1.5 text-[12px] text-muted">Envío gratis desde {formatPrice(zone.freeFrom)}.</p>
          )}
          {zone?.price === null && <p className="mt-1.5 text-[12px] text-muted">La tienda te dirá el costo y la empresa de envío por WhatsApp antes de que pagues.</p>}
        </div>
      )}

      {needsContact && (
        <fieldset className="mt-6 space-y-3 border-t border-line pt-5">
          <legend className="mb-1 text-[13px] font-semibold text-ink">Tus datos para coordinar el pedido</legend>
          <Field id="cu-name" label="Nombre" value={customer.name} onChange={(v) => set({ name: v })} error={touched ? errors.name : undefined} autoComplete="name" />
          <Field id="cu-phone" label="Celular" value={customer.phone} onChange={(v) => set({ phone: v })} error={touched ? errors.phone : undefined} autoComplete="tel" inputMode="tel" placeholder="987 654 321" />
          <Field id="cu-district" label="Distrito o ciudad" value={customer.district} onChange={(v) => set({ district: v })} error={touched ? errors.district : undefined} autoComplete="address-level2" />
          <Field id="cu-address" label="Dirección (opcional)" value={customer.address} onChange={(v) => set({ address: v })} error={touched ? errors.address : undefined} autoComplete="street-address" />
          <p className="text-[11.5px] leading-snug text-muted">
            Usamos estos datos solo para coordinar tu pedido. Con tu código y celular podrás{" "}
            <a href="/pedido" className="link-underline text-rose-deep">seguir tu pedido</a>.
          </p>
        </fieldset>
      )}

      <div className="mt-6" onClickCapture={() => (!contactOk || !zoneOk) && setTouched(true)}>
        <WhatsAppCheckoutButton
          message={message}
          items={valid.map((l) => l.item)}
          combos={validCombos.map((l) => l.item)}
          customer={customer}
          shippingZoneId={zonesMode ? zoneId : ""}
          couponCode={coupon?.code ?? ""}
          buildMessage={(code) => buildOrderMessage(cartLines, giftNote, customer, code, comboLines, shipping, coupon ?? undefined)}
          disabled={(valid.length === 0 && validCombos.length === 0) || !contactOk || !zoneOk}
        />
        {(valid.length > 0 || validCombos.length > 0) && (!contactOk || !zoneOk) && (
          <p className="mt-2 text-center text-[12px] text-muted">{contactOk ? "Elige tu zona de envío para enviar el pedido." : "Completa tus datos para enviar el pedido."}</p>
        )}
      </div>

      <p className="mt-4 flex gap-2 text-[12.5px] leading-snug text-muted">
        <Info size={15} className="mt-0.5 shrink-0" />
        Tu pedido queda pendiente de confirmación. MariArte verificará disponibilidad, precio final, pago y envío por WhatsApp. Esta web no realiza cobros.
      </p>

      <details className="group mt-5 rounded-2xl border border-line bg-ivory">
        <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-[13px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
          Ver mensaje que se enviará
          <ChevronDown size={16} className="transition group-open:rotate-180" />
        </summary>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-words border-t border-line px-4 py-3 font-sans text-[12.5px] leading-relaxed text-muted">
          {message}
        </pre>
      </details>
    </aside>
  );
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  ...rest
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id">) {
  return (
    <div>
      <label htmlFor={id} className="field-label">{label}</label>
      <input id={id} className="field" value={value} onChange={(e) => onChange(e.target.value)} aria-invalid={Boolean(error)} aria-describedby={error ? `${id}-error` : undefined} {...rest} />
      {error && <p id={`${id}-error`} className="field-error">{error}</p>}
    </div>
  );
}
