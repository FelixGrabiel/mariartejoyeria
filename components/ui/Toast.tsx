"use client";

import Link from "next/link";
import { cn } from "@/lib/format";
import { AlertCircle, Check, Info, X } from "./icons";

export type ToastTone = "success" | "info" | "error";

export interface ToastData {
  id: number;
  message: string;
  tone: ToastTone;
  action?: { label: string; href: string };
}

const toneStyles: Record<ToastTone, string> = {
  success: "bg-ink text-ivory",
  info: "bg-white text-ink ring-1 ring-line",
  error: "bg-danger-soft text-danger ring-1 ring-danger/30",
};

const ToneIcon = { success: Check, info: Info, error: AlertCircle } as const;

export function Toast({ toast, onClose }: { toast: ToastData; onClose: () => void }) {
  const Icon = ToneIcon[toast.tone];
  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      className={cn(
        "toast-in pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl px-4 py-3 text-sm shadow-soft",
        toneStyles[toast.tone],
      )}
    >
      <Icon size={18} className="shrink-0" />
      <p className="flex-1 leading-snug">{toast.message}</p>
      {toast.action && (
        <Link href={toast.action.href} className="shrink-0 font-semibold underline underline-offset-4" onClick={onClose}>
          {toast.action.label}
        </Link>
      )}
      <button type="button" onClick={onClose} aria-label="Cerrar aviso" className="-mr-1 rounded-full p-1 opacity-70 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}
