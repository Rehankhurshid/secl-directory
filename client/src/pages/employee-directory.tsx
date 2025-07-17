import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmployeeCard } from "@/components/employee-card";
import { EmployeeModal } from "@/components/employee-modal";
import { SearchFilters } from "@/components/search-filters";
import { ActiveFilters } from "@/components/active-filters";
import { PWAInstallPrompt } from "@/components/pwa-install-prompt";
import { PWAUpdatePrompt } from "@/components/pwa-update-prompt";
import { Pagination } from "@/components/pagination";
import { AppHeader } from "@/components/app-header";
import { FileUploadProfileImage } from "@/components/auth/file-upload-profile-image";
import { InfiniteEmployeeList } from "@/components/infinite-employee-list";
import { AdminEmployeeEditDrawer } from "@/components/admin/admin-employee-edit-drawer";
import { useEmployees, useEmployeeStats, useEmployeeExport } from "@/hooks/use-employees";
import { useAuth } from "@/hooks/use-auth";
import { usePWA } from "@/hooks/use-pwa";
import { useToast } from "@/hooks/use-toast";
import { useDeviceType } from "@/hooks/use-device-type";
import { Download, RefreshCw, Grid, WifiOff, Plus, Search } from "lucide-react";
import { OnboardingTutorial } from "@/components/onboarding-tutorial";
import { usePWAInstall } from "@/hooks/use-pwa-install";

import { cn } from "@/lib/utils";
import type { Employee, EmployeeSearch } from "@shared/schema";

