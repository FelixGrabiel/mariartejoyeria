import type { Category } from "@/types";

export const categories: Category[] = [
  {
    id: "pulseras",
    name: "Pulseras",
    description: "Hilo rojo, dijes y cuentas para llevar a diario.",
    image: "/images/pulsera-ojo.jpg",
  },
  {
    id: "collares",
    name: "Collares",
    description: "Cadenas finas y dijes delicados.",
  },
  {
    id: "anillos",
    name: "Anillos",
    description: "Aros finos para promesas y recuerdos.",
  },
  {
    id: "sets",
    name: "Sets",
    description: "Dúos para parejas, familia y amistades.",
    image: "/images/pulsera-duo.jpg",
  },
  {
    id: "regalos",
    name: "Regalos",
    description: "Con bolsita, tarjeta y dedicatoria.",
    image: "/images/pulseras-medallas.jpg",
  },
];

export function getCategory(id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}
