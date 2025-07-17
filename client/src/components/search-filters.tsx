import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Search, X, Filter, Building, MapPin, Award, Users, UserCheck, Droplets } from "lucide-react";
import { useEmployeeStats } from "@/hooks/use-employees";
import type { EmployeeSearch } from "@shared/schema";

interface SearchFiltersProps {
  filters: EmployeeSearch;
  onFiltersChange: (filters: EmployeeSearch) => void;
  totalEmployees: number;
  filteredCount: number;
}

export function SearchFilters({ 
  filters, 
  onFiltersChange, 
  totalEmployees,
  filteredCount 
}: SearchFiltersProps) {
  const { data: stats } = useEmployeeStats();

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value });
  };

  const handleDepartmentChange = (value: string) => {
    onFiltersChange({ ...filters, department: value === "all" ? undefined : value });
  };

  const handleLocationChange = (value: string) => {
    onFiltersChange({ ...filters, location: value === "all" ? undefined : value });
  };

  const handleGradeChange = (value: string) => {
    onFiltersChange({ ...filters, grade: value === "all" ? undefined : value });
  };

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ ...filters, category: value === "all" ? undefined : value });
  };

  const handleGenderChange = (value: string) => {
    onFiltersChange({ ...filters, gender: value === "all" ? undefined : value });
  };

  const handleBloodGroupChange = (value: string) => {
    onFiltersChange({ ...filters, bloodGroup: value === "all" ? undefined : value });
  };

  const handleClearFilters = () => {
    onFiltersChange({ page: 1, limit: 20, sortBy: "name" });
  };

  const hasActiveFilters = filters.search || filters.department || filters.location || filters.grade || filters.category || filters.gender || filters.bloodGroup;

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full lg:w-auto lg:h-auto h-12 w-12 p-0 lg:p-2 rounded-full lg:rounded-md shadow-lg lg:shadow-sm border-0 lg:border relative ${
            hasActiveFilters 
              ? 'bg-orange-500 text-white lg:bg-orange-500 lg:text-white' 
              : 'bg-primary text-primary-foreground lg:bg-background lg:text-foreground'
          }`}
          data-testid="filter-trigger"
        >
          <Filter className="w-5 h-5 lg:w-4 lg:h-4 lg:mr-2" />
          <span className="hidden lg:inline">Filters</span>
          {hasActiveFilters && (
            <Badge variant="secondary" className="ml-2 hidden lg:inline-flex">
              {filteredCount} of {totalEmployees}
            </Badge>
          )}
          {hasActiveFilters && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center lg:hidden">
              <span className="text-xs text-white font-bold">!</span>
            </div>
          )}
        </Button>
      </DrawerTrigger>
      <DrawerContent className="max-h-[90vh] flex flex-col">
        <DrawerHeader className="flex-shrink-0">
          <DrawerTitle className="flex items-center justify-between">
            <span>Filter Employees</span>
            <Badge variant="outline">{filteredCount} of {totalEmployees}</Badge>
          </DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Search */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or employee ID..."
                value={filters.search || ""}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Department Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Building className="w-4 h-4 mr-2" />
              Department
            </label>
            <Select value={filters.department || "all"} onValueChange={handleDepartmentChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {stats?.departments.filter(dept => dept.name && dept.name.trim() !== "").map((dept) => (
                  <SelectItem key={dept.name} value={dept.name}>
                    {dept.name} ({dept.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Location Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <MapPin className="w-4 h-4 mr-2" />
              Location
            </label>
            <Select value={filters.location || "all"} onValueChange={handleLocationChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Locations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {stats?.locations.filter(location => location.name && location.name.trim() !== "").map((location) => (
                  <SelectItem key={location.name} value={location.name}>
                    {location.name} ({location.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grade Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Award className="w-4 h-4 mr-2" />
              Grade
            </label>
            <Select value={filters.grade || "all"} onValueChange={handleGradeChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Grades" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Grades</SelectItem>
                {stats?.grades.filter(grade => grade.name && grade.name.trim() !== "").map((grade) => (
                  <SelectItem key={grade.name} value={grade.name}>
                    {grade.name} ({grade.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Category
            </label>
            <Select value={filters.category || "all"} onValueChange={handleCategoryChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {stats?.categories.filter(category => category.name && category.name.trim() !== "").map((category) => (
                  <SelectItem key={category.name} value={category.name}>
                    {category.name} ({category.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Gender Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <UserCheck className="w-4 h-4 mr-2" />
              Gender
            </label>
            <Select value={filters.gender || "all"} onValueChange={handleGenderChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                {stats?.genders.filter(gender => gender.name && gender.name.trim() !== "" && gender.name !== "null").map((gender) => (
                  <SelectItem key={gender.name} value={gender.name}>
                    {gender.name === "M" ? "Male" : gender.name === "F" ? "Female" : gender.name} ({gender.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Blood Group Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center">
              <Droplets className="w-4 h-4 mr-2 text-red-500" />
              Blood Group
            </label>
            <Select value={filters.bloodGroup || "all"} onValueChange={handleBloodGroupChange}>
              <SelectTrigger>
                <SelectValue placeholder="All Blood Groups" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Blood Groups</SelectItem>
                {stats?.bloodGroups.filter(bloodGroup => bloodGroup.name && bloodGroup.name.trim() !== "").map((bloodGroup) => (
                  <SelectItem key={bloodGroup.name} value={bloodGroup.name}>
                    {bloodGroup.name} ({bloodGroup.count})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

        </div>
        
        {/* Clear Filters Button - Sticky at bottom */}
        <div className="flex-shrink-0 border-t border-border p-4">
          <Button 
            variant="secondary" 
            onClick={handleClearFilters}
            className="w-full"
          >
            <X className="w-4 h-4 mr-2" />
            Clear Filters
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
