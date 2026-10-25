import { whatsappUrl } from "@/lib/whatsapp";
import { MessageCircle } from "@/components/ui/icons";

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappUrl("Hola, MariArte. Quisiera hacer una consulta.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribir a MariArte por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#1f7a4d] text-white shadow-soft transition hover:scale-105 sm:bottom-7 sm:right-7"
    >
      <MessageCircle size={24} strokeWidth={2} />
    </a>
  );
}
