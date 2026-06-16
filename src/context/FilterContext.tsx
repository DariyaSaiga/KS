"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type SortBy = "newest" | "oldest";

export type FilterState = {
  sortBy: SortBy;
  levelFilter: string;   // "" = any
  colorFilter: string;   // "" = any (hex value)
  hideCompleted: boolean;
};

type FilterContextType = FilterState & {
  setSortBy: (v: SortBy) => void;
  setLevelFilter: (v: string) => void;
  setColorFilter: (v: string) => void;
  setHideCompleted: (v: boolean) => void;
  resetFilters: () => void;
};

const FilterContext = createContext<FilterContextType | null>(null);

const DEFAULT: FilterState = {
  sortBy: "newest",
  levelFilter: "",
  colorFilter: "",
  hideCompleted: false,
};

export function FilterContextProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<FilterState>(DEFAULT);

  const setSortBy = (v: SortBy) => setState(s => ({ ...s, sortBy: v }));
  const setLevelFilter = (v: string) => setState(s => ({ ...s, levelFilter: v }));
  const setColorFilter = (v: string) => setState(s => ({ ...s, colorFilter: v }));
  const setHideCompleted = (v: boolean) => setState(s => ({ ...s, hideCompleted: v }));
  const resetFilters = () => setState(DEFAULT);

  return (
    <FilterContext.Provider value={{ ...state, setSortBy, setLevelFilter, setColorFilter, setHideCompleted, resetFilters }}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilterContext(): FilterContextType {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilterContext must be used within FilterContextProvider");
  return ctx;
}
