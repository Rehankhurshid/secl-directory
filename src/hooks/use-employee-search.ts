import { useMemo, useState, useEffect, useRef } from 'react';

interface Employee {
  id: number;
  empCode: string;
  name: string;
  designation: string | null;
  department: string | null;
  areaName: string | null;
  unitName: string | null;
  emailId: string | null;
  phoneNumber1: string | null;
  phoneNumber2: string | null;
  category: string | null;
  grade: string | null;
  discipline: string | null;
  fatherName: string | null;
  dob: string | null;
  gender: string | null;
  bloodGroup: string | null;
  profileImage?: string | null;
  isActive: boolean;
}

interface SearchFilters {
  search?: string;
  department?: string;
  area?: string;
  designation?: string;
  category?: string;
  grade?: string;
  gender?: string;
  bloodGroup?: string;
}

interface SearchIndex {
  id: number;
  searchableText: string;
  keywords: string[];
}

interface EmployeeSearchResult {
  filteredEmployees: Employee[];
  totalResults: number;
  isSearching: boolean;
  searchTime: number;
}

/**
 * High-performance employee search hook with:
 * - Pre-built search index for instant filtering
 * - Memoized search operations
 * - Chunked processing for large datasets
 * - Optimized string matching
 */
export function useEmployeeSearch(
  employees: Employee[],
  filters: SearchFilters
): EmployeeSearchResult {
  // Initialize states that need to be consistent between server and client
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  // Pre-built search index for instant text matching
  const searchIndex = useMemo(() => {
    const startTime = performance.now();
    
    const index: Map<number, SearchIndex> = new Map();
    
    employees.forEach(employee => {
      // Create comprehensive searchable text
      const searchableFields = [
        employee.name,
        employee.empCode,
        employee.designation,
        employee.department,
        employee.areaName,
        employee.emailId,
        employee.phoneNumber1,
        employee.discipline,
        employee.category,
        employee.grade
      ].filter(Boolean).join(' ').toLowerCase();

      // Create keyword array for faster prefix matching
      const keywords = [
        employee.name?.toLowerCase(),
        employee.empCode?.toLowerCase(),
        employee.designation?.toLowerCase(),
        employee.department?.toLowerCase(),
        employee.emailId?.toLowerCase()
      ].filter(Boolean) as string[];

      index.set(employee.id, {
        id: employee.id,
        searchableText: searchableFields,
        keywords
      });
    });

    const indexTime = performance.now() - startTime;
    // console.log(`Search index built in ${indexTime.toFixed(2)}ms for ${employees.length} employees`);
    
    return index;
  }, [employees]);

  // Optimized text search function
  const searchInText = useMemo(() => {
    return (searchTerm: string, searchData: SearchIndex): boolean => {
      if (!searchTerm) return true;
      
      const term = searchTerm.toLowerCase().trim();
      if (term.length === 0) return true;
      
      // Fast keyword prefix matching first
      const keywordMatch = searchData.keywords.some(keyword => keyword.startsWith(term));
      if (keywordMatch) {
        return true;
      }
      
      // Full text search as fallback
      const textMatch = searchData.searchableText.includes(term);
      return textMatch;
    };
  }, []);

  // Optimized filter matching
  const matchesFilters = useMemo(() => {
    return (employee: Employee, filters: SearchFilters): boolean => {
      // Department filter
      if (filters.department && filters.department !== 'all') {
        if (employee.department !== filters.department) return false;
      }
      
      // Area filter
      if (filters.area && filters.area !== 'all') {
        if (employee.areaName !== filters.area) return false;
      }
      
      // Designation filter
      if (filters.designation && filters.designation !== 'all') {
        if (employee.designation !== filters.designation) return false;
      }
      
      // Category filter
      if (filters.category && filters.category !== 'all') {
        if (employee.category !== filters.category) return false;
      }
      
      // Grade filter
      if (filters.grade && filters.grade !== 'all') {
        if (employee.grade !== filters.grade) return false;
      }
      
      // Gender filter
      if (filters.gender && filters.gender !== 'all') {
        if (employee.gender !== filters.gender) return false;
      }
      
      // Blood group filter
      if (filters.bloodGroup && filters.bloodGroup !== 'all') {
        if (employee.bloodGroup !== filters.bloodGroup) return false;
      }
      
      return true;
    };
  }, []);

  // Chunked processing for large datasets
  const processInChunks = useMemo(() => {
    return <T,>(array: T[], chunkSize: number, processor: (chunk: T[]) => T[]): Promise<T[]> => {
      return new Promise((resolve) => {
        const results: T[] = [];
        let index = 0;

        const processChunk = () => {
          const chunk = array.slice(index, index + chunkSize);
          if (chunk.length === 0) {
            resolve(results);
            return;
          }

          const processed = processor(chunk);
          results.push(...processed);
          index += chunkSize;

          // Use setTimeout to prevent blocking the main thread
          setTimeout(processChunk, 0);
        };

        processChunk();
      });
    };
  }, []);

  // Main filtering logic with performance optimization
  const filteredEmployees = useMemo(() => {
    const startTime = performance.now();
    
    // Get search term and check if we have filters
    const searchTerm = filters.search || '';
    const hasTextSearch = searchTerm.trim().length > 0;
    const hasFilters = Object.entries(filters).some(([key, value]) => 
      key !== 'search' && value && value !== 'all'
    );
    
    console.log('🔎 useEmployeeSearch - searchTerm:', searchTerm, 'hasTextSearch:', hasTextSearch, 'filters:', filters);
    
    // Only update searching state after component has mounted to avoid hydration issues
    if (isMountedRef.current) {
      // Only show searching state if we have an actual search term that's being typed
      // Don't show it for filter changes or initial load
      if (hasTextSearch && searchTerm.length > 1) {
        setIsSearching(true);
        
        // Clear previous timeout
        if (searchTimeoutRef.current) {
          clearTimeout(searchTimeoutRef.current);
        }

        // Set searching to false after a delay
        searchTimeoutRef.current = setTimeout(() => {
          setIsSearching(false);
        }, 150);
      } else {
        // Immediately set to false for empty search or very short searches
        setIsSearching(false);
      }
    }
    
    // Log for debugging if needed
    // console.log('useEmployeeSearch - searchTerm:', searchTerm, 'hasTextSearch:', hasTextSearch);

    // If no filters or search, return all employees
    if (!hasTextSearch && !hasFilters) {
      const endTime = performance.now();
      setSearchTime(endTime - startTime);
      return employees;
    }

    let results: Employee[] = [];

    if (hasTextSearch) {
      // Text search using index
      const normalizedSearchTerm = searchTerm.toLowerCase().trim();
      const employeeMap = new Map(employees.map(emp => [emp.id, emp]));
      
      for (const [employeeId, searchData] of searchIndex) {
        if (searchInText(normalizedSearchTerm, searchData)) {
          const employee = employeeMap.get(employeeId);
          if (employee && matchesFilters(employee, filters)) {
            results.push(employee);
          }
        }
      }
    } else {
      // Filter-only search
      results = employees.filter(employee => matchesFilters(employee, filters));
    }

    const endTime = performance.now();
    const searchDuration = endTime - startTime;
    setSearchTime(searchDuration);
    
    // Log for debugging if needed
    // console.log(`Search completed in ${searchDuration.toFixed(2)}ms - ${results.length} results`);
    
    return results;
  }, [employees, filters, searchIndex, searchInText, matchesFilters]);

  // Set mounted ref and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;
    
    return () => {
      isMountedRef.current = false;
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    filteredEmployees,
    totalResults: filteredEmployees.length,
    isSearching,
    searchTime
  };
} 