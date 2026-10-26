"use client";

import Link from "next/link";
import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { giftKey } from "@/lib/gift";
import { ArrowLeft, PenLine } from "@/components/ui/icons";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmModal } from "@/components/ui/Modal";
import { Skeleton } from "@/components/ui/misc";
import { CartItem } from "./CartItem";
import { ComboCartLine } from "./ComboCartLine";
import { CartSummary } from "./CartSummary";

export function CartView() {
  const { hydrated, cartLines, comboLines, comboCart, giftNote, setGiftNote, clearCart } = useStore();
  const [confirmClear, setConfirmClear] = useState(false);

  if (!hydrated) {
    return (
      <div className="container-page grid gap-8 py-10 lg:grid-cols-[1fr_380px]" aria-busy="true">
        <div className="space-y-4">
          <Skeleton className="h-36 w-full" />
          <Skeleton className="h-36 w-full" />
        </div>
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (cartLines.length === 0 && comboLines.length === 0) {
    return (
      <div className="container-page">
        <EmptyState
          title="Tu carrito aún está vacío"
          description="Encuentra ese detalle especial: pulseras, sets para compartir y regalos con dedicatoria."
          action={
            <>
              <Link href="/catalogo" className="btn btn-primary">
                Ir al catálogo
              </Link>
              <Link href="/favoritos" className="btn btn-secondary">
                Ver mis favoritos
              </Link>
            </>
          }
        />
      </div>
    );
  }

  return (
    <div className="container-page pt-8 sm:pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-3">Paso final</p>
          <h1 className="font-serif text-[2.6rem] font-semibold leading-none sm:text-[3.2rem]">Tu carrito</h1>
        </div>
        <button type="button" onClick={() => setConfirmClear(true)} className="text-[13px] font-medium text-muted underline-offset-4 hover:text-danger hover:underline">
          Vaciar carrito
        </button>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_390px] lg:gap-14">
        <div>
          <ul className="divide-y divide-line border-y border-line">
            {cartLines.map((line) => (
              <CartItem key={`${line.product.id}-${line.variant.sku}-${giftKey(line.item.gift)}`} line={line} />
            ))}
            {comboLines.map((line) => (
              <ComboCartLine key={`${line.item.comboId}-${line.item.picks.join("|")}`} line={line} index={comboCart.indexOf(line.item)} />
            ))}
          </ul>

          <div className="mt-8 rounded-3xl bg-blush-soft/70 p-5 sm:p-6">
            <label htmlFor="gift-note" className="flex items-center gap-2 font-serif text-xl font-semibold text-ink">
              <PenLine size={18} className="text-rose" /> ¿Es para regalo?
            </label>
            <p className="mt-1 text-[13px] text-muted">
              Escribe una dedicatoria o indicación de empaque (opcional). Se incluirá en tu mensaje; la tienda confirmará si aplica algún costo.
            </p>
            <textarea
              id="gift-note"
              value={giftNote}
              onChange={(e) => setGiftNote(e.target.value.slice(0, 240))}
              rows={3}
              maxLength={240}
              placeholder="Ej.: «Para mamá, con todo mi cariño». Empaque de regalo, por favor."
              className="field mt-3 resize-none"
              aria-describedby="gift-note-count"
            />
            <p id="gift-note-count" className="mt-1 text-right text-[12px] text-muted">
              {giftNote.length}/240
            </p>
          </div>

          <Link href="/catalogo" className="btn btn-ghost mt-6 -ml-4">
            <ArrowLeft size={17} /> Seguir comprando
          </Link>
        </div>

        <CartSummary />
      </div>

      <ConfirmModal
        open={confirmClear}
        onClose={() => setConfirmClear(false)}
        onConfirm={clearCart}
        title="¿Vaciar el carrito?"
        message="Se quitarán todas las piezas de tu carrito. Tus favoritos se mantienen."
        confirmLabel="Sí, vaciar"
        danger
      />
    </div>
  );
}
