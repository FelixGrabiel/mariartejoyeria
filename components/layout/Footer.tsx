import Link from "next/link";
import { site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { Instagram, MessageCircle } from "@/components/ui/icons";
import { Logo } from "./Logo";

const columns = [
  {
    title: "Tienda",
    links: [
      { href: "/catalogo", label: "Catálogo" },
      { href: "/catalogo?categoria=pulseras", label: "Pulseras" },
      { href: "/catalogo?categoria=sets", label: "Sets para compartir" },
      { href: "/catalogo?categoria=regalos", label: "Regalos" },
      { href: "/favoritos", label: "Favoritos" },
    ],
  },
  {
    title: "Ayuda",
    links: [
      { href: "/contacto", label: "Contacto" },
      { href: "/contacto#preguntas", label: "Preguntas frecuentes" },
      { href: "/politicas#envios", label: "Envíos" },
      { href: "/politicas#cambios", label: "Cambios y devoluciones" },
      { href: "/nosotros", label: "Sobre MariArte" },
    ],
  },
  {
    title: "Legal (provisional)",
    links: [
      { href: "/politicas#terminos", label: "Términos y condiciones" },
      { href: "/politicas#privacidad", label: "Política de privacidad" },
      { href: "/politicas#reclamaciones", label: "Libro de Reclamaciones" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="mt-20 bg-ink text-ivory/85 sm:mt-28">
      <div className="container-page grid gap-10 py-14 sm:py-16 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div>
          <Logo light />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-ivory/70">{site.tagline}.</p>
          <div className="mt-6 flex gap-2">
            <a
              href={site.instagramUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Instagram ${site.instagramHandle}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 transition hover:bg-ivory/10"
            >
              <Instagram size={18} />
            </a>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`WhatsApp ${site.whatsappDisplay}`}
              className="flex h-11 w-11 items-center justify-center rounded-full border border-ivory/20 transition hover:bg-ivory/10"
            >
              <MessageCircle size={18} />
            </a>
          </div>
          <p className="mt-5 text-sm text-ivory/70">WhatsApp: {site.whatsappDisplay}</p>
        </div>
        {columns.map((col) => (
          <div key={col.title}>
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.22em] text-blush">{col.title}</h2>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ivory/75 transition hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-ivory/10">
        <div className="container-page flex flex-col gap-2 py-5 text-[12px] text-ivory/55 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} MariArte · Prototipo de demostración: precios, stock y reseñas son de ejemplo.</p>
          <Link href="/admin-demo" className="underline-offset-4 hover:text-ivory hover:underline">
            Panel administrativo (demo)
          </Link>
        </div>
      </div>
    </footer>
  );
}
