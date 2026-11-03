import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/data/site";
import { fillLegal, legalValues, PENDING_MARK } from "@/lib/legal";
import { fetchLegalPublic } from "@/lib/legal-server";
import { whatsappUrl } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/Badge";
import { FileText } from "@/components/ui/icons";
import { LegalText } from "@/components/legal/LegalText";

export const metadata: Metadata = {
  title: "Políticas",
  description: "Términos y condiciones, privacidad, envíos, cambios y devoluciones, y Libro de Reclamaciones de MariArte.",
};

export const revalidate = 120;

export default async function PoliciesPage() {
  const legal = await fetchLegalPublic();
  const values = legal ? legalValues(legal.info) : null;
  const sections = (legal?.sections ?? []).map((s) => ({ id: s.id, title: s.title, body: values ? fillLegal(s.body, values) : s.body }));
  const nav = [...sections.map((s) => ({ id: s.id, title: s.title })), { id: "reclamaciones", title: "Libro de Reclamaciones" }];

  return (
    <div className="container-page pt-10 sm:pt-14">
      <header className="max-w-2xl">
        <p className="eyebrow mb-4">Información legal</p>
        <h1 className="font-serif text-[2.8rem] font-medium leading-none sm:text-[3.6rem]">Políticas de la tienda</h1>
        <p className="mt-5 text-[14px] leading-relaxed text-muted">
          Aquí explicamos cómo funciona {site.name}: tus datos, tus pedidos, los envíos y tus derechos como consumidor.
        </p>
      </header>

      {sections.length === 0 && (
        <p className="mt-10 rounded-2xl border border-dashed border-line p-6 text-sm text-muted">
          No pudimos cargar las políticas en este momento. Inténtalo de nuevo en unos minutos o{" "}
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="link-underline text-rose-deep">escríbenos por WhatsApp</a>.
        </p>
      )}

      <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <nav aria-label="Secciones" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
            {nav.map((s) => (
              <li key={s.id} className="shrink-0">
                <a href={`#${s.id}`} className="block rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink hover:border-rose/50 lg:rounded-xl">
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="min-w-0 space-y-6">
          {sections.map((s) => (
            <section key={s.id} id={s.id} aria-labelledby={`${s.id}-title`} className="card scroll-mt-28 p-6 sm:p-8">
              <div className="flex flex-wrap items-center gap-3">
                <FileText size={20} className="text-rose" />
                <h2 id={`${s.id}-title`} className="font-serif text-[1.8rem] font-semibold">{s.title}</h2>
                {s.body.includes(PENDING_MARK) && <Badge tone="warning">Faltan datos del titular</Badge>}
              </div>
              <div className="mt-4">
                <LegalText text={s.body} />
              </div>
            </section>
          ))}

          <section id="reclamaciones" aria-labelledby="reclamaciones-title" className="card scroll-mt-28 p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-3">
              <FileText size={20} className="text-rose" />
              <h2 id="reclamaciones-title" className="font-serif text-[1.8rem] font-semibold">Libro de Reclamaciones</h2>
            </div>
            <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
              <p>
                Conforme al Código de Protección y Defensa del Consumidor, ponemos a tu disposición un Libro de Reclamaciones virtual. Puedes registrar un reclamo
                (disconformidad con un producto o servicio) o una queja (malestar por la atención) y recibirás una hoja con tu número de registro.
              </p>
              <p>Respondemos dentro del plazo que establece la ley.</p>
            </div>
            <Link href="/reclamaciones" className="btn btn-primary mt-6">
              Abrir el Libro de Reclamaciones
            </Link>
          </section>
        </div>
      </div>
    </div>
  );
}
