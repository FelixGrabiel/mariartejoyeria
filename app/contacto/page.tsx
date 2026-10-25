import type { Metadata } from "next";
import { ContactForm } from "@/components/contact/ContactForm";
import { faqs } from "@/data/content";
import { site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { ChevronDown, Instagram, MessageCircle } from "@/components/ui/icons";
import { DemoNotice, Ornament } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Escríbele a MariArte por WhatsApp o Instagram. Preguntas frecuentes sobre pedidos y envíos.",
};

export default function ContactPage() {
  return (
    <div className="container-page pt-10 sm:pt-14">
      <header className="max-w-2xl">
        <Ornament className="mb-5" />
        <p className="eyebrow mb-4">Contacto</p>
        <h1 className="font-serif text-[2.8rem] font-medium leading-[0.98] sm:text-[4rem]">
          Estamos para <span className="italic text-rose-deep">ayudarte a elegir</span>
        </h1>
        <p className="mt-5 text-[15.5px] leading-relaxed text-muted">
          La forma más rápida de comprar o consultar es por WhatsApp. También puedes escribirnos por Instagram.
        </p>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
        <div className="min-w-0 space-y-4">
          <a
            href={whatsappUrl("Hola, MariArte. Quisiera hacer una consulta.")}
            target="_blank"
            rel="noopener noreferrer"
            className="card group flex items-center gap-5 p-6 transition hover:border-rose/40"
          >
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#1f7a4d] text-white">
              <MessageCircle size={24} />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne-deep">WhatsApp comercial</span>
              <span className="block break-words font-serif text-[1.35rem] font-semibold sm:text-[1.6rem]">{site.whatsappDisplay}</span>
              <span className="text-sm text-muted">Abre el chat con un mensaje listo</span>
            </span>
          </a>
          <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="card group flex items-center gap-5 p-6 transition hover:border-rose/40">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-blush text-rose-deep">
              <Instagram size={24} />
            </span>
            <span className="min-w-0">
              <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-champagne-deep">Instagram</span>
              <span className="block break-words font-serif text-[1.35rem] font-semibold sm:text-[1.6rem]">{site.instagramHandle}</span>
              <span className="text-sm text-muted">Novedades, fotos y mensajes directos</span>
            </span>
          </a>
          <DemoNotice>Horario de atención y tiempos de respuesta por confirmar con la marca.</DemoNotice>
        </div>

        <div className="min-w-0">
          <h2 className="mb-5 font-serif text-[1.9rem] font-semibold">Déjanos un mensaje</h2>
          <ContactForm />
        </div>
      </div>

      <section id="preguntas" aria-labelledby="faq-title" className="mx-auto mt-24 max-w-3xl scroll-mt-28">
        <p className="eyebrow mb-3 text-center">Preguntas frecuentes</p>
        <h2 id="faq-title" className="text-center font-serif text-[2.3rem] font-semibold sm:text-[2.8rem]">
          Pedidos y envíos
        </h2>
        <div className="mt-8 divide-y divide-line border-y border-line">
          {faqs.map((faq) => (
            <details key={faq.question} className="group">
              <summary className="flex min-h-16 cursor-pointer list-none items-center justify-between gap-4 py-4 text-[16px] font-semibold text-ink [&::-webkit-details-marker]:hidden">
                {faq.question}
                <ChevronDown size={18} className="shrink-0 text-muted transition group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-[15px] leading-relaxed text-muted">{faq.answer}</p>
            </details>
          ))}
        </div>
        <p className="mt-4 text-center text-[12px] text-muted">Respuestas provisionales: edítalas en data/content.ts.</p>
      </section>
    </div>
  );
}
