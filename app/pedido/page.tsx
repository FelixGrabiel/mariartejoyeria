import type { Metadata } from "next";
import { OrderTracker } from "@/components/order/OrderTracker";

export const metadata: Metadata = {
  title: "Sigue tu pedido",
  description: "Consulta el estado de tu pedido con tu código y tu celular.",
};

export default function OrderTrackingPage() {
  return <OrderTracker />;
}
