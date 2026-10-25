import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";

export const metadata: Metadata = {
  title: "Carrito",
  description: "Revisa tu pedido y envíalo por WhatsApp para confirmar disponibilidad y envío.",
};

export default function CartPage() {
  return <CartView />;
}
