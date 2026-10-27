import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gift, MessageCircle } from "@/components/ui/icons";
import { Ornament } from "@/components/ui/misc";

export function HeroSection() {
  return (
    <section aria-labelledby="hero-title" className="relative overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[620px] w-[620px] rounded-full bg-blush/45 blur-3xl"
      />
      <div className="container-page relative grid items-center gap-10 pb-14 pt-8 sm:pt-12 lg:grid-cols-[1.05fr_1fr] lg:gap-6 lg:pb-24 lg:pt-16">
        <div className="rise order-2 lg:order-1">
          <Ornament className="mb-5" />
          <p className="eyebrow mb-5">Joyería y accesorios · Perú</p>
          <h1 id="hero-title" className="font-serif text-[3.1rem] font-medium leading-[0.95] tracking-[-0.01em] text-ink sm:text-[4.4rem] lg:text-[5.2rem]">
            Joyas con significado,
            <span className="block italic text-rose-deep">detalles que conectan</span>
          </h1>
          <p className="mt-6 max-w-md text-[16px] leading-relaxed text-muted sm:text-[17px]">
            Pulseras, dijes y sets pensados para acompañar a quienes quieres. Elige tu pieza y coordina tu pedido por WhatsApp.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link href="/catalogo" className="btn btn-primary px-8">
              Ver colección <ArrowRight size={17} />
            </Link>
            <Link href="/#regalos" className="btn btn-secondary px-7">
              <Gift size={17} /> Regalos con significado
            </Link>
          </div>
          <ul className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-[13px] text-muted">
            <li className="flex items-center gap-2"><MessageCircle size={15} className="text-rose" /> Atención personalizada</li>
            <li className="flex items-center gap-2"><Gift size={15} className="text-rose" /> Empaque para regalo</li>
          </ul>
        </div>

        <div className="rise rise-delay-1 relative order-1 mx-auto w-full max-w-[520px] lg:order-2">
          {/* Arco: firma visual de la marca */}
          <div className="relative ml-auto aspect-[4/5] w-[82%] overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-blush-soft shadow-soft">
            <Image
              src="/images/pulsera-ojo.jpg"
              alt="Pulsera de hilo rojo con amuleto de ojo turco en la muñeca"
              fill
              priority
              sizes="(min-width: 1024px) 430px, 80vw"
              className="object-cover"
            />
          </div>
          <div className="absolute bottom-[8%] left-0 aspect-square w-[40%] overflow-hidden rounded-full border-[6px] border-ivory bg-blush-soft shadow-soft">
            <Image
              src="/images/pulsera-perlas.jpg"
              alt="Pulsera de cuentas pastel con corazón dorado"
              fill
              sizes="(min-width: 1024px) 210px, 40vw"
              className="object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
