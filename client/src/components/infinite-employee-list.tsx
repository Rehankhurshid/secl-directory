import { useEffect, useMemo } from "react";
import { useInfiniteEmployees } from "@/hooks/use-infinite-employees";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { EmployeeCard } from "./employee-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import type { Employee, EmployeeSearch } from "@shared/schema";

interface InfiniteEmployeeListProps {
  filters: Omit<EmployeeSearch, 'page' | 'limit'>;
  onViewDetails: (employee: Employee) => void;
  onEditEmployee?: (employee: Employee) => void;
  showEditButton?: boolean;
  className?: string;
}

export function InfiniteEmployeeList({ 
  filters, 
  onViewDetails, 
  onEditEmployee,
  showEditButton = false,
  className = "" 
}: InfiniteEmployeeListProps) {
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteEmployees(filters);

  const { elementRef, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px'
  });

  // Load more when intersection observer triggers
  useEffect(() => {
    if (isIntersecting && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isIntersecting, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Flatten all pages into a single array
  const allEmployees = useMemo(() => {
    return data?.pages.flatMap(page => page.employees) || [];
  }, [data]);

  const totalEmployees = data?.pages[0]?.total || 0;

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {/* Results header skeleton */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-6 w-20" />
          </div>
        </div>

        {/* Employee cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card p-4">
              <div className="flex items-start space-x-4">
                <Skeleton className="w-12 h-12 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex space-x-2">
                    <Skeleton className="h-6 w-20" />
                    <Skeleton className="h-6 w-16" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-red-500">Error loading employees: {error?.message}</p>
      </div>
    );
  }

  if (allEmployees.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-muted-foreground">No employees found matching your criteria.</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Results header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Employees</h2>
          <Badge variant="outline">
            {allEmployees.length} of {totalEmployees.toLocaleString()} loaded
          </Badge>
        </div>
      </div>

      {/* Employee grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allEmployees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onViewDetails={onViewDetails}
            onEditEmployee={onEditEmployee}
            showEditButton={showEditButton}
          />
        ))}
      </div>

      {/* Load more trigger */}
      {hasNextPage && (
        <div ref={elementRef} className="mt-8 flex justify-center">
          {isFetchingNextPage ? (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading more employees...</span>
            </div>
          ) : (
            <div className="h-10 flex items-center justify-center text-muted-foreground">
              <span>Scroll to load more</span>
            </div>
          )}
        </div>
      )}

      {/* End of results */}
      {!hasNextPage && allEmployees.length > 0 && (
        <div className="mt-8 text-center text-muted-foreground">
          <p>You've reached the end of the results</p>
        </div>
      )}
    </div>
  );
}