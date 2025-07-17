import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { EmployeeCard } from "./employee-card";
import { EmployeeDetailModal } from "./employee-detail-modal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { type Employee } from "@shared/schema";
import { MagnifyingGlass } from "@phosphor-icons/react";

interface EmployeeGridProps {
  searchQuery?: string;
  filters?: Record<string, string>;
  onEmployeeClick?: (employee: Employee) => void;
}

export function EmployeeGrid({ searchQuery = "", filters = {}, onEmployeeClick }: EmployeeGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const pageSize = 20;

  // useEffect must be called before any conditional returns
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters]);

  // Simple fallback for testing
  const { data, isLoading, error } = useQuery({
    queryKey: [`/api/employees?q=${searchQuery}&page=${currentPage}&limit=${pageSize}${Object.entries(filters).filter(([_, value]) => value).map(([key, value]) => `&${key}=${value}`).join("")}`],
  });

  // console.log("EmployeeGrid state:", { data, isLoading, error, searchQuery, filters, currentPage });

  // Emergency fallback - show something basic first
  if (isLoading) {
    return <div className="text-center py-12">Loading employees...</div>;
  }

  if (error) {
    return <div className="text-center py-12 text-red-500">Error: {String(error)}</div>;
  }

  if (!data) {
    return <div className="text-center py-12">No data received</div>;
  }

  if (!data?.employees || data.employees.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-muted-foreground text-lg mb-4">
          <MagnifyingGlass className="inline mr-2" size={20} />
          No employees found
        </div>
        <p className="text-muted-foreground">
          Try adjusting your search criteria or filters
        </p>
      </div>
    );
  }

  const totalPages = Math.ceil(data.total / pageSize);

  // console.log("About to render employees:", data.employees.length);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {data.employees.map((employee: Employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            onClick={() => {
              if (onEmployeeClick) {
                onEmployeeClick(employee);
              } else {
                setSelectedEmployee(employee);
              }
            }}
          />
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex justify-center">
          <nav className="flex items-center space-x-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const page = i + Math.max(1, currentPage - 2);
              if (page > totalPages) return null;
              
              return (
                <Button
                  key={page}
                  variant={page === currentPage ? "default" : "outline"}
                  onClick={() => setCurrentPage(page)}
                  className="min-w-[2.5rem]"
                >
                  {page}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </nav>
        </div>
      )}

      <EmployeeDetailModal
        employee={selectedEmployee}
        onClose={() => setSelectedEmployee(null)}
      />
    </>
  );
}
