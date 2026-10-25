import type { Metadata } from "next";
import { FavoritesView } from "@/components/product/FavoritesView";

export const metadata: Metadata = {
  title: "Favoritos",
  description: "Las joyas que guardaste para después.",
};

export default function FavoritesPage() {
  return <FavoritesView />;
}
