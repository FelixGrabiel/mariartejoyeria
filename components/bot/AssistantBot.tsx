"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { useStore } from "@/context/StoreContext";
import { categories } from "@/data/categories";
import { availabilityLabel, availabilityOf, detectIntent, MENU, productQuery, staticAnswer } from "@/lib/bot";
import { emptyFilters, filterProducts } from "@/lib/catalog";
import { normalizePhone } from "@/lib/customer";
import { cn, formatDate, formatPrice } from "@/lib/format";
import { askAssistant, dbTrackOrder, supabase } from "@/lib/supabase";
import { whatsappUrl } from "@/lib/whatsapp";
import { MessageCircle, Sparkles, X } from "@/components/ui/icons";

type Msg =
  | { id: number; from: "bot" | "user"; kind: "text"; text: string }
  | { id: number; from: "bot"; kind: "products"; query: string; items: { id: string; slug: string; name: string; price: number; stocks: number[] }[] }
  | { id: number; from: "bot"; kind: "track-form" };

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;

const statusText: Record<string, string> = {
  pendiente: "Recibido, pendiente de confirmación",
  confirmado: "Confirmado",
  preparado: "En preparación",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
};

const categoryNames = Object.fromEntries(categories.map((c) => [c.id, c.name]));
const wa = (text: string) => whatsappUrl(text);

/**
 * Asistente de la tienda. Responde con datos reales (catálogo, stock, estado de pedido) y respuestas fijas.
 * Si la tienda activó la IA y la pregunta no encaja, la consulta a un modelo limitado a esos mismos datos.
 * Siempre ofrece pasar a una persona por WhatsApp.
 */
