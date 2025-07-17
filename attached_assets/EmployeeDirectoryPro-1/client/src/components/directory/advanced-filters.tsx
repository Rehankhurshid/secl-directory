import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  MagnifyingGlass, 
  Funnel, 
  X, 
  FunnelSimple,
  CheckCircle
} from "@phosphor-icons/react";

interface AdvancedFiltersProps {
  onFiltersChange: (filters: Record<string, any>) => void;
  onSearchChange: (query: string) => void;
  searchQuery: string;
  currentFilters: Record<string, any>;
}

interface FilterOptions {
  departments: string[];
  designations: string[];
  locations: string[];
  grades: string[];
  categories: string[];
  genders: string[];
  bloodGroups: string[];
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female'];
const CATEGORIES = ['Monthly Rated', 'Daily Rated', 'Contract', 'Permanent', 'Temporary'];
const GRADES = ['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7', 'E8', 'E9', 'E10', 'M1', 'M2', 'M3', 'M4', 'M5'];

export function AdvancedFilters({ 
  onFiltersChange, 
  onSearchChange, 
  searchQuery, 
  currentFilters 
}: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(currentFilters);
  const [selectedDepartments, setSelectedDepartments] = useState<string[]>(
    currentFilters.departments || []
  );

  const { data: filterOptions } = useQuery({
    queryKey: ["/api/employees/filter-options"],
    enabled: true,
  });

  const activeFilterCount = Object.values(currentFilters).filter(value => 
    value && value !== "all" && value !== "" && (Array.isArray(value) ? value.length > 0 : true)
  ).length;

  const handleFilterChange = (key: string, value: any) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
  };

  const handleDepartmentToggle = (department: string) => {
    const newDepartments = selectedDepartments.includes(department)
      ? selectedDepartments.filter(d => d !== department)
      : [...selectedDepartments, department];
    
    setSelectedDepartments(newDepartments);
    handleFilterChange('departments', newDepartments);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    setSelectedDepartments([]);
    onFiltersChange(clearedFilters);
  };

  const handleQuickFilter = (key: string, value: string) => {
    const newFilters = { ...currentFilters, [key]: value };
    onFiltersChange(newFilters);
  };

  // Sync local filters with current filters when they change externally
  useEffect(() => {
    setLocalFilters(currentFilters);
    setSelectedDepartments(currentFilters.departments || []);
  }, [currentFilters]);

  return (
    <>
      {/* Search Bar */}
      <div className="w-full max-w-2xl mx-auto mb-6">
        <div className="relative">
          <MagnifyingGlass className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <Input
            placeholder="Search employees by name, ID, email, or phone..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-12 pr-4 py-3 text-base rounded-xl border-2 focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Quick Filter Pills */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center">
        <Button
          variant={currentFilters.category === 'Monthly Rated' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('category', currentFilters.category === 'Monthly Rated' ? '' : 'Monthly Rated')}
          className="rounded-full"
        >
          Monthly Rated
        </Button>
        <Button
          variant={currentFilters.category === 'Daily Rated' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('category', currentFilters.category === 'Daily Rated' ? '' : 'Daily Rated')}
          className="rounded-full"
        >
          Daily Rated
        </Button>
        <Button
          variant={currentFilters.gender === 'Male' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('gender', currentFilters.gender === 'Male' ? '' : 'Male')}
          className="rounded-full"
        >
          Male
        </Button>
        <Button
          variant={currentFilters.gender === 'Female' ? 'default' : 'outline'}
          size="sm"
          onClick={() => handleQuickFilter('gender', currentFilters.gender === 'Female' ? '' : 'Female')}
          className="rounded-full"
        >
          Female
        </Button>
      </div>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 mb-4 justify-center">
          {Object.entries(currentFilters).map(([key, value]) => {
            if (!value || value === "all" || value === "" || (Array.isArray(value) && value.length === 0)) return null;
            
            return (
              <Badge key={key} variant="secondary" className="flex items-center gap-1">
                {key === 'departments' && Array.isArray(value) 
                  ? `${value.length} departments` 
                  : `${key}: ${Array.isArray(value) ? value.join(', ') : value}`}
                <button
                  onClick={() => handleQuickFilter(key, Array.isArray(value) ? [] : 'all')}
                  className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                >
                  <X size={12} />
                </button>
              </Badge>
            );
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-6 text-xs text-destructive hover:text-destructive"
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Floating Filter Button */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50"
            size="icon"
          >
            <div className="relative">
              <FunnelSimple size={24} />
              {activeFilterCount > 0 && (
                <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                  {activeFilterCount}
                </Badge>
              )}
            </div>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Funnel size={20} />
              Advanced Filters
            </DialogTitle>
            <DialogDescription>
              Filter employees by category, grade, department, gender, blood group, and location.
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              {/* Category Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Category</Label>
                <Select 
                  value={localFilters.category || ""} 
                  onValueChange={(value) => handleFilterChange('category', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select category..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {CATEGORIES.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Grade Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Grade</Label>
                <Select 
                  value={localFilters.grade || ""} 
                  onValueChange={(value) => handleFilterChange('grade', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select grade..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Grades</SelectItem>
                    {GRADES.map(grade => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Department Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Department</Label>
                <Select 
                  value={localFilters.department || ""} 
                  onValueChange={(value) => handleFilterChange('department', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {filterOptions?.departments?.map((dept: string) => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Multi-Select Departments */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Departments (Multi-Select)
                  {selectedDepartments.length > 0 && (
                    <span className="text-xs text-muted-foreground ml-2">
                      {selectedDepartments.length} selected
                    </span>
                  )}
                </Label>
                <div className="border rounded-md p-3 max-h-40 overflow-y-auto">
                  {filterOptions?.departments?.map((dept: string) => (
                    <div key={dept} className="flex items-center space-x-2 py-1">
                      <Checkbox
                        id={`dept-${dept}`}
                        checked={selectedDepartments.includes(dept)}
                        onCheckedChange={() => handleDepartmentToggle(dept)}
                      />
                      <label 
                        htmlFor={`dept-${dept}`} 
                        className="text-sm cursor-pointer flex-1"
                      >
                        {dept}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gender Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Gender</Label>
                <Select 
                  value={localFilters.gender || ""} 
                  onValueChange={(value) => handleFilterChange('gender', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select gender..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    {GENDERS.map(gender => (
                      <SelectItem key={gender} value={gender}>
                        {gender}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Blood Group Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Blood Group</Label>
                <Select 
                  value={localFilters.bloodGroup || ""} 
                  onValueChange={(value) => handleFilterChange('bloodGroup', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select blood group..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Blood Groups</SelectItem>
                    {BLOOD_GROUPS.map(group => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Location</Label>
                <Select 
                  value={localFilters.location || ""} 
                  onValueChange={(value) => handleFilterChange('location', value)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select location..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {filterOptions?.locations?.map((location: string) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </ScrollArea>

          <Separator />
          
          <div className="flex justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleClearFilters}
              className="flex items-center gap-2"
            >
              <X size={16} />
              Clear All
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsOpen(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={handleApplyFilters}
                className="flex items-center gap-2"
              >
                <CheckCircle size={16} />
                Apply Filters
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}