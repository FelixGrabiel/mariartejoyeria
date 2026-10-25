"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { categories } from "@/data/categories";
import { navLinks, site } from "@/data/site";
import { cn } from "@/lib/format";
import { whatsappUrl } from "@/lib/whatsapp";
import { Modal } from "@/components/ui/Modal";
import { ChevronRight, Heart, Instagram, MessageCircle } from "@/components/ui/icons";

export function MobileNav({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { favorites, hydrated } = useStore();

  return (
    <Modal open={open} onClose={onClose} title="Menú" variant="drawer-left">
      <nav aria-label="Menú móvil" className="-mx-1">
        <ul className="divide-y divide-line/70">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                onClick={onClose}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "flex min-h-14 items-center justify-between px-1 font-serif text-[1.45rem] font-medium",
                  pathname === link.href ? "text-rose-deep" : "text-ink",
                )}
              >
                {link.label}
                <ChevronRight size={18} className="text-muted" />
              </Link>
            </li>
          ))}
          <li>
            <Link href="/favoritos" onClick={onClose} className="flex min-h-14 items-center justify-between px-1 font-serif text-[1.45rem] font-medium text-ink">
              <span className="flex items-center gap-2">
                Favoritos <Heart size={16} className="text-rose" />
              </span>
              <span className="text-sm font-sans text-muted">{hydrated ? favorites.length : 0}</span>
            </Link>
          </li>
        </ul>

        <p className="eyebrow mb-3 mt-8">Categorías</p>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/catalogo?categoria=${c.id}`}
              onClick={onClose}
              className="rounded-full border border-line bg-white px-4 py-2.5 text-sm font-medium text-ink"
            >
              {c.name}
            </Link>
          ))}
        </div>

        <div className="mt-8 space-y-2">
          <a href={whatsappUrl()} target="_blank" rel="noopener noreferrer" className="btn btn-whatsapp w-full">
            <MessageCircle size={18} /> Escríbenos por WhatsApp
          </a>
          <a href={site.instagramUrl} target="_blank" rel="noopener noreferrer" className="btn btn-secondary w-full">
            <Instagram size={18} /> {site.instagramHandle}
          </a>
        </div>
      </nav>
    </Modal>
  );
}
