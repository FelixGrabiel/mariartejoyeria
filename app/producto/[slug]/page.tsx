import type { Metadata } from "next";
import { ProductDetail } from "@/components/product/ProductDetail";
import { initialProducts } from "@/data/products";
import { absoluteUrl, fetchPublicProducts, SITE_URL } from "@/lib/seo";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export const revalidate = 300;

export async function generateStaticParams() {
  const remote = await fetchPublicProducts();
  const slugs = remote.length ? remote.map((p) => p.slug) : initialProducts.map((p) => p.slug);
  return slugs.map((slug) => ({ slug }));
}

async function findProduct(slug: string) {
  const remote = await fetchPublicProducts();
  if (remote.length) return remote.find((p) => p.slug === slug);
  const local = initialProducts.find((p) => p.slug === slug);
  return local
    ? { slug: local.slug, name: local.name, description: local.description, price: local.price, images: local.images, inStock: true, createdAt: local.createdAt }
    : undefined;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await findProduct(slug);
  if (!product) return { title: "Producto", description: "Joya de MariArte." };
  const image = product.images[0] ? absoluteUrl(product.images[0]) : undefined;
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `${SITE_URL}/producto/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      url: `${SITE_URL}/producto/${product.slug}`,
      type: "website",
      images: image ? [{ url: image }] : undefined,
    },
  };
}

/** El detalle interactivo se resuelve en el cliente; los metadatos y los datos estructurados salen del servidor. */
export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await findProduct(slug);
  const jsonLd = product && {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map(absoluteUrl),
    url: `${SITE_URL}/producto/${product.slug}`,
    brand: { "@type": "Brand", name: "MariArte" },
    offers: {
      "@type": "Offer",
      priceCurrency: "PEN",
      price: product.price.toFixed(2),
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };
  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <ProductDetail slug={slug} />
    </>
  );
}
