"use client";

import { Search, X } from "@/components/ui/icons";

export function SearchBar({
  value,
  onChange,
  placeholder = "Buscar por nombre o categoría",
  id = "catalog-search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  return (
    <div role="search" className="relative w-full">
      <label htmlFor={id} className="sr-only">
        Buscar joyas
      </label>
      <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className="field rounded-full pl-11 pr-11 [&::-webkit-search-cancel-button]:hidden"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Borrar búsqueda"
          className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-muted hover:bg-blush-soft hover:text-ink"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
