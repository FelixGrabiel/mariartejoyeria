import type { Metadata } from "next";
import { ProductDetail } from "@/components/product/ProductDetail";
import { initialProducts } from "@/data/products";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return initialProducts.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = initialProducts.find((p) => p.slug === slug);
  return {
    title: product?.name ?? "Producto",
    description: product?.description ?? "Joya de MariArte.",
  };
}

/**
 * El detalle se resuelve en el cliente porque el catálogo demo puede editarse
 * desde /admin-demo (localStorage). Con Supabase, consulta el producto aquí en
 * el servidor y pásalo como prop.
 */
export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  return <ProductDetail slug={slug} />;
}
