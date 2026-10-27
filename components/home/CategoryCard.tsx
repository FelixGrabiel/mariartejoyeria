import Link from "next/link";
import type { Category } from "@/types";
import { ArrowRight } from "@/components/ui/icons";
import { ProductImage } from "@/components/ui/ProductImage";

export function CategoryCard({ category, cover }: { category: Category; cover?: string }) {
  return (
    <Link
      href={`/catalogo?categoria=${category.id}`}
      className="group block w-[42vw] max-w-[220px] shrink-0 snap-start sm:w-auto sm:max-w-none"
    >
      <div className="relative aspect-[3/4] overflow-hidden rounded-t-[999px] rounded-b-[1.4rem] bg-blush-soft">
        <ProductImage
          src={cover ?? category.image}
          alt=""
          sizes="(min-width: 1024px) 220px, 42vw"
          className="transition duration-700 group-hover:scale-[1.05]"
        />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <h3 className="font-serif text-[1.35rem] font-semibold text-ink">{category.name}</h3>
        <ArrowRight size={16} className="text-rose transition group-hover:translate-x-1" />
      </div>
      <p className="mt-0.5 text-[13px] leading-snug text-muted">{category.description}</p>
    </Link>
  );
}
