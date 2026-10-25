import type { Metadata } from "next";
import { site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { Badge } from "@/components/ui/Badge";
import { FileText } from "@/components/ui/icons";
import { DemoNotice } from "@/components/ui/misc";

export const metadata: Metadata = {
  title: "Políticas (provisional)",
  description: "Información legal provisional de MariArte: términos, privacidad, envíos, cambios y Libro de Reclamaciones.",
};

const sections = [
  {
    id: "terminos",
    title: "Términos y condiciones",
    body: [
      "Este sitio es un prototipo de demostración. Los productos, precios y existencias mostrados son referenciales y no constituyen una oferta vinculante.",
      "Los pedidos se coordinan por WhatsApp y quedan sujetos a confirmación de disponibilidad, precio final, forma de pago y envío por parte de la tienda.",
      "Pendiente: datos del titular del negocio (razón social o nombre, RUC, domicilio), condiciones de compra, medios de pago aceptados y jurisdicción.",
    ],
  },
  {
    id: "privacidad",
    title: "Política de privacidad",
    body: [
      "La versión de demostración no recopila ni envía datos personales a ningún servidor. El carrito y los favoritos se guardan únicamente en el navegador (localStorage).",
      "Pendiente: política conforme a la normativa peruana de protección de datos personales, finalidades de uso, plazos de conservación y canal para ejercer derechos.",
    ],
  },
  {
    id: "envios",
    title: "Envíos",
    body: [
      "La marca comunica envíos a todo el Perú. El costo, el operador logístico y el plazo se confirman por WhatsApp según el destino.",
      "Pendiente: zonas de reparto, tarifas, plazos estimados, responsabilidad ante pérdidas y seguimiento.",
    ],
  },
  {
    id: "cambios",
    title: "Cambios y devoluciones",
    body: [
      "Pendiente: plazo para solicitar cambios, condiciones del producto, excepciones (por ejemplo, piezas personalizadas) y procedimiento de devolución del dinero.",
    ],
  },
  {
    id: "reclamaciones",
    title: "Libro de Reclamaciones",
    body: [
      "Los proveedores que venden a consumidores en Perú deben contar con un Libro de Reclamaciones, también en su versión virtual cuando venden por internet, según la normativa vigente supervisada por Indecopi.",
      "Pendiente: implementar el formulario virtual oficial con los campos exigidos, numeración correlativa, constancia para el consumidor y plazo de respuesta. Mientras tanto, cualquier reclamo puede canalizarse por WhatsApp.",
    ],
  },
];

export default function PoliciesPage() {
  return (
    <div className="container-page pt-10 sm:pt-14">
      <header className="max-w-2xl">
        <p className="eyebrow mb-4">Información legal</p>
        <h1 className="font-serif text-[2.8rem] font-medium leading-none sm:text-[3.6rem]">Políticas de la tienda</h1>
        <DemoNotice className="mt-6">
          Contenido provisional: no constituye asesoría legal ni cumplimiento definitivo. Debe reemplazarse por las políticas aprobadas por {site.name} antes de publicar la tienda.
        </DemoNotice>
      </header>

      <div className="mt-12 grid gap-10 lg:grid-cols-[240px_1fr] lg:gap-16">
        <nav aria-label="Secciones" className="min-w-0 lg:sticky lg:top-28 lg:self-start">
          <ul className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 lg:mx-0 lg:flex-col lg:px-0">
            {sections.map((s) => (
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
                <Badge tone="warning">Provisional</Badge>
              </div>
              <div className="mt-4 space-y-3 text-[15px] leading-relaxed text-muted">
                {s.body.map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              {s.id === "reclamaciones" && (
                <a href={whatsappUrl("Hola, MariArte. Quisiera registrar un reclamo sobre mi pedido.")} target="_blank" rel="noopener noreferrer" className="btn btn-secondary mt-6">
                  Contactar por WhatsApp
                </a>
              )}
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
