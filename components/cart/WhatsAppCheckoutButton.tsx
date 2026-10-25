"use client";

import { useState, type MouseEvent } from "react";
import { useToast } from "@/context/ToastContext";
import { cn } from "@/lib/format";
import { dbCreateOrder, supabase } from "@/lib/supabase";
import { whatsappUrl } from "@/lib/whatsapp";
import type { CartItem } from "@/types";
import { MessageCircle } from "@/components/ui/icons";

/**
 * Abre WhatsApp con el pedido prellenado. NO envía nada automáticamente:
 * la persona revisa el mensaje en WhatsApp y decide si lo envía.
 */
export function WhatsAppCheckoutButton({
  message,
  items,
  disabled = false,
  className,
  label = "Pedir por WhatsApp",
}: {
  message: string;
  /** Productos del carrito: si hay Supabase, el pedido se registra antes de abrir WhatsApp. */
  items?: CartItem[];
  disabled?: boolean;
  className?: string;
  label?: string;
}) {
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  async function placeOrderAndOpen(event: MouseEvent<HTMLAnchorElement>) {
    if (!supabase || !items?.length) {
      showToast("Abrimos WhatsApp con tu pedido. Revísalo y envíalo cuando quieras.", { tone: "info" });
      return;
    }
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    // Se abre la pestaña de inmediato para que el navegador no bloquee la ventana emergente.
    const tab = window.open("about:blank", "_blank");
    const result = await dbCreateOrder(items);
    setBusy(false);
    if ("error" in result) {
      tab?.close();
      showToast(`No pudimos registrar tu pedido: ${result.error}`, { tone: "error" });
      return;
    }
    const text = `Pedido web ${result.code}

${message}`;
    if (tab) tab.location.href = whatsappUrl(text);
    else window.location.href = whatsappUrl(text);
    showToast(`Pedido ${result.code} registrado. Envía el mensaje en WhatsApp para confirmarlo.`, { tone: "success" });
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
