"use client";

import { useStore } from "@/context/StoreContext";
import { categories } from "@/data/categories";
import { materialTypes, priceRanges, type CatalogFilters, type PriceRange } from "@/lib/catalog";
import { cn } from "@/lib/format";
import type { CategoryId, MaterialType } from "@/types";

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((v) => v !== value) : [...list, value];
}

function CheckRow({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="flex min-h-10 cursor-pointer items-center gap-3 text-[14px] text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-[18px] w-[18px] rounded border-line accent-rose"
      />
      <span className="flex-1">{label}</span>
      {count !== undefined && <span className="text-xs text-muted">{count}</span>}
    </label>
  );
}

export function FilterPanel({
  filters,
  onChange,
  counts,
  className,
}: {
  filters: CatalogFilters;
  onChange: (filters: CatalogFilters) => void;
  counts: Record<string, number>;
  className?: string;
}) {
  const set = (patch: Partial<CatalogFilters>) => onChange({ ...filters, ...patch });
  const { activeThemes } = useStore();

  return (
    <div className={cn("space-y-8", className)}>
      {activeThemes.length > 0 && (
        <fieldset>
          <legend className="eyebrow mb-3">Significado</legend>
          {activeThemes.filter((t) => (counts[`tema:${t.id}`] ?? 0) > 0 || filters.themes.includes(t.id)).map((t) => (
            <CheckRow
              key={t.id}
              label={t.name}
              count={counts[`tema:${t.id}`] ?? 0}
              checked={filters.themes.includes(t.id)}
              onChange={() => set({ themes: toggle<string>(filters.themes, t.id) })}
            />
          ))}
        </fieldset>
      )}

      <fieldset>
        <legend className="eyebrow mb-3">Categoría</legend>
        {categories.filter((c) => (counts[c.id] ?? 0) > 0 || filters.categories.includes(c.id)).map((c) => (
          <CheckRow
            key={c.id}
            label={c.name}
            count={counts[c.id] ?? 0}
            checked={filters.categories.includes(c.id)}
            onChange={() => set({ categories: toggle<CategoryId>(filters.categories, c.id) })}
          />
        ))}
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3">Material</legend>
        {materialTypes.map((m) => (
          <CheckRow
            key={m}
            label={m}
            count={counts[m] ?? 0}
            checked={filters.materials.includes(m)}
            onChange={() => set({ materials: toggle<MaterialType>(filters.materials, m) })}
          />
        ))}
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3">Precio</legend>
        {priceRanges.map((r) => (
          <label key={r.value} className="flex min-h-10 cursor-pointer items-center gap-3 text-[14px] text-ink">
            <input
              type="radio"
              name="price-range"
              value={r.value}
              checked={filters.price === r.value}
              onChange={() => set({ price: r.value as PriceRange })}
              className="h-[18px] w-[18px] accent-rose"
            />
            {r.label}
          </label>
        ))}
      </fieldset>

      <fieldset>
        <legend className="eyebrow mb-3">Disponibilidad</legend>
        <CheckRow
          label="Ocultar agotados"
          checked={filters.onlyAvailable}
          onChange={() => set({ onlyAvailable: !filters.onlyAvailable })}
        />
      </fieldset>
    </div>
  );
}
