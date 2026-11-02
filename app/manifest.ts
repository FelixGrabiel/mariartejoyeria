import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "MariArte | Joyería y Accesorios",
    short_name: "MariArte",
    description: "Joyas con significado, detalles que conectan.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF9F5",
    theme_color: "#FFF9F5",
    lang: "es-PE",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
      { src: "/apple-icon.png", sizes: "180x180", type: "image/png" },
    ],
  };
}
