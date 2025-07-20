'use client';

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';

interface Filters {
  search: string;
  department: string;
  area: string;
  designation: string;
  category: string;
  grade: string;
  gender: string;
  bloodGroup: string;
}

interface FilterContextType {
  filters: Filters;
  setFilter: (key: keyof Filters, value: string) => void;
  setFilters: (filters: Filters) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

const defaultFilters: Filters = {
  search: '',
  department: 'all',
  area: 'all',
  designation: 'all',
  category: 'all',
  grade: 'all',
  gender: 'all',
  bloodGroup: 'all'
};

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [filters, setFiltersState] = useState<Filters>(defaultFilters);

  const setFilter = useCallback((key: keyof Filters, value: string) => {
    setFiltersState(prev => {
      // Only update if the value actually changed
      if (prev[key] === value) return prev;
      return { ...prev, [key]: value };
    });
  }, []);

  const setFilters = useCallback((newFilters: Filters) => {
    setFiltersState(prev => {
      // Check if any values actually changed
      const hasChanged = Object.keys(newFilters).some(
        key => prev[key as keyof Filters] !== newFilters[key as keyof Filters]
      );
      return hasChanged ? newFilters : prev;
    });
  }, []);

  const clearFilters = useCallback(() => {
    setFiltersState(prev => {
      // Check if filters are already clear
      const isAlreadyClear = Object.keys(defaultFilters).every(
        key => prev[key as keyof Filters] === defaultFilters[key as keyof Filters]
      );
      return isAlreadyClear ? prev : defaultFilters;
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(
      ([key, value]) => value !== '' && value !== 'all'
    );
  }, [filters]);

  const contextValue = useMemo(() => ({
    filters,
    setFilter,
    setFilters,
    clearFilters,
    hasActiveFilters
  }), [filters, setFilter, setFilters, clearFilters, hasActiveFilters]);

  return (
    <FilterContext.Provider value={contextValue}>
      {children}
    </FilterContext.Provider>
  );
}

export function useFilters() {
  const context = useContext(FilterContext);
  if (!context) {
    throw new Error('useFilters must be used within a FilterProvider');
  }
  return context;
}