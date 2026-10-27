"use client";

import { useRef, useState, type MouseEvent } from "react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/format";
import { dbCreateOrder, supabase } from "@/lib/supabase";
import { whatsappUrl } from "@/lib/whatsapp";
import { normalizePhone, type Customer } from "@/lib/customer";
import { readStorage, writeStorage } from "@/lib/storage";
import type { CartItem, ComboCartItem } from "@/types";
import { MessageCircle } from "@/components/ui/icons";

const LAST_ORDER_KEY = "mariarte.v1.lastOrder";

/**
 * Abre WhatsApp con el pedido prellenado. NO envía nada automáticamente:
 * la persona revisa el mensaje en WhatsApp y decide si lo envía.
 */
export function WhatsAppCheckoutButton({
  message,
  items,
  combos,
  customer,
  buildMessage,
  disabled = false,
  className,
  label = "Pedir por WhatsApp",
}: {
  message: string;
  /** Productos del carrito: si hay Supabase, el pedido se registra antes de abrir WhatsApp. */
  items?: CartItem[];
  combos?: ComboCartItem[];
  /** Datos de contacto: obligatorios para registrar el pedido. */
  customer?: Customer;
  /** Arma el texto final de WhatsApp una vez que se conoce el código del pedido. */
  buildMessage?: (orderCode: string) => string;
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);
  // Guardia síncrona: dos clics en el mismo instante no pueden registrar dos pedidos.
  const submitting = useRef(false);

  async function placeOrderAndOpen(event: MouseEvent<HTMLAnchorElement>) {
    if (!supabase || (!items?.length && !combos?.length)) {
      showToast("Abrimos WhatsApp con tu pedido. Revísalo y envíalo cuando quieras.", { tone: "info" });
      return;
    }
    event.preventDefault();
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    const who = customer ?? { name: "", phone: "", district: "", address: "" };
    // Si el cliente vuelve a pulsar con exactamente el mismo pedido y datos, se reabre el ya registrado.
    const signature = JSON.stringify({ items, combos, who: { ...who, phone: normalizePhone(who.phone) } });
    const last = readStorage<{ signature: string; code: string; at: number } | null>(LAST_ORDER_KEY, null);
    const repeated = last && last.signature === signature && Date.now() - last.at < 30 * 60 * 1000 ? last.code : null;
    // Se abre la pestaña de inmediato para que el navegador no bloquee la ventana emergente.
    const tab = window.open("about:blank", "_blank");
    const result = repeated ? { code: repeated } : await dbCreateOrder(items ?? [], who, combos ?? []);
    submitting.current = false;
    setBusy(false);
    if ("error" in result) {
      tab?.close();
      showToast(`No pudimos registrar tu pedido: ${result.error}`, { tone: "error" });
      return;
    }
    if (!repeated) writeStorage(LAST_ORDER_KEY, { signature, code: result.code, at: Date.now() });
    const text = buildMessage ? buildMessage(result.code) : `Pedido web ${result.code}\n\n${message}`;
    if (tab) tab.location.href = whatsappUrl(text);
    else window.location.href = whatsappUrl(text);
    showToast(
      repeated
        ? `Tu pedido ${result.code} ya estaba registrado. Reabrimos WhatsApp, sin duplicarlo.`
        : `Pedido ${result.code} registrado. Envía el mensaje en WhatsApp para confirmarlo.`,
      { tone: repeated ? "info" : "success", action: { label: "Seguir pedido", href: "/pedido" } },
    );
  }

  if (disabled) {
    return (
      <button type="button" disabled className={cn("btn btn-whatsapp w-full", className)}>
        <MessageCircle size={18} /> {label}
      </button>
    );
  }

  return (
    <a
      href={whatsappUrl(message)}
      target="_blank"
      rel="noopener noreferrer"
      className={cn("btn btn-whatsapp w-full", className)}
      onClick={placeOrderAndOpen}
      aria-busy={busy}
    >
      <MessageCircle size={18} /> {busy ? "Registrando pedido…" : label}
    </a>
  );
}
