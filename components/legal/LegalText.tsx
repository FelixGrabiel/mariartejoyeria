import { Fragment } from "react";
import { PENDING_MARK, parseLegal } from "@/lib/legal";

/** Resalta los datos que el titular aún no completó. */
function Marked({ text }: { text: string }) {
  const parts = text.split(PENDING_MARK);
  return (
    <>
      {parts.map((part, i) => (
        <Fragment key={i}>
          {part}
          {i < parts.length - 1 && <mark className="rounded bg-warning-soft px-1 text-warning">{PENDING_MARK}</mark>}
        </Fragment>
      ))}
    </>
  );
}

/** Muestra un texto legal ya con sus datos completados, sin HTML libre. */
export function LegalText({ text }: { text: string }) {
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-muted">
      {parseLegal(text).map((b, i) =>
        b.type === "h" ? (
          <h3 key={i} className="pt-2 font-serif text-[1.25rem] font-semibold text-ink">
            <Marked text={b.text} />
          </h3>
        ) : b.type === "ul" ? (
          <ul key={i} className="list-disc space-y-1.5 pl-5">
            {b.items.map((item, j) => (
              <li key={j}>
                <Marked text={item} />
              </li>
            ))}
          </ul>
        ) : (
          <p key={i}>
            <Marked text={b.text} />
          </p>
        ),
      )}
    </div>
  );
}
