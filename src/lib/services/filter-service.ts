import { db } from '@/lib/db';
import { employees } from '@/lib/database/schema';
import { eq, isNotNull, and } from 'drizzle-orm';

export interface FilterOption {
  value: string;
  label: string;
  count: number;
}

export interface FilterOptions {
  departments: FilterOption[];
  areas: FilterOption[];
  designations: FilterOption[];
  categories: FilterOption[];
  grades: FilterOption[];
  genders: FilterOption[];
  bloodGroups: FilterOption[];
}

export interface FilterStats {
  totalEmployees: number;
  lastUpdated: Date;
}

// In-memory cache for filter options (refreshed every 5 minutes)
let filterOptionsCache: FilterOptions | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export class FilterService {
  /**
   * Get all filter options with counts - cached for performance
   */
  static async getFilterOptions(forceRefresh: boolean = false): Promise<FilterOptions> {
    const now = Date.now();
    
    // Return cached data if still valid and not forcing refresh
    if (!forceRefresh && filterOptionsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      console.log('✅ FilterService - Using cached filter options');
      return filterOptionsCache;
    }

    console.log('🔄 FilterService - Refreshing filter options from database');

    try {
      // Single query to get all filter data for better performance
      const allFilterData = await db
        .select({
          department: employees.department,
          areaName: employees.areaName,
          designation: employees.designation,
          category: employees.category,
          grade: employees.grade,
          gender: employees.gender,
          bloodGroup: employees.bloodGroup
        })
        .from(employees)
        .where(eq(employees.isActive, true));

      // Process results to get unique values with counts
      const departmentCounts = new Map<string, number>();
      const areaCounts = new Map<string, number>();
      const designationCounts = new Map<string, number>();
      const categoryCounts = new Map<string, number>();
      const gradeCounts = new Map<string, number>();
      const genderCounts = new Map<string, number>();
      const bloodGroupCounts = new Map<string, number>();

      // Count occurrences of each filter value
      allFilterData.forEach(row => {
        if (row.department) {
          departmentCounts.set(row.department, (departmentCounts.get(row.department) || 0) + 1);
        }
        if (row.areaName) {
          areaCounts.set(row.areaName, (areaCounts.get(row.areaName) || 0) + 1);
        }
        if (row.designation) {
          designationCounts.set(row.designation, (designationCounts.get(row.designation) || 0) + 1);
        }
        if (row.category) {
          categoryCounts.set(row.category, (categoryCounts.get(row.category) || 0) + 1);
        }
        if (row.grade) {
          gradeCounts.set(row.grade, (gradeCounts.get(row.grade) || 0) + 1);
        }
        if (row.gender) {
          genderCounts.set(row.gender, (genderCounts.get(row.gender) || 0) + 1);
        }
        if (row.bloodGroup) {
          bloodGroupCounts.set(row.bloodGroup, (bloodGroupCounts.get(row.bloodGroup) || 0) + 1);
        }
      });

      // Convert maps to sorted arrays of FilterOption
      const departments: FilterOption[] = Array.from(departmentCounts.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label));

      const areas: FilterOption[] = Array.from(areaCounts.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label));

      const designations: FilterOption[] = Array.from(designationCounts.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label));

      const categories: FilterOption[] = Array.from(categoryCounts.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label));

      const grades: FilterOption[] = Array.from(gradeCounts.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => a.label.localeCompare(b.label));

      const genders: FilterOption[] = Array.from(genderCounts.entries())
        .map(([value, count]) => ({
          value,
          label: value === 'M' ? 'Male' : value === 'F' ? 'Female' : value,
          count
        }))
        .sort((a, b) => a.label.localeCompare(b.label));

      // Debug blood group data
      console.log('🩸 Blood Group Raw Counts:', Array.from(bloodGroupCounts.entries()));
      
      // Normalize blood groups to handle inconsistent data
      const normalizedBloodGroupCounts = new Map<string, number>();
      bloodGroupCounts.forEach((count, bloodGroup) => {
        // Normalize by removing spaces and converting to uppercase
        const normalized = bloodGroup.replace(/\s+/g, '').toUpperCase();
        normalizedBloodGroupCounts.set(
          normalized,
          (normalizedBloodGroupCounts.get(normalized) || 0) + count
        );
      });

      const bloodGroups: FilterOption[] = Array.from(normalizedBloodGroupCounts.entries())
        .map(([value, count]) => ({ value, label: value, count }))
        .sort((a, b) => {
          // Sort blood groups in a logical order
          const order = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'];
          const aIndex = order.indexOf(a.label);
          const bIndex = order.indexOf(b.label);
          if (aIndex !== -1 && bIndex !== -1) {
            return aIndex - bIndex;
          }
          return a.label.localeCompare(b.label);
        });
      
      console.log('🩸 Blood Group Transformed:', bloodGroups);

      // Cache the results
      filterOptionsCache = {
        departments,
        areas,
        designations,
        categories,
        grades,
        genders,
        bloodGroups
      };
      cacheTimestamp = now;

      console.log('✅ FilterService - Filter options refreshed successfully:', {
        departments: departments.length,
        areas: areas.length,
        designations: designations.length,
        categories: categories.length,
        grades: grades.length,
        genders: genders.length,
        bloodGroups: bloodGroups.length,
        totalRecords: allFilterData.length,
        bloodGroupDetails: bloodGroups
      });

      return filterOptionsCache;

    } catch (error) {
      console.error('❌ FilterService - Error fetching filter options:', error);
      
      // Return empty options on error
      const emptyOptions: FilterOptions = {
        departments: [],
        areas: [],
        designations: [],
        categories: [],
        grades: [],
        genders: [],
        bloodGroups: []
      };

      return emptyOptions;
    }
  }

  /**
   * Get filter statistics
   */
  static async getFilterStats(): Promise<FilterStats> {
    try {
      const result = await db
        .select({
          count: employees.id
        })
        .from(employees)
        .where(eq(employees.isActive, true));

      return {
        totalEmployees: result.length,
        lastUpdated: new Date()
      };
    } catch (error) {
      console.error('❌ FilterService - Error fetching filter stats:', error);
      return {
        totalEmployees: 0,
        lastUpdated: new Date()
      };
    }
  }

  /**
   * Validate that a filter value exists in the database
   */
  static async validateFilterValue(
    filterType: keyof FilterOptions,
    value: string
  ): Promise<boolean> {
    if (!value || value === 'all') return true;

    try {
      const options = await this.getFilterOptions();
      const validOptions = options[filterType];
      return validOptions.some(option => option.value === value);
    } catch (error) {
      console.error(`❌ FilterService - Error validating ${filterType}:`, error);
      return false;
    }
  }

  /**
   * Get specific filter options for a field
   */
  static async getFieldOptions(field: keyof FilterOptions): Promise<FilterOption[]> {
    const allOptions = await this.getFilterOptions();
    return allOptions[field] || [];
  }

  /**
   * Clear the cache (useful for testing or after data updates)
   */
  static clearCache(): void {
    filterOptionsCache = null;
    cacheTimestamp = 0;
    console.log('🗑️ FilterService - Cache cleared');
  }

  /**
   * Get cache status for debugging
   */
  static getCacheStatus(): { isCached: boolean; age: number; totalOptions: number } {
    const age = filterOptionsCache ? Date.now() - cacheTimestamp : -1;
    const totalOptions = filterOptionsCache 
      ? Object.values(filterOptionsCache).reduce((sum, options) => sum + options.length, 0)
      : 0;

    return {
      isCached: !!filterOptionsCache,
      age,
      totalOptions
    };
  }
} 