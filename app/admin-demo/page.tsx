import type { Metadata } from "next";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const metadata: Metadata = {
  title: "Panel administrativo (demo)",
  description: "Panel de demostración de MariArte. No conectado a un backend.",
  robots: { index: false, follow: false },
};

export default function AdminDemoPage() {
  return <AdminDashboard />;
}
