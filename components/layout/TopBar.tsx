import { site } from "@/data/site";
import { whatsappUrl } from "@/lib/whatsapp";
import { Instagram, MessageCircle } from "@/components/ui/icons";

export function TopBar() {
  return (
    <div className="bg-ink text-ivory">
      <div className="container-page flex h-9 items-center justify-center gap-6 text-[11px] font-medium tracking-[0.12em] uppercase sm:justify-between">
        <p className="truncate">{site.topBarMessage}</p>
        <div className="hidden items-center gap-5 sm:flex">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-85 transition hover:opacity-100"
          >
            <MessageCircle size={13} /> {site.whatsappDisplay}
          </a>
          <a
            href={site.instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 opacity-85 transition hover:opacity-100"
          >
            <Instagram size={13} /> {site.instagramHandle}
          </a>
        </div>
      </div>
    </div>
  );
}
