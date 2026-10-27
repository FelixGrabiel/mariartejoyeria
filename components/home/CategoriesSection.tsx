"use client";

import { useStore } from "@/context/StoreContext";
import { categories } from "@/data/categories";
import { SectionHeading } from "@/components/ui/misc";
import { CategoryCard } from "./CategoryCard";

/** Solo muestra las categorías que tienen joyas activas; la portada es la foto de la categoría o la de su primera joya. */
export function CategoriesSection() {
  const { storeProducts } = useStore();
  const visible = categories
    .map((c) => {
      const items = storeProducts.filter((p) => p.categoryId === c.id);
      return { category: c, count: items.length, cover: c.image ?? items.find((p) => p.images[0])?.images[0] };
    })
    .filter((c) => c.count > 0);

  if (visible.length === 0) return null;

  return (
    <section aria-labelledby="categories-title" className="mt-4">
      <div className="container-page">
        <SectionHeading id="categories-title" eyebrow="Para cada momento" title="Explora por categoría" />
      </div>
      <div className="no-scrollbar flex snap-x scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-auto sm:max-w-[1240px] sm:px-7 lg:px-10 sm:grid sm:grid-cols-3 sm:gap-6 sm:overflow-visible lg:grid-cols-5">
        {visible.map(({ category, cover }) => (
          <CategoryCard key={category.id} category={category} cover={cover} />
        ))}
      </div>
    </section>
  );
}
