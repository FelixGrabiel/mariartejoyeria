"use client";

import { sortOptions, type SortOption } from "@/lib/catalog";
import { ChevronDown } from "@/components/ui/icons";

export function SortSelect({ value, onChange }: { value: SortOption; onChange: (value: SortOption) => void }) {
  return (
    <div className="relative">
      <label htmlFor="catalog-sort" className="sr-only">
        Ordenar por
      </label>
      <select
        id="catalog-sort"
        value={value}
        onChange={(e) => onChange(e.target.value as SortOption)}
        className="field appearance-none rounded-full pr-10 text-[14px]"
      >
        {sortOptions.map((o) => (
          <option key={o.value} value={o.value}>
            Ordenar: {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={16} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted" />
    </div>
  );
}
