import Image from "next/image";
import { cn } from "@/lib/format";
import { ImageIcon } from "./icons";

/**
 * Imagen de producto con marcador elegante cuando falta la fotografía.
 * El contenedor padre debe tener posición relativa y tamaño definido.
 */
export function ProductImage({
  src,
  alt,
  sizes = "(min-width: 1024px) 25vw, 50vw",
  priority = false,
  className,
  compact = false,
}: {
  src?: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  compact?: boolean;
}) {
  if (!src) {
    return (
      <div
        role="img"
        aria-label={`${alt} (fotografía pendiente)`}
        className={cn(
          "absolute inset-0 flex flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_30%_20%,var(--color-ivory),var(--color-blush-soft)_60%,var(--color-blush)_120%)] text-rose",
          className,
        )}
      >
        <ImageIcon size={compact ? 18 : 28} strokeWidth={1.25} />
        {!compact && (
          <span className="px-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-rose/80">
            Foto pendiente
          </span>
        )}
      </div>
    );
  }
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      className={cn("object-cover", className)}
    />
  );
}
