import type { ReactNode } from "react";

export function EmptyState({
  title,
  description,
  action,
  illustration,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  illustration?: ReactNode;
}) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-14 text-center">
      <div className="mb-6">{illustration ?? <BagIllustration />}</div>
      <h2 className="font-serif text-3xl font-semibold text-ink">{title}</h2>
      {description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>}
      {action && <div className="mt-7 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}

/** Ilustración lineal de bolsita con corazón (sin dependencias). */
export function BagIllustration({ className = "h-32 w-32" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      <circle cx="80" cy="80" r="76" fill="var(--color-blush-soft)" />
      <path
        d="M52 62c0-4 2-6 6-6h44c4 0 6 2 6 6l6 58c0 6-3 9-9 9H55c-6 0-9-3-9-9l6-58Z"
        fill="#fff"
        stroke="var(--color-rose)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M66 62V52a14 14 0 0 1 28 0v10" fill="none" stroke="var(--color-rose)" strokeWidth="2.5" strokeLinecap="round" />
      <path
        d="M80 108s-14-8-14-17a7 7 0 0 1 14-2 7 7 0 0 1 14 2c0 9-14 17-14 17Z"
        fill="var(--color-blush)"
        stroke="var(--color-rose)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <circle cx="122" cy="44" r="3" fill="var(--color-champagne)" />
      <circle cx="38" cy="112" r="2.5" fill="var(--color-champagne)" />
    </svg>
  );
}

export function HeartIllustration({ className = "h-32 w-32" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      <circle cx="80" cy="80" r="76" fill="var(--color-blush-soft)" />
      <path
        d="M80 118s-34-18-34-42a17 17 0 0 1 34-6 17 17 0 0 1 34 6c0 24-34 42-34 42Z"
        fill="#fff"
        stroke="var(--color-rose)"
        strokeWidth="2.5"
        strokeLinejoin="round"
      />
      <path d="M62 74a9 9 0 0 1 9-9" fill="none" stroke="var(--color-champagne)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function SearchIllustration({ className = "h-28 w-28" }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" className={className} aria-hidden="true">
      <circle cx="80" cy="80" r="76" fill="var(--color-blush-soft)" />
      <circle cx="72" cy="72" r="26" fill="#fff" stroke="var(--color-rose)" strokeWidth="2.5" />
      <path d="m92 92 22 22" stroke="var(--color-rose)" strokeWidth="3" strokeLinecap="round" />
      <path d="M64 72h16" stroke="var(--color-champagne)" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
