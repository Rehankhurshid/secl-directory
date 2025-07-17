import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Employee, EmployeeSearch } from "@shared/schema";

export function useInfiniteEmployees(filters?: Omit<EmployeeSearch, 'page' | 'limit'>) {
  const queryParams = new URLSearchParams();
  
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.department) queryParams.append('department', filters.department);
  if (filters?.location) queryParams.append('location', filters.location);
  if (filters?.grade) queryParams.append('grade', filters.grade);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.gender) queryParams.append('gender', filters.gender);
  if (filters?.bloodGroup) queryParams.append('bloodGroup', filters.bloodGroup);
  if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);

  const baseUrl = `/api/employees${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;

  return useInfiniteQuery<{ employees: Employee[]; total: number }>({
    queryKey: ['/api/employees/infinite', filters],
    queryFn: async ({ pageParam = 1 }) => {
      const url = baseUrl + (queryParams.toString() ? '&' : '?') + `page=${pageParam}&limit=20`;
      return await apiRequest(url);
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, allPages) => {
      const currentPage = allPages.length;
      const totalPages = Math.ceil(lastPage.total / 20);
      return currentPage < totalPages ? currentPage + 1 : undefined;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

export function useInfiniteEmployeeStats() {
  return useInfiniteQuery<{
    total: number;
    departments: { name: string; count: number }[];
    locations: { name: string; count: number }[];
    grades: { name: string; count: number }[];
    categories: { name: string; count: number }[];
    genders: { name: string; count: number }[];
    bloodGroups: { name: string; count: number }[];
  }>({
    queryKey: ['/api/employees/stats/infinite'],
    queryFn: async () => {
      return await apiRequest('/api/employees/stats');
    },
    initialPageParam: 1,
    getNextPageParam: () => undefined, // Stats don't need pagination
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}