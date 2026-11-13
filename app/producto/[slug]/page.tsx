import type { Metadata } from "next";
import { ProductDetail } from "@/components/product/ProductDetail";
import { siteUrl } from "@/data/site";
import { getCatalog } from "@/lib/server-catalog";
import { isSoldOut } from "@/lib/catalog";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/** Los productos nuevos que no estén aquí se generan al primer acceso y se revalidan cada 60 s (ver app/layout.tsx). */
export async function generateStaticParams() {
  const products = (await getCatalog()) ?? [];
  return products.filter((p) => p.active).map((p) => ({ slug: p.slug }));
}

async function findProduct(slug: string) {
  const products = (await getCatalog()) ?? [];
  return products.find((p) => p.slug === slug && p.active);
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return { title: "Producto", robots: { index: false } };
  const image = product.images[0];
  return {
    title: product.name,
    description: product.description,
    alternates: { canonical: `/producto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description,
      type: "website",
      url: `/producto/${product.slug}`,
      images: image ? [{ url: image, alt: product.name }] : undefined,
    },
  };
}

/** El detalle interactivo (variantes, carrito) se resuelve en el cliente; aquí se entrega el SEO y los datos estructurados. */
export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await findProduct(slug);
  const jsonLd = product && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((src) => (src.startsWith("http") ? src : `${siteUrl}${src}`)),
    material: product.material,
    sku: product.variants[0]?.sku,
    brand: { "@type": "Brand", name: "MariArte" },
    offers: {
      "@type": "Offer",
      url: `${siteUrl}/producto/${product.slug}`,
      priceCurrency: "PEN",
      price: product.price.toFixed(2),
      availability: isSoldOut(product) ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
    },
  };
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <ProductDetail slug={slug} />
    </>
  );
}
