"use client";

import Link from "next/link";
import { cn } from "@/lib/format";
import { ClipboardList, Gift, History, LayoutDashboard, Package, ShoppingBag, Sparkles, Store } from "@/components/ui/icons";

export type AdminSection = "resumen" | "productos" | "pedidos" | "inventario" | "empaques" | "significados" | "combos";

export const adminSections: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "productos", label: "Productos", icon: Package },
  { id: "pedidos", label: "Pedidos", icon: ClipboardList },
  { id: "inventario", label: "Inventario", icon: History },
  { id: "empaques", label: "Empaques", icon: Gift },
  { id: "significados", label: "Significados", icon: Sparkles },
  { id: "combos", label: "Combos", icon: ShoppingBag },
];

export function AdminSidebar({
  current,
  onSelect,
  onNavigate,
  pendingOrders = 0,
}: {
  pendingOrders?: number;
  current: AdminSection;
  onSelect: (section: AdminSection) => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="px-2">
        <p className="font-serif text-[1.9rem] font-medium leading-none text-ivory">
          Mari<span className="italic">Arte</span>
        </p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-blush">Panel · modo demo</p>
      </div>

      <nav aria-label="Secciones del panel" className="mt-10 flex-1">
        <ul className="space-y-1">
          {adminSections.map(({ id, label, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => {
                  onSelect(id);
                  onNavigate?.();
                }}
                aria-current={current === id ? "page" : undefined}
                className={cn(
                  "flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-[14px] font-medium transition",
                  current === id ? "bg-ivory/12 text-white" : "text-ivory/70 hover:bg-ivory/8 hover:text-white",
                )}
              >
                <Icon size={18} />
                <span className="flex-1">{label}</span>
                {id === "pedidos" && pendingOrders > 0 && (
                  <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-bold text-white" aria-label={`${pendingOrders} pedidos pendientes`}>
                    {pendingOrders}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <div className="space-y-3 border-t border-ivory/10 pt-5">
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] text-ivory/75 hover:bg-ivory/8 hover:text-white">
          <Store size={18} /> Ver tienda
        </Link>
        <p className="px-3 text-[11px] leading-snug text-ivory/50">
          Sin backend ni autenticación. Los cambios viven solo en este navegador.
        </p>
      </div>
    </div>
  );
}
