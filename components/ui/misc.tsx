import type { ReactNode } from "react";
import { cn } from "@/lib/format";
import { Heart, Info } from "./icons";

/** Aviso que identifica contenido de demostración. */
export function DemoNotice({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-2xl border border-dashed border-champagne/60 bg-white/60 px-4 py-3 text-[13px] leading-snug text-muted",
        className,
      )}
    >
      <Info size={16} className="mt-0.5 shrink-0 text-champagne-deep" />
      <span>{children}</span>
    </p>
  );
}

/** Ornamento "——— ♡ ———" inspirado en las publicaciones de la marca. */
export function Ornament({ className, align = "start" }: { className?: string; align?: "start" | "center" }) {
  return (
    <span
      aria-hidden="true"
      className={cn("flex items-center gap-2 text-champagne", align === "center" && "justify-center", className)}
    >
      <span className="h-px w-8 bg-current" />
      <Heart size={11} strokeWidth={2} />
      <span className="h-px w-8 bg-current" />
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  action,
  id,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  align?: "start" | "center";
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div
      className={cn(
        "mb-8 flex flex-col gap-4 sm:mb-10",
        align === "center" ? "items-center text-center" : "sm:flex-row sm:items-end sm:justify-between",
      )}
    >
      <div className={cn(align === "center" && "flex flex-col items-center")}>
        {eyebrow && <p className="eyebrow mb-3">{eyebrow}</p>}
        <h2 id={id} className="font-serif text-[2rem] font-semibold leading-[1.05] text-ink sm:text-[2.6rem]">
          {title}
        </h2>
        {description && <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-blush-soft", className)} />;
}

export function ProductCardSkeleton() {
  return (
    <div aria-hidden="true">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="mt-4 h-3 w-1/3" />
      <Skeleton className="mt-2 h-5 w-3/4" />
      <Skeleton className="mt-3 h-4 w-1/4" />
    </div>
  );
}
