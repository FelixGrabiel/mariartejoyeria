import type { Metadata } from "next";
import { Suspense } from "react";
import { GiftBuilder } from "@/components/gift/GiftBuilder";

export const metadata: Metadata = {
  title: "Arma tu regalo",
  description: "Elige una joya, la ocasión, el empaque y escribe tu dedicatoria. Lo confirmas por WhatsApp.",
};

export default function GiftPage() {
  return (
    <Suspense fallback={null}>
      <GiftBuilder />
    </Suspense>
  );
}