export default function EmployeeDirectory() {
  const [filters, setFilters] = useState<EmployeeSearch>({
    page: 1,
    limit: 20,
    sortBy: "name",
  });
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProfileImageOpen, setIsProfileImageOpen] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [editEmployee, setEditEmployee] = useState<Employee | null>(null);
  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);


  const { data: employeeData, isLoading, refetch } = useEmployees(filters);
  const { data: stats } = useEmployeeStats();
  const { mutate: exportData, isPending: isExporting } = useEmployeeExport();
  const { employee } = useAuth();
  const { isOnline } = usePWA();
  const { toast } = useToast();
  const { setShowInstallDialog } = usePWAInstall();
  const { isMobile } = useDeviceType();
  const [isFloatingVisible, setIsFloatingVisible] = useState(true);

  const handleFiltersChange = (newFilters: EmployeeSearch) => {
    const updatedFilters = { ...newFilters, page: 1, limit: 20, sortBy: filters.sortBy };
    setFilters(updatedFilters);
    
    // Update floating button visibility (always visible for now)
    setIsFloatingVisible(true);
  };

  // Convert filters for infinite scroll (remove page and limit)
  const infiniteFilters = {
    search: filters.search,
    department: filters.department,
    location: filters.location,
    grade: filters.grade,
    category: filters.category,
    gender: filters.gender,
    bloodGroup: filters.bloodGroup,
    sortBy: filters.sortBy,
  };

  

  const handleViewDetails = (employee: Employee) => {
    setSelectedEmployee(employee);
    setIsModalOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditEmployee(employee);
    setIsEditDrawerOpen(true);
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleRefresh = () => {
    refetch();
    toast({
      title: "Data refreshed",
      description: "Employee data has been updated",
    });
  };

  const handleExport = () => {
    exportData();
    toast({
      title: "Export started",
      description: "Employee data is being exported",
    });
  };

  const handleProfileImageClick = () => {
    setIsProfileImageOpen(true);
  };

  const employees = employeeData?.employees || [];
  const totalEmployees = employeeData?.total || 0;
  const statsTotal = stats?.total || 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <AppHeader
        onRefresh={handleRefresh}
        isLoading={isLoading}
        onProfileImageClick={handleProfileImageClick}
        onShowTutorial={() => setShowOnboarding(true)}
        onShowInstallDialog={() => setShowInstallDialog(true)}
      />

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="space-y-6">
          {/* Search Bar - Only for large screens */}
          <div className="hidden lg:block">
            <div className="flex items-center space-x-4">
              <SearchFilters
                filters={filters}
                onFiltersChange={handleFiltersChange}
                totalEmployees={statsTotal}
                filteredCount={totalEmployees}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                disabled={isExporting}
                className="flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </Button>
            </div>
          </div>

          {/* Employee List */}
          <div>
            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <h2 className="text-xl font-semibold">Employees</h2>
                <Badge variant="outline">
                  {totalEmployees.toLocaleString()} results
                </Badge>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExport}
                  disabled={isExporting}
                  className="flex items-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Export</span>
                </Button>
              </div>
            </div>

            {/* Search Input */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search by name or employee ID..."
                  value={filters.search || ""}
                  onChange={(e) => handleFiltersChange({ ...filters, search: e.target.value })}
                  className="w-full pl-10 pr-4 py-2 border border-input bg-background rounded-md text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
            </div>

            {/* Active Filters */}
            <ActiveFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              className="mb-6"
            />

            {/* Employee List - Conditional Rendering */}
            {isMobile ? (
              /* Mobile: Use Lazy Loading with Infinite Scroll */
              <InfiniteEmployeeList
                filters={infiniteFilters}
                onViewDetails={handleViewDetails}
                onEditEmployee={handleEditEmployee}
                showEditButton={employee?.role === 'admin'}
              />
            ) : (
              /* Desktop: Use Pagination */
              <>
                {isLoading ? (
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
                ) : employees.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-muted-foreground">No employees found matching your criteria.</p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {employees.map((employee) => (
                        <EmployeeCard
                          key={employee.id}
                          employee={employee}
                          onViewDetails={handleViewDetails}
                          onEditEmployee={handleEditEmployee}
                          showEditButton={employee?.role === 'admin'}
                        />
                      ))}
                    </div>

                    {/* Pagination */}
                    {totalEmployees > (filters.limit || 20) && (
                      <div className="mt-8">
                        <Pagination
                          currentPage={filters.page || 1}
                          totalPages={Math.ceil(totalEmployees / (filters.limit || 20))}
                          onPageChange={handlePageChange}
                          totalResults={totalEmployees}
                          resultsPerPage={filters.limit || 20}
                        />
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Employee Modal */}
      <EmployeeModal
        employee={selectedEmployee}
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Profile Image Upload Dialog */}
      <Dialog open={isProfileImageOpen} onOpenChange={setIsProfileImageOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Update Profile Picture</DialogTitle>
          </DialogHeader>
          {employee && (
            <FileUploadProfileImage
              employee={employee}
              onClose={() => setIsProfileImageOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* PWA Install Prompt */}
      <PWAInstallPrompt />

      {/* PWA Update Prompt */}
      <PWAUpdatePrompt />

      {/* Admin Employee Edit Drawer */}
      <AdminEmployeeEditDrawer
        employee={editEmployee}
        isOpen={isEditDrawerOpen}
        onClose={() => {
          setIsEditDrawerOpen(false);
          setEditEmployee(null);
        }}
        mode="edit"
      />

      {/* Onboarding Tutorial */}
      <OnboardingTutorial
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      {/* Floating Action Buttons for Mobile */}
      <div className="fixed bottom-6 right-6 z-50 lg:hidden flex flex-col gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExport}
          disabled={isExporting}
          className={cn(
            "h-12 w-12 p-0 rounded-full shadow-lg bg-background border-2",
            isExporting && "bg-green-500 border-green-500 text-white"
          )}
        >
          <Download className={cn("w-5 h-5", isExporting && "animate-pulse")} />
        </Button>
        <SearchFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          totalEmployees={statsTotal}
          filteredCount={totalEmployees}
        />
      </div>

      {/* Filtered Count Display */}
      <div className="fixed bottom-6 left-6 z-50 lg:hidden">
        <div className="bg-background/80 backdrop-blur-sm border border-border/50 rounded-full px-3 py-1 shadow-lg">
          <span className="text-xs font-medium text-muted-foreground">
            {totalEmployees === statsTotal ? (
              `${statsTotal.toLocaleString()}`
            ) : (
              <>
                <span className="text-primary font-semibold">{totalEmployees.toLocaleString()}</span>
                <span className="text-muted-foreground/70"> of {statsTotal.toLocaleString()}</span>
              </>
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
