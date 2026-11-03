"use client";

import Link from "next/link";
import { cn } from "@/lib/format";
import { AlertCircle, ClipboardList, FileText, Gift, History, LayoutDashboard, Package, ShoppingBag, Sparkles, Store, Truck } from "@/components/ui/icons";

export type AdminSection = "resumen" | "productos" | "pedidos" | "inventario" | "empaques" | "significados" | "combos" | "avisos" | "envios" | "negocio" | "reclamos";

export const adminSections: { id: AdminSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "resumen", label: "Resumen", icon: LayoutDashboard },
  { id: "productos", label: "Productos", icon: Package },
  { id: "pedidos", label: "Pedidos", icon: ClipboardList },
  { id: "inventario", label: "Inventario", icon: History },
  { id: "empaques", label: "Empaques", icon: Gift },
  { id: "significados", label: "Significados", icon: Sparkles },
  { id: "combos", label: "Combos", icon: ShoppingBag },
  { id: "avisos", label: "Avisos de stock", icon: AlertCircle },
  { id: "envios", label: "Envíos", icon: Truck },
  { id: "negocio", label: "Negocio y legal", icon: FileText },
  { id: "reclamos", label: "Reclamos", icon: ClipboardList },
];

/** Agrupación del menú para que sea fácil de recorrer. */
const adminGroups: { title: string; ids: AdminSection[] }[] = [
  { title: "Tienda", ids: ["resumen", "productos", "pedidos", "inventario"] },
  { title: "Regalos y promos", ids: ["empaques", "significados", "combos"] },
  { title: "Clientes", ids: ["avisos", "reclamos"] },
  { title: "Configuración", ids: ["envios", "negocio"] },
];

function Badge({ n, label }: { n: number; label: string }) {
  return (
    <span className="rounded-full bg-rose px-2 py-0.5 text-[11px] font-bold text-white" aria-label={label}>
      {n}
    </span>
  );
}

export function AdminSidebar({
  current,
  onSelect,
  onNavigate,
  pendingOrders = 0,
  pendingAlerts = 0,
  pendingComplaints = 0,
  connected = false,
}: {
  pendingAlerts?: number;
  pendingComplaints?: number;
  connected?: boolean;
  pendingOrders?: number;
  current: AdminSection;
  onSelect: (section: AdminSection) => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="px-2">
        <p className="font-serif text-[1.9rem] font-medium leading-none text-ivory">
          Mari<span className="italic">Arte</span>
        </p>
        <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.3em] text-blush">{connected ? "Administración" : "Panel · modo demo"}</p>
      </div>

      <nav aria-label="Secciones del panel" className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
        {adminGroups.map((group) => (
          <div key={group.title} className="mb-4">
            <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.22em] text-ivory/40">{group.title}</p>
            <ul className="space-y-0.5">
              {group.ids.map((id) => {
                const { label, icon: Icon } = adminSections.find((s) => s.id === id)!;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelect(id);
                        onNavigate?.();
                      }}
                      aria-current={current === id ? "page" : undefined}
                      className={cn(
                        "flex min-h-10 w-full items-center gap-3 rounded-xl px-3 text-left text-[13.5px] font-medium transition",
                        current === id ? "bg-ivory/12 text-white" : "text-ivory/70 hover:bg-ivory/8 hover:text-white",
                      )}
                    >
                      <Icon size={17} />
                      <span className="flex-1">{label}</span>
                      {id === "avisos" && pendingAlerts > 0 && <Badge n={pendingAlerts} label={`${pendingAlerts} avisos pendientes`} />}
                      {id === "reclamos" && pendingComplaints > 0 && <Badge n={pendingComplaints} label={`${pendingComplaints} reclamos pendientes`} />}
                      {id === "pedidos" && pendingOrders > 0 && <Badge n={pendingOrders} label={`${pendingOrders} pedidos pendientes`} />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-ivory/10 pt-5">
        <Link href="/" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] text-ivory/75 hover:bg-ivory/8 hover:text-white">
          <Store size={18} /> Ver tienda
        </Link>
        <p className="px-3 text-[11px] leading-snug text-ivory/50">
          {connected ? "Los cambios se guardan en la base de datos de la tienda." : "Sin backend ni autenticación. Los cambios viven solo en este navegador."}
        </p>
      </div>
    </div>
  );
}
