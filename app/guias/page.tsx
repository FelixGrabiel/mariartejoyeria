import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { Ornament } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Guía de tallas y cuidados",
  description: "Cómo medir tu muñeca, tu dedo y el largo de un collar, y cómo cuidar tus joyas de plata, acero, hilo y cuentas.",
  alternates: { canonical: "/guias" },
};

const wristSizes = [
  ["14 – 15 cm", "16 – 17 cm"],
  ["15 – 16 cm", "17 – 18 cm"],
  ["16 – 17 cm", "18 – 19 cm"],
  ["17 – 18 cm", "19 – 20 cm"],
];

// Circunferencia del dedo (mm) → talla de anillo (equivalencia referencial EE. UU.).
const ringSizes = [
  ["49", "5"],
  ["52", "6"],
  ["54", "7"],
  ["57", "8"],
  ["59", "9"],
  ["62", "10"],
];

const necklaceLengths = [
  ["40 cm", "Pegado al cuello (gargantilla)"],
  ["45 cm", "Justo debajo del cuello"],
  ["50 cm", "A la altura de la clavícula"],
  ["60 cm", "Sobre el pecho"],
];

const care = [
  {
    title: "Plata",
    tips: [
      "Límpiala con un paño suave y seco después de usarla; si perdió brillo, usa un paño especial para plata.",
      "Guárdala aparte, en su bolsita, para que no se roce con otras piezas.",
      "Evita el cloro, el agua de mar y los productos de limpieza fuertes.",
    ],
  },
  {
    title: "Acero quirúrgico",
    tips: [
      "Resiste bien el uso diario, pero seca la pieza si se moja.",
      "Límpiala con un paño húmedo y sécala bien.",
      "Evita golpes fuertes y los químicos abrasivos.",
    ],
  },
  {
    title: "Pulseras de hilo",
    tips: [
      "Ajusta el nudo corredizo con suavidad, sin tirar de golpe.",
      "Si se moja, sécala al aire libre y evita el calor directo.",
      "Quítala para dormir o hacer deporte, así dura más.",
    ],
  },
  {
    title: "Cuentas, piedras y dijes",
    tips: [
      "Evita golpes y caídas: las cuentas y piedras pueden astillarse.",
      "Límpialas con un paño suave, sin sumergirlas en agua si el hilo es delicado.",
      "Cuida los dijes del perfume, las cremas y el sudor.",
    ],
  },
];

