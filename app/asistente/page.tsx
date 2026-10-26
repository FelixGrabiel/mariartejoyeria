import type { Metadata } from "next";
import { JewelFinder } from "@/components/assistant/JewelFinder";

export const metadata: Metadata = {
  title: "Encuentra tu joya ideal",
  description: "Responde cinco preguntas y te mostramos joyas disponibles que encajan contigo.",
};

export default function AssistantPage() {
  return <JewelFinder />;
}
