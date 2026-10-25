import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { site } from "@/data/site";
import { Gift, Heart, MessageCircle } from "@/components/ui/icons";
import { DemoNotice, Ornament } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Nosotros",
  description: "Conoce MariArte: joyas con significado, detalles que conectan.",
};

const values = [
  { icon: Heart, title: "Significado", text: "Cada dije representa algo: protección, fe, suerte o un lazo especial." },
  { icon: Gift, title: "Detalle", text: "Cuidamos la presentación para que regalar sea tan bonito como recibir." },
  { icon: MessageCircle, title: "Cercanía", text: "Atención directa y personalizada para ayudarte a elegir." },
];

export default function AboutPage() {
  return (
    <div className="container-page pt-10 sm:pt-14">
      <section className="grid items-center gap-10 lg:grid-cols-[1fr_1.05fr] lg:gap-20">
        <div>
          <Ornament className="mb-5" />
          <p className="eyebrow mb-4">Sobre MariArte</p>
          <h1 className="font-serif text-[2.9rem] font-medium leading-[0.98] sm:text-[4.2rem]">
            {site.tagline.split(",")[0]},
            <span className="block italic text-rose-deep">{site.tagline.split(",")[1]?.trim()}</span>
          </h1>
          <div className="mt-6 max-w-lg space-y-4 text-[15.5px] leading-relaxed text-muted">
            <p>
              MariArte nace de una idea sencilla: un accesorio puede acompañarnos en los momentos que importan. Un hilo rojo para la protección, una cruz para la fe, un trébol para la buena suerte.
            </p>
            <p>
              Trabajamos piezas delicadas en {site.brandMaterials}, entre otros materiales, y las presentamos listas para regalar a parejas, amigas, familia o para ti.
            </p>
          </div>
          <DemoNotice className="mt-6 max-w-lg">
            Texto de marca de demostración. Reemplázalo en <code className="font-mono text-[12px]">app/nosotros/page.tsx</code> con la historia real del emprendimiento.
          </DemoNotice>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="relative col-span-2 aspect-[16/10] overflow-hidden rounded-[2rem] bg-blush-soft">
            <Image src="/images/pulsera-duo.jpg" alt="Adulto y niño con pulseras de hilo rojo a juego" fill sizes="(min-width: 1024px) 560px, 92vw" className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-t-[999px] rounded-b-[1.6rem] bg-blush-soft">
            <Image src="/images/pulsera-suerte.jpg" alt="Pulsera de trébol presentada en tarjeta rosada" fill sizes="(min-width: 1024px) 270px, 45vw" className="object-cover" />
          </div>
          <div className="relative aspect-square overflow-hidden rounded-[1.6rem] bg-blush-soft">
            <Image src="/images/pulseras-negras.jpg" alt="Pulseras negras con ojo turco y empaque de regalo" fill sizes="(min-width: 1024px) 270px, 45vw" className="object-cover" />
          </div>
        </div>
      </section>

      <section aria-labelledby="values-title" className="mt-24">
        <h2 id="values-title" className="text-center font-serif text-[2.3rem] font-semibold sm:text-[2.8rem]">
          Lo que nos mueve
        </h2>
        <ul className="mt-10 grid gap-5 md:grid-cols-3">
          {values.map(({ icon: Icon, title, text }) => (
            <li key={title} className="card p-8 text-center">
              <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blush-soft text-rose">
                <Icon size={22} />
              </span>
              <h3 className="mt-5 font-serif text-[1.6rem] font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{text}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-20 text-center">
        <p className="font-serif text-[1.8rem] italic text-rose-deep sm:text-[2.2rem]">«Regala un detalle que diga mucho.»</p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/catalogo" className="btn btn-primary">Ver colección</Link>
          <Link href="/contacto" className="btn btn-secondary">Contáctanos</Link>
        </div>
      </section>
    </div>
  );
}
