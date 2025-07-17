import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { MagnifyingGlass, Funnel, Download } from "@phosphor-icons/react";

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface SearchFiltersProps {
  onSearchChange: (query: string) => void;
  onFiltersChange: (filters: Record<string, string>) => void;
}

export function SearchFilters({ onSearchChange, onFiltersChange }: SearchFiltersProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const debouncedSearch = useDebounce(searchQuery, 300);
  
  useEffect(() => {
    onSearchChange(debouncedSearch);
  }, [debouncedSearch, onSearchChange]);

  const { data: filterOptions } = useQuery({
    queryKey: ["/api/employees/filter-options"],
  });

  const handleFilterChange = (key: string, value: string) => {
    // Handle "all-*" values as clearing the filter
    const filterValue = value.startsWith('all-') ? undefined : value;
    const newFilters = {
      ...filters,
      [key]: filterValue
    };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  const exportData = async () => {
    try {
      const params = new URLSearchParams({
        q: debouncedSearch,
        ...Object.fromEntries(Object.entries(filters).filter(([_, value]) => value)),
      });
      
      const response = await fetch(`/api/employees/export?${params}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("sessionToken")}`,
        },
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "employees.csv";
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card border-b border-border">
        <div className="py-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Search Bar */}
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex flex-wrap gap-2 lg:gap-4">
              <Select value={filters.department || "all-departments"} onValueChange={(value) => handleFilterChange("department", value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-departments">All Departments</SelectItem>
                  {filterOptions?.departments?.map((dept: string) => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filters.location || "all-locations"} onValueChange={(value) => handleFilterChange("location", value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="All Locations" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-locations">All Locations</SelectItem>
                  {filterOptions?.locations?.map((location: string) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline">
                    <Funnel className="mr-2" size={16} />
                    <span className="hidden sm:inline">Filters</span>
                  </Button>
                </SheetTrigger>
                <SheetContent>
                  <SheetHeader>
                    <SheetTitle>Advanced Filters</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Category</label>
                      <Select value={filters.category || "all-categories"} onValueChange={(value) => handleFilterChange("category", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Categories" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-categories">All Categories</SelectItem>
                          {filterOptions?.categories?.map((category: string) => (
                            <SelectItem key={category} value={category}>{category}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Grade</label>
                      <Select value={filters.grade || "all-grades"} onValueChange={(value) => handleFilterChange("grade", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Grades" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-grades">All Grades</SelectItem>
                          {filterOptions?.grades?.map((grade: string) => (
                            <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Gender</label>
                      <Select value={filters.gender || "all-genders"} onValueChange={(value) => handleFilterChange("gender", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Genders" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-genders">All Genders</SelectItem>
                          {filterOptions?.genders?.map((gender: string) => (
                            <SelectItem key={gender} value={gender}>{gender}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Blood Group</label>
                      <Select value={filters.bloodGroup || "all-blood-groups"} onValueChange={(value) => handleFilterChange("bloodGroup", value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="All Blood Groups" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all-blood-groups">All Blood Groups</SelectItem>
                          {filterOptions?.bloodGroups?.map((bg: string) => (
                            <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={clearFilters} variant="outline" className="flex-1">
                        Clear All
                      </Button>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Button onClick={exportData}>
                <Download className="mr-2" size={16} />
                <span className="hidden sm:inline">Export</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