export function AssistantBot() {
  const { storeProducts } = useStore();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [awaiting, setAwaiting] = useState<"producto" | null>(null);
  const idRef = useRef(1);
  const aiOff = useRef(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const facts = useMemo(() => ({ whatsappUrl: wa("Hola, MariArte. Quisiera hablar con una persona.") }), []);

  const push = (m: DistributiveOmit<Msg, "id">) => setMsgs((list) => [...list, { ...m, id: idRef.current++ } as Msg]);

  // Mensaje de bienvenida al abrir por primera vez.
  useEffect(() => {
    if (open && msgs.length === 0) {
      push({ from: "bot", kind: "text", text: staticAnswer("saludo", facts)! });
    }
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [msgs, busy]);

  function searchProducts(text: string) {
    const q = productQuery(text) || text;
    const found = filterProducts(storeProducts, { ...emptyFilters, query: q }, categoryNames).slice(0, 4);
    if (found.length === 0) {
      push({ from: "bot", kind: "text", text: `No encontré joyas que coincidan con «${text.trim()}». Prueba con otra palabra (por ejemplo «ojo turco» o «San Benito»), mira el catálogo o escríbenos por WhatsApp.` });
      return;
    }
    push({
      from: "bot",
      kind: "products",
      query: q,
      items: found.map((p) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price, stocks: p.variants.map((v) => v.stock) })),
    });
  }

  async function handle(text: string) {
    const clean = text.trim();
    if (!clean || busy) return;
    push({ from: "user", kind: "text", text: clean });
    const intent = awaiting === "producto" ? "stock" : detectIntent(clean);
    setAwaiting(null);

    if (intent === "stock" || intent === "precio") {
      const q = productQuery(clean);
      if (!q) {
        setAwaiting("producto");
        push({ from: "bot", kind: "text", text: "¿De qué joya quieres saber? Escribe su nombre, por ejemplo «ojo turco» o «San Benito»." });
        return;
      }
      searchProducts(clean);
      return;
    }
    if (intent === "pedido") {
      push({ from: "bot", kind: "text", text: "Para ver el estado de tu pedido necesito el código que te mostramos al enviarlo (por ejemplo MA-2005) y el celular que usaste." });
      push({ from: "bot", kind: "track-form" });
      return;
    }
    const fixed = staticAnswer(intent, facts);
    if (fixed) {
      push({ from: "bot", kind: "text", text: fixed });
      return;
    }

    // Pregunta que no encaja: primero intentamos como nombre de producto; luego la IA (si está activada).
    const q = productQuery(clean);
    if (q && filterProducts(storeProducts, { ...emptyFilters, query: q }, categoryNames).length > 0) {
      searchProducts(clean);
      return;
    }
    if (!aiOff.current && supabase) {
      setBusy(true);
      const history = [...msgs, { id: 0, from: "user" as const, kind: "text" as const, text: clean }]
        .filter((m): m is Extract<Msg, { kind: "text" }> => m.kind === "text")
        .slice(-6)
        .map((m) => ({ role: m.from === "user" ? "user" : "assistant", content: m.text }));
      const res = await askAssistant(history);
      setBusy(false);
      if ("reply" in res) {
        push({ from: "bot", kind: "text", text: res.reply });
        return;
      }
      if (res.error === "not_configured") aiOff.current = true;
      if (res.error === "rate" || res.error === "busy") {
        push({ from: "bot", kind: "text", text: "Hay muchas consultas en este momento. Escríbenos por WhatsApp y te ayudamos." });
        return;
      }
    }
    push({ from: "bot", kind: "text", text: "No estoy seguro de poder ayudarte con eso. Elige una opción del menú o escríbenos por WhatsApp y una persona te responde." });
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const text = input;
    setInput("");
    handle(text);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls="asistente-panel"
        aria-label={open ? "Cerrar el asistente" : "Abrir el asistente de MariArte"}
        className="fixed bottom-5 left-5 z-40 flex h-14 items-center gap-2 rounded-full bg-ink px-5 text-[14px] font-semibold text-ivory shadow-soft transition hover:scale-105 sm:bottom-7 sm:left-7"
      >
        {open ? <X size={20} /> : <Sparkles size={20} />}
        <span className="hidden sm:inline">{open ? "Cerrar" : "Asistente"}</span>
      </button>

      {open && (
        <section
          id="asistente-panel"
          role="dialog"
          aria-label="Asistente de MariArte"
          className="fixed bottom-24 left-3 right-3 z-50 flex max-h-[min(640px,calc(100dvh-8rem))] flex-col overflow-hidden rounded-3xl border border-line bg-white shadow-2xl sm:left-7 sm:right-auto sm:w-[390px]"
        >
          <header className="flex items-center gap-3 bg-ink px-5 py-4 text-ivory">
            <Sparkles size={18} />
            <div className="flex-1">
              <p className="font-serif text-[1.2rem] font-semibold leading-none">Asistente MariArte</p>
              <p className="mt-0.5 text-[11.5px] text-ivory/70">Respuestas con datos reales de la tienda</p>
            </div>
            <button type="button" className="icon-btn text-ivory hover:bg-white/10" aria-label="Cerrar" onClick={() => setOpen(false)}>
              <X size={18} />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4" aria-live="polite">
            {msgs.map((m) => (
              <Bubble key={m.id} m={m} onNavigate={() => setOpen(false)} />
            ))}
            {busy && <p className="text-[13px] text-muted">Escribiendo…</p>}
            <div ref={endRef} />
          </div>

          <div className="border-t border-line px-3 pt-3">
            <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
              {MENU.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => (item.id === "humano" ? window.open(facts.whatsappUrl, "_blank", "noopener,noreferrer") : handle(item.text))}
                  className="shrink-0 rounded-full border border-line bg-ivory px-3.5 py-2 text-[12.5px] font-medium text-ink hover:border-rose/50"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <form onSubmit={onSubmit} className="flex gap-2 pb-3">
              <label htmlFor="bot-input" className="sr-only">Escribe tu pregunta</label>
              <input
                id="bot-input"
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                maxLength={300}
                placeholder="Escribe tu pregunta…"
                className="field min-h-11 flex-1 rounded-full py-2"
                autoComplete="off"
              />
              <button type="submit" className="btn btn-primary btn-sm" disabled={busy || !input.trim()}>
                Enviar
              </button>
            </form>
          </div>
        </section>
      )}
    </>
  );
}

