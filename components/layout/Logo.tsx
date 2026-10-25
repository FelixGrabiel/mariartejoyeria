import Link from "next/link";
import { cn } from "@/lib/format";

/**
 * Logotipo provisional en texto. Reemplázalo por el logo auténtico de MariArte
 * (por ejemplo, <Image src="/images/logo-mariarte.svg" … />) cuando esté disponible.
 */
export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" aria-label="MariArte, ir al inicio" className={cn("group inline-flex flex-col leading-none", className)}>
      <span
        className={cn(
          "font-serif text-[1.85rem] font-medium tracking-[0.01em] sm:text-[2.1rem]",
          light ? "text-ivory" : "text-rose-deep",
        )}
      >
        Mari<span className="italic">Arte</span>
      </span>
      <span
        className={cn(
          "mt-0.5 text-[8.5px] font-semibold uppercase tracking-[0.34em]",
          light ? "text-blush" : "text-champagne-deep",
        )}
      >
        Joyas con significado
      </span>
    </Link>
  );
}
