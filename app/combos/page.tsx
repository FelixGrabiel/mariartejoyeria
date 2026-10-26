import type { Metadata } from "next";
import { CombosView } from "@/components/combo/CombosView";

export const metadata: Metadata = {
  title: "Combina y ahorra",
  description: "Conjuntos de joyas para compartir, con promociones cuando están vigentes.",
};

export default function CombosPage() {
  return <CombosView />;
}
