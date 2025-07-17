import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { Employee, EmployeeSearch } from "@shared/schema";

export function useEmployees(filters?: EmployeeSearch) {
  const queryParams = new URLSearchParams();
  
  if (filters?.search) queryParams.append('search', filters.search);
  if (filters?.department) queryParams.append('department', filters.department);
  if (filters?.location) queryParams.append('location', filters.location);
  if (filters?.grade) queryParams.append('grade', filters.grade);
  if (filters?.category) queryParams.append('category', filters.category);
  if (filters?.gender) queryParams.append('gender', filters.gender);
  if (filters?.bloodGroup) queryParams.append('bloodGroup', filters.bloodGroup);
  if (filters?.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters?.page) queryParams.append('page', filters.page.toString());
  if (filters?.limit) queryParams.append('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const url = `/api/employees${queryString ? `?${queryString}` : ''}`;

  return useQuery<{ employees: Employee[]; total: number }>({
    queryKey: ['/api/employees', filters],
    queryFn: async () => {
      return await apiRequest(url);
    },
    staleTime: Infinity, // Never consider stale
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useEmployee(id: number) {
  return useQuery<Employee>({
    queryKey: ['/api/employees', id],
    queryFn: async () => {
      return await apiRequest(`/api/employees/${id}`);
    },
    enabled: !!id,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useEmployeeStats() {
  return useQuery<{
    total: number;
    departments: { name: string; count: number }[];
    locations: { name: string; count: number }[];
    grades: { name: string; count: number }[];
    categories: { name: string; count: number }[];
    genders: { name: string; count: number }[];
    bloodGroups: { name: string; count: number }[];
  }>({
    queryKey: ['/api/employees/stats'],
    queryFn: async () => {
      return await apiRequest('/api/employees/stats');
    },
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
  });
}

export function useEmployeeSearch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (query: string) => {
      return await apiRequest(`/api/employees/search/${encodeURIComponent(query)}`);
    },
    onSuccess: () => {
      // Don't invalidate queries to avoid unnecessary refetches
    },
  });
}

export function useEmployeeExport() {
  return useMutation({
    mutationFn: async () => {
      // For export, we need to use fetch directly since we need blob response
      const res = await fetch('/api/employees/export', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'employees.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
  });
}