function Table({ caption, head, rows }: { caption: string; head: [string, string]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-white">
      <table className="w-full text-left text-[14px]">
        <caption className="sr-only">{caption}</caption>
        <thead className="bg-blush-soft/60 text-[12px] font-semibold uppercase tracking-[0.12em] text-muted">
          <tr>
            <th scope="col" className="px-4 py-3">{head[0]}</th>
            <th scope="col" className="px-4 py-3">{head[1]}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {rows.map(([a, b]) => (
            <tr key={a}>
              <th scope="row" className="px-4 py-3 font-semibold text-ink">{a}</th>
              <td className="px-4 py-3 text-muted">{b}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function GuidesPage() {
  return (
    <div className="container-page pt-10 sm:pt-14">
      <header className="max-w-2xl">
        <p className="eyebrow mb-4">Para elegir y cuidar</p>
        <h1 className="font-serif text-[2.8rem] font-medium leading-none sm:text-[3.6rem]">Guía de tallas y cuidados</h1>
        <Ornament className="mt-5" />
        <p className="mt-5 text-[15px] leading-relaxed text-muted">
          Medidas y consejos generales para elegir bien y que tus joyas te duren. Cada ficha de producto indica el material y el cuidado de esa pieza; si tienes dudas, escríbenos.
        </p>
        <nav aria-label="Secciones de la guía" className="mt-6 flex flex-wrap gap-2 text-sm font-medium">
          {[["#pulseras", "Pulseras"], ["#anillos", "Anillos"], ["#collares", "Collares"], ["#cuidados", "Cuidados"]].map(([href, label]) => (
            <a key={href} href={href} className="rounded-full border border-line bg-white px-4 py-2.5 hover:border-rose/50">{label}</a>
          ))}
        </nav>
      </header>

      <div className="mt-12 space-y-14">
        <section id="pulseras" aria-labelledby="pulseras-title" className="scroll-mt-28 grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div>
            <h2 id="pulseras-title" className="font-serif text-[2rem] font-semibold">Pulseras</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>Rodea tu muñeca con una cinta métrica flexible, o con un hilo que luego mides con una regla.</li>
              <li>Anota la medida en centímetros, justo donde llevarías la pulsera.</li>
              <li>Para una pulsera fija, elige un largo 1 a 2 cm mayor, para que quede cómoda y no apriete.</li>
            </ol>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">
              Las pulseras de hilo con nudo corredizo y las regulables se ajustan a distintas muñecas. Mira en la ficha si el modelo es ajustable.
            </p>
          </div>
          <Table caption="Largo recomendado de pulsera según la muñeca" head={["Tu muñeca", "Largo de pulsera fija"]} rows={wristSizes} />
        </section>

        <section id="anillos" aria-labelledby="anillos-title" className="scroll-mt-28 grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div>
            <h2 id="anillos-title" className="font-serif text-[2rem] font-semibold">Anillos</h2>
            <ol className="mt-4 list-decimal space-y-2 pl-5 text-[15px] leading-relaxed text-muted">
              <li>Mide la circunferencia del dedo con un hilo fino o una tira de papel y márcala.</li>
              <li>Estira el hilo sobre una regla y anota los milímetros.</li>
              <li>Mídelo al final del día, cuando los dedos están más hinchados, y busca la talla más cercana.</li>
            </ol>
            <p className="mt-4 text-[13.5px] leading-relaxed text-muted">Si estás entre dos tallas, elige la mayor. Los anillos ajustables se adaptan a varias medidas.</p>
          </div>
          <Table caption="Talla de anillo según la circunferencia del dedo" head={["Circunferencia (mm)", "Talla (equivalencia EE. UU.)"]} rows={ringSizes} />
        </section>

        <section id="collares" aria-labelledby="collares-title" className="scroll-mt-28 grid gap-6 lg:grid-cols-[1fr_1fr] lg:gap-12">
          <div>
            <h2 id="collares-title" className="font-serif text-[2rem] font-semibold">Collares</h2>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">
              El largo cambia cómo se ve el collar. Para probar, rodea tu cuello con una cinta y mira dónde te gusta que caiga el dije.
            </p>
            <p className="mt-3 text-[13.5px] leading-relaxed text-muted">Si el collar tiene cadena de extensión, el largo final se puede ajustar.</p>
          </div>
          <Table caption="Largos comunes de collar" head={["Largo", "Cómo cae"]} rows={necklaceLengths} />
        </section>

        <section id="cuidados" aria-labelledby="cuidados-title" className="scroll-mt-28">
          <h2 id="cuidados-title" className="font-serif text-[2rem] font-semibold">Cuidados</h2>
          <div className="mt-4 rounded-2xl bg-blush-soft/60 p-5 text-[14.5px] leading-relaxed text-ink">
            <p className="font-semibold">Para todas las joyas</p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-muted">
              <li>Ponte la joya al final: primero el perfume, la crema y el maquillaje.</li>
              <li>Quítatela para bañarte, nadar, hacer deporte o dormir.</li>
              <li>Guárdala seca y por separado, en su bolsita.</li>
            </ul>
          </div>
          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            {care.map((c) => (
              <article key={c.title} className="card p-6">
                <h3 className="font-serif text-[1.4rem] font-semibold">{c.title}</h3>
                <ul className="mt-3 list-disc space-y-1.5 pl-5 text-[14px] leading-relaxed text-muted">
                  {c.tips.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      </div>

      <section className="mt-16 rounded-[2rem] bg-rose-deep px-6 py-10 text-center text-ivory sm:px-12">
        <h2 className="font-serif text-[1.9rem] font-semibold">¿No estás segura de tu talla?</h2>
        <p className="mx-auto mt-2 max-w-md text-[14.5px] text-ivory/80">Escríbenos con tu medida y te ayudamos a elegir. Las medidas de esta guía son referenciales.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <a
            href={whatsappUrl("Hola, MariArte. Necesito ayuda con la talla o el largo de una joya.")}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-whatsapp"
          >
            Escribir por WhatsApp ({site.whatsappDisplay})
          </a>
          <Link href="/catalogo" className="btn btn-secondary">Ver el catálogo</Link>
        </div>
      </section>
    </div>
  );
}
