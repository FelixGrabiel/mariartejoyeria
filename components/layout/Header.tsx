"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useStore } from "@/context/StoreContext";
import { navLinks } from "@/data/site";
import { cn } from "@/lib/format";
import { Heart, Menu, Search, ShoppingBag, X } from "@/components/ui/icons";
import { Logo } from "./Logo";
import { MobileNav } from "./MobileNav";

function CountBubble({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-rose px-1 text-[10px] font-bold leading-none text-white">
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { cartCount, favorites, hydrated } = useStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (searchOpen) inputRef.current?.focus();
  }, [searchOpen]);

  function submitSearch(event: FormEvent) {
    event.preventDefault();
    const q = query.trim();
    router.push(q ? `/catalogo?q=${encodeURIComponent(q)}` : "/catalogo");
    setSearchOpen(false);
  }

  const isActive = (href: string) => {
    const path = href.split("?")[0];
    if (href.includes("?")) return false;
    return path === "/" ? pathname === "/" : pathname?.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-line/70 bg-ivory/90 backdrop-blur-md">
      <div className="container-page flex h-[72px] items-center gap-3 sm:h-20">
        <div className="flex flex-1 items-center gap-1 lg:hidden">
          <button type="button" className="icon-btn -ml-2" aria-label="Abrir menú" onClick={() => setMenuOpen(true)}>
            <Menu size={22} />
          </button>
        </div>

        <div className="flex flex-none justify-center lg:flex-1 lg:justify-start">
          <Logo />
        </div>

        <nav aria-label="Principal" className="hidden lg:block">
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "relative py-2 text-[14px] font-medium transition hover:text-rose-deep",
                    isActive(link.href)
                      ? "text-ink after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:bg-rose"
                      : "text-muted",
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex flex-1 items-center justify-end gap-0.5 sm:gap-1">
          <button
            type="button"
            className="icon-btn"
            aria-label={searchOpen ? "Cerrar búsqueda" : "Buscar joyas"}
            aria-expanded={searchOpen}
            aria-controls="header-search"
            onClick={() => setSearchOpen((v) => !v)}
          >
            {searchOpen ? <X size={20} /> : <Search size={20} />}
          </button>
          <Link href="/favoritos" className="icon-btn relative hidden sm:inline-flex" aria-label={`Favoritos (${hydrated ? favorites.length : 0})`}>
            <Heart size={20} />
            {hydrated && <CountBubble count={favorites.length} />}
          </Link>
          <Link href="/carrito" className="icon-btn relative -mr-2 sm:mr-0" aria-label={`Carrito (${hydrated ? cartCount : 0} productos)`}>
            <ShoppingBag size={20} />
            {hydrated && <CountBubble count={cartCount} />}
          </Link>
        </div>
      </div>

      {searchOpen && (
        <div id="header-search" className="fade-in border-t border-line/70 bg-ivory">
          <form onSubmit={submitSearch} role="search" className="container-page flex items-center gap-3 py-3">
            <label htmlFor="header-search-input" className="sr-only">
              Buscar joyas
            </label>
            <div className="relative flex-1">
              <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
              <input
                ref={inputRef}
                id="header-search-input"
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Busca «ojo turco», «cruz», «sets»…"
                className="field pl-11"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Buscar
            </button>
          </form>
        </div>
      )}

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  );
}
