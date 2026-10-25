import Image from "next/image";
import Link from "next/link";
import { categories } from "@/data/categories";
import { testimonials } from "@/data/content";
import { site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { ArrowRight, Gift, Instagram, MessageCircle, Package, PenLine, Quote, Sparkles, Truck } from "@/components/ui/icons";
import { DemoNotice, Ornament, SectionHeading } from "@/components/ui/misc";
import { CategoryCard } from "./CategoryCard";

export function CategoriesSection() {
  return (
    <section aria-labelledby="categories-title" className="mt-4">
      <div className="container-page">
        <SectionHeading id="categories-title" eyebrow="Para cada momento" title="Explora por categoría" />
      </div>
      <div className="no-scrollbar flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-auto sm:max-w-[1240px] sm:px-7 lg:px-10 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible lg:grid-cols-5">
        {categories.map((c) => (
          <CategoryCard key={c.id} category={c} />
        ))}
      </div>
    </section>
  );
}

export function GiftSection() {
  const items = [
    { icon: Package, title: "Bolsita de tela", text: "Cada pieza viaja protegida y lista para entregar." },
    { icon: PenLine, title: "Tu dedicatoria", text: "Escríbela en el carrito y viaja con tu pedido." },
    { icon: Sparkles, title: "Sets para compartir", text: "Dúos para pareja, familia o mejores amigas." },
  ];
  return (
    <section id="regalos" aria-labelledby="gifts-title" className="mt-24 scroll-mt-28 sm:mt-32">
      <div className="container-page">
        <div className="grid overflow-hidden rounded-[2.2rem] bg-blush-soft lg:grid-cols-2">
          <div className="relative min-h-[340px] lg:min-h-[560px]">
            <Image
              src="/images/pulseras-medallas.jpg"
              alt="Dos pulseras tejidas con medalla junto a una bolsita de tela MariArte"
              fill
              sizes="(min-width: 1024px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="flex flex-col justify-center p-7 sm:p-12 lg:p-16">
            <Ornament className="mb-5" />
            <p className="eyebrow mb-4">Regalos con significado</p>
            <h2 id="gifts-title" className="font-serif text-[2.4rem] font-semibold leading-[1.02] sm:text-[3.2rem]">
              Un detalle que dice <span className="italic text-rose-deep">lo que sientes</span>
            </h2>
            <p className="mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              Elige la pieza, agrega una dedicatoria y la preparamos para que llegue lista para regalar.
            </p>
            <ul className="mt-8 space-y-5">
              {items.map(({ icon: Icon, title, text }) => (
                <li key={title} className="flex gap-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white text-rose">
                    <Icon size={19} />
                  </span>
                  <div>
                    <p className="font-semibold text-ink">{title}</p>
                    <p className="text-sm text-muted">{text}</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link href="/regalo" className="btn btn-primary">
                <Gift size={17} /> Arma tu regalo
              </Link>
              <Link href="/catalogo?categoria=regalos" className="btn btn-secondary">
                Ver regalos
              </Link>
              <Link href="/catalogo?categoria=sets" className="btn btn-secondary">
                Ver sets
              </Link>
            </div>
            <p className="mt-5 text-[12px] text-muted">Empaques y tarjetas sujetos a confirmación de la tienda.</p>
          </div>
        </div>
      </div>
    </section>
  );
}

export function BenefitsSection() {
  const benefits = [
    { icon: MessageCircle, title: "Atención personalizada", text: "Te ayudamos a elegir por WhatsApp, sin apuros." },
    { icon: Gift, title: "Empaques especiales", text: "Presentación pensada para regalar." },
    { icon: Truck, title: "Envíos a todo el Perú", text: "Costo y plazo se coordinan según tu ciudad." },
  ];
  return (
    <section aria-label="Beneficios" className="container-page mt-20 sm:mt-24">
      <ul className="grid gap-4 sm:grid-cols-3 sm:gap-6">
        {benefits.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-4 rounded-3xl border border-line bg-white/70 p-6">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blush-soft text-rose">
              <Icon size={20} />
            </span>
            <div>
              <h3 className="font-serif text-[1.35rem] font-semibold leading-tight">{title}</h3>
              <p className="mt-1 text-sm text-muted">{text}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TestimonialsSection() {
  return (
    <section aria-labelledby="testimonials-title" className="container-page mt-24 sm:mt-32">
      <SectionHeading
        id="testimonials-title"
        eyebrow="Lo que dicen"
        title="Historias que acompañamos"
        align="center"
        description="Espacio reservado para reseñas reales de clientas y clientes."
      />
      <ul className="grid gap-5 md:grid-cols-3">
        {testimonials.map((t) => (
          <li key={t.id} className="card relative flex flex-col p-7">
            <span className="absolute right-5 top-5 rounded-full bg-warning-soft px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-warning">
              Ejemplo
            </span>
            <Quote size={26} className="text-blush-deep" />
            <p className="mt-4 flex-1 font-serif text-[1.3rem] italic leading-snug text-ink">«{t.text}»</p>
            <p className="mt-5 text-sm font-semibold text-ink">{t.name}</p>
            <p className="text-[13px] text-muted">Sobre: {t.product}</p>
          </li>
        ))}
      </ul>
      <DemoNotice className="mx-auto mt-6 max-w-2xl">
        Testimonios de demostración: no son reseñas reales. Reemplázalos en <code className="font-mono text-[12px]">data/content.ts</code> por reseñas con autorización.
      </DemoNotice>
    </section>
  );
}

export function SocialCtaSection() {
  return (
    <section aria-labelledby="social-title" className="container-page mt-24 sm:mt-32">
      <div className="relative overflow-hidden rounded-[2.2rem] bg-rose-deep px-6 py-14 text-center text-ivory sm:px-12 sm:py-20">
        <div aria-hidden="true" className="absolute -left-20 -top-24 h-72 w-72 rounded-full bg-white/5" />
        <div aria-hidden="true" className="absolute -bottom-28 -right-10 h-80 w-80 rounded-full bg-blush/10" />
        <Ornament align="center" className="relative mb-5 text-blush" />
        <h2 id="social-title" className="relative mx-auto max-w-2xl font-serif text-[2.4rem] font-medium leading-[1.02] sm:text-[3.4rem]">
          ¿Buscas un detalle especial? <span className="italic">Conversemos.</span>
        </h2>
        <p className="relative mx-auto mt-4 max-w-lg text-[15px] text-ivory/80">
          Te ayudamos a elegir la pieza ideal y a coordinar tu pedido.
        </p>
        <div className="relative mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a href={whatsappUrl("Hola, MariArte. Quisiera ayuda para elegir un regalo.")} target="_blank" rel="noopener noreferrer" className="btn bg-ivory px-7 text-rose-deep hover:bg-white">
            <MessageCircle size={18} /> Escribir por WhatsApp
          </a>
          <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn border border-ivory/40 px-7 text-ivory hover:bg-white/10">
            <Instagram size={18} /> Ver {site.instagramHandle}
          </a>
        </div>
      </div>
    </section>
  );
}

export function StoryTeaser() {
  return (
    <section aria-labelledby="story-title" className="container-page mt-24 grid items-center gap-10 sm:mt-32 lg:grid-cols-2 lg:gap-20">
      <div className="relative mx-auto aspect-[4/5] w-full max-w-md overflow-hidden rounded-t-[999px] rounded-b-[2rem] bg-blush-soft">
        <Image
          src="/images/pulsera-cruz.jpg"
          alt="Pulsera roja con cruz sobre una bolsita de tela con el logo de MariArte"
          fill
          sizes="(min-width: 1024px) 450px, 90vw"
          className="object-cover"
        />
      </div>
      <div>
        <p className="eyebrow mb-4">Nuestra esencia</p>
        <h2 id="story-title" className="font-serif text-[2.4rem] font-semibold leading-[1.02] sm:text-[3.2rem]">
          Una joya, <span className="italic text-rose-deep">un sentimiento</span>
        </h2>
        <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
          En MariArte creemos que un accesorio puede guardar un deseo, un recuerdo o una promesa. Por eso cada pieza se elige pensando en la persona que la va a llevar.
        </p>
        <p className="mt-3 text-[12px] text-muted">Texto de marca editable · reemplazar por la historia real.</p>
        <Link href="/nosotros" className="link-underline mt-7 inline-flex items-center gap-1 text-sm font-semibold text-rose-deep">
          Conoce a MariArte <ArrowRight size={15} />
        </Link>
      </div>
    </section>
  );
}
