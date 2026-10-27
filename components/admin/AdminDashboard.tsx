"use client";

import { useState } from "react";
import { useStore } from "@/context/StoreContext";
import { useToast } from "@/context/ToastContext";
import { lowStockVariants } from "@/lib/catalog";
import { cn, formatPrice } from "@/lib/format";
import type { OrderStatus } from "@/types";
import { ConfirmModal, Modal } from "@/components/ui/Modal";
import { AlertCircle, ClipboardList, Info, Menu, Package, RotateCcw, Sparkles } from "@/components/ui/icons";
import { Skeleton } from "@/components/ui/misc";
import { AdminLogin } from "./AdminLogin";
import { AdminSidebar,adminSections, type AdminSection } from "./AdminSidebar";
import { PackagingPanel, ThemesPanel } from "./GiftAdminPanels";
import { CombosPanel } from "./CombosPanel";
import { InventoryPanel } from "./InventoryPanel";
import { OrdersTable, orderStatuses, orderTotal } from "./OrdersTable";
import { ProductsTable } from "./ProductsTable";
import { StatCard } from "./StatCard";

export function AdminDashboard() {
  const { hydrated, products, orders, resetDemo, authRequired, authChecked, isAdmin, adminEmail, signOut } = useStore();
  const { showToast } = useToast();
  const [section, setSection] = useState<AdminSection>("resumen");
  const [navOpen, setNavOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [orderFilter, setOrderFilter] = useState<"todos" | OrderStatus>("todos");

  const active = products.filter((p) => p.active).length;
  const pending = orders.filter((o) => o.status === "pendiente").length;
  const sales = orders.filter((o) => o.status !== "cancelado").reduce((sum, o) => sum + orderTotal(o), 0);
  const lowStock = lowStockVariants(products.filter((p) => p.active));
  const title = adminSections.find((s) => s.id === section)?.label ?? "Resumen";

  if (authRequired && !authChecked) return <div className="min-h-dvh bg-[#faf5f2]" aria-busy="true" />;
  if (authRequired && !isAdmin) return <AdminLogin />;

  return (
    <div className="min-h-dvh bg-[#faf5f2] lg:grid lg:grid-cols-[256px_1fr]">
      <aside className="hidden bg-ink px-5 py-7 lg:sticky lg:top-0 lg:block lg:h-dvh">
        <AdminSidebar current={section} onSelect={setSection} pendingOrders={pending} connected={authRequired} />
      </aside>

      <Modal
        open={navOpen}
        onClose={() => setNavOpen(false)}
        title="Navegación del panel"
        variant="drawer-left"
        hideTitle
        panelClassName="!bg-ink text-ink [&_.icon-btn]:bg-ivory"
      >
        <div className="h-full pt-2">
          <AdminSidebar current={section} onSelect={setSection} onNavigate={() => setNavOpen(false)} pendingOrders={pending} connected={authRequired} />
        </div>
      </Modal>

      <div className="min-w-0">
        {!authRequired && (
          <div role="note" className="flex items-center justify-center gap-2 bg-warning-soft px-4 py-2 text-center text-[12.5px] font-medium text-warning">
            <Info size={15} className="shrink-0" />
            Modo demostración · no conectado a un backend · datos ficticios guardados solo en este navegador
          </div>
        )}

        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-[#faf5f2]/95 px-4 py-4 backdrop-blur sm:px-8">
          <button type="button" className="icon-btn -ml-2 lg:hidden" aria-label="Abrir navegación del panel" onClick={() => setNavOpen(true)}>
            <Menu size={22} />
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-rose">Panel administrativo</p>
            <h1 className="truncate font-serif text-[1.9rem] font-semibold leading-tight">{title}</h1>
          </div>
          {authRequired ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => signOut()} title={adminEmail ?? undefined}>
              Cerrar sesión
            </button>
          ) : (
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setConfirmReset(true)}>
              <RotateCcw size={15} /> <span className="hidden sm:inline">Restablecer datos de demo</span><span className="sm:hidden">Restablecer</span>
            </button>
          )}
        </header>

        <main className="px-4 py-6 sm:px-8 sm:py-8">
          {!hydrated ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-32" />
              ))}
            </div>
          ) : (
            <>
              {section === "resumen" && (
                <div className="space-y-8">
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <StatCard label="Productos activos" value={active} hint={`${products.length - active} oculto(s)`} icon={<Package size={17} />} />
                    <StatCard label={authRequired ? "Pedidos" : "Pedidos de ejemplo"} value={orders.length} hint={`${pending} pendiente(s) de atender`} icon={<ClipboardList size={17} />} />
                    <StatCard label={authRequired ? "Ventas" : "Ventas simuladas"} value={formatPrice(sales)} hint={authRequired ? "Pedidos no cancelados · total referencial, sin envío" : "Pedidos no cancelados · ficticio"} icon={<Sparkles size={17} />} />
                    <StatCard
                      label="Alertas de stock"
                      value={lowStock.length}
                      hint="Variantes en su stock mínimo o por debajo"
                      icon={<AlertCircle size={17} />}
                      tone={lowStock.length ? "warning" : "default"}
                    />
                  </div>

                  <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
                    <section aria-labelledby="recent-orders" className="min-w-0">
                      <div className="mb-3 flex items-center justify-between">
                        <h2 id="recent-orders" className="font-serif text-[1.5rem] font-semibold">Pedidos recientes</h2>
                        <button type="button" className="text-[13px] font-semibold text-rose-deep hover:underline" onClick={() => setSection("pedidos")}>
                          Gestionar pedidos
                        </button>
                      </div>
                      <OrdersTable orders={orders.slice(0, 5)} compact />
                    </section>
                    <section aria-labelledby="low-stock" className="rounded-2xl border border-line bg-white p-5">
                      <h2 id="low-stock" className="font-serif text-[1.5rem] font-semibold">Stock bajo</h2>
                      {lowStock.length === 0 ? (
                        <p className="mt-3 text-sm text-muted">Todo en orden.</p>
                      ) : (
                        <ul className="mt-3 divide-y divide-line">
                          {lowStock.map(({ product, variant }) => (
                            <li key={variant.sku} className="flex items-center justify-between gap-3 py-2.5 text-[13.5px]">
                              <span className="min-w-0">
                                <span className="block truncate text-ink">{product.name}</span>
                                <span className="text-[12px] text-muted">{variant.label}</span>
                              </span>
                              <span className={cn("shrink-0 rounded-full px-2.5 py-1 text-[12px] font-semibold", variant.stock === 0 ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning")}>
                                {variant.stock === 0 ? "Agotado" : `${variant.stock} u.`}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button type="button" className="btn btn-secondary btn-sm mt-4 w-full" onClick={() => setSection("inventario")}>
                        Registrar entrada de stock
                      </button>
                    </section>
                  </div>
                </div>
              )}

              {section === "productos" && <ProductsTable />}

              {section === "pedidos" && (
                <div>
                  <div className="no-scrollbar -mx-4 mb-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
                    {(["todos", ...orderStatuses] as const).map((s) => {
                      const count = s === "todos" ? orders.length : orders.filter((o) => o.status === s).length;
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={orderFilter === s}
                          onClick={() => setOrderFilter(s)}
                          className={cn(
                            "h-9 shrink-0 rounded-full px-4 text-[13px] font-medium capitalize transition",
                            orderFilter === s ? "bg-ink text-ivory" : "border border-line bg-white text-ink hover:border-rose/40",
                          )}
                        >
                          {s} <span className="opacity-60">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                  <OrdersTable orders={orderFilter === "todos" ? orders : orders.filter((o) => o.status === orderFilter)} />
                  <p className="mt-3 text-[12px] text-muted">
                    {authRequired
                      ? "Al confirmar un pedido se descuenta el stock; si lo cancelas después, el stock se devuelve."
                      : "Cambiar el estado no descuenta stock automáticamente en la demo. En producción, confirmar un pedido debería reservar stock en el servidor."}
                  </p>
                </div>
              )}

              {section === "inventario" && <InventoryPanel />}

              {section === "empaques" && <PackagingPanel />}

              {section === "significados" && <ThemesPanel />}

              {section === "combos" && <CombosPanel />}
            </>
          )}
        </main>
      </div>

      <ConfirmModal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          resetDemo();
          showToast("Datos de demo restablecidos.", { tone: "info" });
        }}
        title="¿Restablecer datos de demo?"
        message="Se borrarán los cambios de productos, pedidos y stock hechos en este navegador, además del carrito y los favoritos. No afecta a nada real."
        confirmLabel="Restablecer"
        danger
      />
    </div>
  );
}
