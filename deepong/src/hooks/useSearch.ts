import { useState, useMemo } from "react";

interface UseSearchProps<T> {
  items: T[];
  filterFn: (item: T, query: string) => boolean;
}

export function useSearch<T>({ items, filterFn }: UseSearchProps<T>) {
  const [query, setQuery] = useState("");

  const filteredItems = useMemo(() => {
    if (!query.trim()) return items;
    return items.filter((item) => filterFn(item, query.toLowerCase()));
  }, [items, query, filterFn]);

  return {
    query,
    setQuery,
    filteredItems,
    hasResults: filteredItems.length > 0,
  };
}