function Bubble({ m, onNavigate }: { m: Msg; onNavigate: () => void }) {
  if (m.kind === "text") {
    return (
      <div className={cn("flex", m.from === "user" ? "justify-end" : "justify-start")}>
        <p className={cn("max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-[14px] leading-snug", m.from === "user" ? "bg-rose-deep text-white" : "bg-blush-soft/70 text-ink")}>
          {linkify(m.text)}
        </p>
      </div>
    );
  }
  if (m.kind === "products") {
    return (
      <div className="space-y-2">
        <p className="text-[13px] text-muted">Esto encontré:</p>
        {m.items.map((p) => {
          const a = availabilityOf(p.stocks);
          return (
            <div key={p.id} className="rounded-2xl border border-line p-3">
              <p className="font-semibold text-ink">{p.name}</p>
              <p className="text-[13px] text-muted">
                {formatPrice(p.price)} · <span className={a === "agotado" ? "text-danger" : a === "pocas" ? "text-warning" : "text-success"}>{availabilityLabel[a]}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <Link href={`/producto/${p.slug}`} onClick={onNavigate} className="btn btn-secondary btn-sm">
                  Ver joya
                </Link>
                {a === "agotado" && (
                  <Link href={`/producto/${p.slug}#restock-title`} onClick={onNavigate} className="btn btn-primary btn-sm">
                    Avísame cuando vuelva
                  </Link>
                )}
              </div>
            </div>
          );
        })}
        <p className="text-[12px] text-muted">El stock puede cambiar; la tienda confirma disponibilidad al recibir tu pedido.</p>
      </div>
    );
  }
  return <TrackForm />;
}

function TrackForm() {
  const [code, setCode] = useState("");
  const [phone, setPhone] = useState("");
  const [state, setState] = useState<{ kind: "idle" | "loading" | "error" | "none" | "ok"; text?: string }>({ kind: "idle" });

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!code.trim() || !/^9\d{8}$/.test(normalizePhone(phone))) return setState({ kind: "error", text: "Escribe tu código y el celular de 9 dígitos que usaste." });
    setState({ kind: "loading" });
    const res = await dbTrackOrder(code, phone);
    if ("error" in res) return setState({ kind: "error", text: res.error });
    if (!res.order) return setState({ kind: "none" });
    setState({ kind: "ok", text: `Pedido ${res.order.code} (${formatDate(res.order.created_at)}): ${statusText[res.order.status] ?? res.order.status}.` });
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-2xl border border-line p-3">
      <label htmlFor="bot-code" className="sr-only">Código del pedido</label>
      <input id="bot-code" className="field min-h-10 py-1.5 uppercase" placeholder="Código (MA-2005)" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off" />
      <label htmlFor="bot-phone" className="sr-only">Celular</label>
      <input id="bot-phone" className="field min-h-10 py-1.5" inputMode="tel" placeholder="Celular (987 654 321)" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" />
      <button type="submit" className="btn btn-primary btn-sm w-full" disabled={state.kind === "loading"}>
        {state.kind === "loading" ? "Buscando…" : "Ver estado"}
      </button>
      {state.kind === "error" && <p role="alert" className="field-error">{state.text}</p>}
      {state.kind === "none" && <p className="text-[13px] text-muted">No encontré un pedido con esos datos. Revísalos o escríbenos por WhatsApp.</p>}
      {state.kind === "ok" && <p role="status" className="text-[13.5px] font-medium text-ink">{state.text}</p>}
    </form>
  );
}

/** Convierte URLs en enlaces (solo https). */
function linkify(text: string) {
  return text.split(/(https?:\/\/\S+)/g).map((part, i) =>
    /^https?:\/\//.test(part) ? (
      <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold underline underline-offset-2">
        <MessageCircle size={13} /> Abrir WhatsApp
      </a>
    ) : (
      part
    ),
  );
}
