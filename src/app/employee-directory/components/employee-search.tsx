'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, X, Loader2, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useFilters } from '@/contexts/filter-context';
import { cn } from '@/lib/utils';

interface HighPerformanceSearchProps {
  placeholder?: string;
  debounceMs?: number;
  className?: string;
  showSearchHistory?: boolean;
}

/**
 * High-performance search input with:
 * - Isolated state to prevent parent re-renders
 * - Debounced updates with cleanup
 * - Memoized rendering
 * - Optimistic UI feedback
 * - Robust loading state management
 */
export const HighPerformanceSearch = React.memo(function HighPerformanceSearch({
  placeholder = "Search by name, employee ID, designation, department...",
  debounceMs = 200,
  className,
  showSearchHistory = false
}: HighPerformanceSearchProps) {
  const { filters, setFilter } = useFilters();
  const [localValue, setLocalValue] = useState(filters.search || '');
  const [isSearching, setIsSearching] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Refs for cleanup and debouncing
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const lastSearchRef = useRef(filters.search || '');
  const isUnmountedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  // Reset isSearching state on mount and when filters.search changes externally
  useEffect(() => {
    setIsSearching(false);
    // Only sync if the global filter changed externally and we're not currently typing/searching
    if (filters.search !== lastSearchRef.current && !isSearching) {
      setLocalValue(filters.search || '');
      lastSearchRef.current = filters.search || '';
    }
  }, [filters.search, isSearching]);

  // Optimized search function with proper state management
  const performSearch = useCallback((searchTerm: string) => {
    if (isUnmountedRef.current) return;
    
    console.log('🔍 HighPerformanceSearch - performSearch called with:', searchTerm);
    console.log('🔍 HighPerformanceSearch - lastSearchRef.current:', lastSearchRef.current);
    
    // Always reset searching state first
    setIsSearching(false);
    
    // Only update if the search term actually changed
    if (lastSearchRef.current !== searchTerm) {
      console.log('🔍 HighPerformanceSearch - updating filter from', lastSearchRef.current, 'to', searchTerm);
      setFilter('search', searchTerm);
      lastSearchRef.current = searchTerm;
      
      // Add to search history
      if (searchTerm.trim() && showSearchHistory) {
        setSearchHistory(prev => {
          const newHistory = [searchTerm, ...prev.filter(item => item !== searchTerm)].slice(0, 5);
          return newHistory;
        });
      }
    } else {
      console.log('🔍 HighPerformanceSearch - search term unchanged, skipping update');
    }
  }, [setFilter, showSearchHistory]);

  // Debounced search handler
  const debouncedSearch = useCallback((searchTerm: string) => {
    console.log('🔍 HighPerformanceSearch - debouncedSearch called with:', searchTerm);
    
    if (isUnmountedRef.current) return;

    // Clear any existing timeout
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Handle short searches immediately (1-2 characters or empty)
    if (searchTerm.length <= 2) {
      console.log('🔍 HighPerformanceSearch - short search, processing immediately');
      performSearch(searchTerm);
      return;
    }

    // For longer searches, show loading and debounce
    console.log('🔍 HighPerformanceSearch - longer search, showing loading and debouncing');
    setIsSearching(true);
    
    debounceRef.current = setTimeout(() => {
      console.log('🔍 HighPerformanceSearch - timeout fired, performing search:', searchTerm);
      performSearch(searchTerm);
    }, debounceMs);
  }, [debounceMs, performSearch]);

  // Input change handler with immediate local feedback
  const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    console.log('🔍 HighPerformanceSearch - input changed to:', newValue);
    
    // Immediate local state update for instant UI feedback
    setLocalValue(newValue);
    
    // Close history dropdown when typing
    if (showHistory) {
      setShowHistory(false);
    }
    
    // Perform debounced search
    debouncedSearch(newValue);
  }, [debouncedSearch, showHistory]);

  // Clear search handler with proper state reset
  const handleClear = useCallback(() => {
    // Clear timeout and reset all states
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    setLocalValue('');
    setIsSearching(false);
    setShowHistory(false);
    
    // Update global filter immediately
    setFilter('search', '');
    lastSearchRef.current = '';
    
    // Return focus to input
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }, [setFilter]);

  // History selection handler
  const handleHistorySelect = useCallback((searchTerm: string) => {
    setLocalValue(searchTerm);
    setShowHistory(false);
    debouncedSearch(searchTerm);
    inputRef.current?.focus();
  }, [debouncedSearch]);

  // Input focus handler
  const handleInputFocus = useCallback(() => {
    if (showSearchHistory && searchHistory.length > 0) {
      setShowHistory(true);
    }
  }, [showSearchHistory, searchHistory.length]);

  // Input blur handler
  const handleInputBlur = useCallback(() => {
    // Delay hiding to allow for history selection
    setTimeout(() => {
      setShowHistory(false);
    }, 200);
  }, []);

  // Memoized search icon
  const searchIcon = useMemo(() => {
    if (isSearching && localValue.length > 2) {
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    }
    return <Search className="h-4 w-4 text-muted-foreground" />;
  }, [isSearching, localValue.length]);

  // Memoized clear button
  const clearButton = useMemo(() => {
    if (!localValue) return null;
    
    return (
      <Button
        variant="ghost"
        size="icon"
        className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-muted/50"
        onClick={handleClear}
        onMouseDown={(e) => e.preventDefault()} // Prevent input from losing focus
        aria-label="Clear search"
      >
        <X className="h-4 w-4" />
      </Button>
    );
  }, [localValue, handleClear]);

  return (
    <div className={cn("relative w-full", className)}>
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {searchIcon}
      </div>
      
      <Input
        ref={inputRef}
        type="text"
        placeholder={placeholder}
        value={localValue}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        className={cn(
          "pl-10 pr-10 h-11 transition-all duration-200",
          isSearching && localValue.length > 2 ? "bg-muted/30" : "bg-background",
          "border-input focus:border-ring focus:ring-1 focus:ring-ring"
        )}
        autoComplete="off"
        spellCheck={false}
      />
      
      {clearButton}

      {/* Search History Dropdown */}
      {showSearchHistory && showHistory && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-popover border rounded-md shadow-lg max-h-48 overflow-y-auto">
          <div className="p-2">
            <div className="flex items-center gap-2 px-2 py-1 text-sm text-muted-foreground border-b mb-1">
              <Clock className="h-3 w-3" />
              Recent Searches
            </div>
            {searchHistory.map((term, index) => (
              <button
                key={`${term}-${index}`}
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-muted/50 rounded transition-colors"
                onClick={() => handleHistorySelect(term)}
                onMouseDown={(e) => e.preventDefault()}
              >
                {term}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

HighPerformanceSearch.displayName = "HighPerformanceSearch";

// Legacy component for backward compatibility
export function EmployeeSearch(props: Partial<HighPerformanceSearchProps>) {
  return <HighPerformanceSearch {...props} />;
}