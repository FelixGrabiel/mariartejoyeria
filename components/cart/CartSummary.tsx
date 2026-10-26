"use client";

import { useEffect, useState } from "react";
import { useStore } from "@/context/StoreContext";
import { emptyCustomer, isCustomerValid, validateCustomer, type Customer } from "@/lib/customer";
import { readStorage, writeStorage } from "@/lib/storage";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/format";
import { buildOrderMessage } from "@/lib/whatsapp";
import { ChevronDown, Info } from "@/components/ui/icons";
import { WhatsAppCheckoutButton } from "./WhatsAppCheckoutButton";

export function CartSummary() {
  const { cartLines, comboLines, cartSubtotal, giftNote } = useStore();
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
  const message = buildOrderMessage(cartLines, giftNote, needsContact ? customer : undefined, undefined, comboLines);

  useEffect(() => {
    setCustomer(readStorage<Customer>("mariarte.v1.customer", emptyCustomer));
  }, []);
  useEffect(() => {
    writeStorage("mariarte.v1.customer", customer);
  }, [customer]);
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
        <div className="flex justify-between">
          <dt className="text-muted">Envío</dt>
          <dd className="font-medium text-rose-deep">Por confirmar</dd>
        </div>
        <div className="flex items-baseline justify-between border-t border-line pt-4">
          <dt className="font-semibold">Total referencial</dt>
          <dd className="text-xl font-semibold tabular-nums">{formatPrice(cartSubtotal)}</dd>
        </div>
      </dl>
      <p className="mt-1 text-right text-[12px] text-muted">sin incluir envío</p>

      {hasIssues && (
        <p role="alert" className="mt-4 rounded-xl bg-danger-soft px-4 py-3 text-[13px] text-danger">
          Hay piezas sin stock suficiente. No se incluirán en el mensaje hasta que ajustes la cantidad o las quites.
        </p>
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

      <div className="mt-6" onClickCapture={() => !contactOk && setTouched(true)}>
        <WhatsAppCheckoutButton
          message={message}
          items={valid.map((l) => l.item)}
          combos={validCombos.map((l) => l.item)}
          customer={customer}
          buildMessage={(code) => buildOrderMessage(cartLines, giftNote, customer, code, comboLines)}
          disabled={(valid.length === 0 && validCombos.length === 0) || !contactOk}
        />
        {(valid.length > 0 || validCombos.length > 0) && !contactOk && <p className="mt-2 text-center text-[12px] text-muted">Completa tus datos para enviar el pedido.</p>}
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
