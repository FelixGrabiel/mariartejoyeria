import Link from "next/link";
import { EmptyState, SearchIllustration } from "@/components/ui/EmptyState";

export default function NotFound() {
  return (
    <div className="container-page">
      <EmptyState
        illustration={<SearchIllustration />}
        title="Esta página no existe"
        description="Puede que el enlace haya cambiado. Te invitamos a volver al inicio o a explorar el catálogo."
        action={
          <>
            <Link href="/" className="btn btn-primary">Ir al inicio</Link>
            <Link href="/catalogo" className="btn btn-secondary">Ver catálogo</Link>
          </>
        }
      />
    </div>
  );
}
