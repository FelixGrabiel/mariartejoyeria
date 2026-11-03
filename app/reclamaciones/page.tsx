import type { Metadata } from "next";
import { fetchLegalPublic } from "@/lib/legal-server";
import { legalValues } from "@/lib/legal";
import { ComplaintForm } from "@/components/legal/ComplaintForm";

export const metadata: Metadata = {
  title: "Libro de Reclamaciones",
  description: "Registra un reclamo o una queja en el Libro de Reclamaciones virtual de MariArte.",
};

export const revalidate = 120;

export default async function ComplaintsPage() {
  const legal = await fetchLegalPublic();
  const v = legal ? legalValues(legal.info) : null;

  return (
    <div className="container-page max-w-3xl pt-10 sm:pt-14">
      <p className="eyebrow mb-4">Tus derechos como consumidor</p>
      <h1 className="font-serif text-[2.6rem] font-medium leading-none sm:text-[3.4rem]">Libro de Reclamaciones</h1>
      <p className="mt-5 text-[14px] leading-relaxed text-muted">
        Completa la hoja y recibirás un número de registro. Usamos tus datos solo para atender tu caso.
      </p>

      {v && (
        <dl className="mt-6 grid gap-x-6 gap-y-1 rounded-2xl border border-line bg-white p-5 text-[13.5px] sm:grid-cols-2">
          <div><dt className="inline text-muted">Proveedor: </dt><dd className="inline text-ink">{v.razon_social}</dd></div>
          <div><dt className="inline text-muted">RUC: </dt><dd className="inline text-ink">{v.ruc}</dd></div>
          <div className="sm:col-span-2"><dt className="inline text-muted">Domicilio: </dt><dd className="inline text-ink">{v.domicilio}</dd></div>
        </dl>
      )}

      <div className="mt-8">
        <ComplaintForm />
      </div>
    </div>
  );
}
