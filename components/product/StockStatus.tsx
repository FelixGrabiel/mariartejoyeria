import { cn } from "@/lib/format";

/** Estado de stock con texto (nunca solo color). */
export function StockStatus({ stock, className }: { stock: number; className?: string }) {
  const state = stock <= 0 ? "out" : stock <= 3 ? "low" : "ok";
  const text =
    state === "out" ? "Agotado" : state === "low" ? `Últimas ${stock} unidad${stock === 1 ? "" : "es"}` : `Disponible · ${stock} en stock`;
  return (
    <p
      className={cn(
        "inline-flex items-center gap-2 text-[13px] font-medium",
        state === "out" ? "text-danger" : state === "low" ? "text-warning" : "text-success",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "h-2 w-2 rounded-full",
          state === "out" ? "bg-danger" : state === "low" ? "bg-warning" : "bg-success",
        )}
      />
      {text}
    </p>
  );
}
