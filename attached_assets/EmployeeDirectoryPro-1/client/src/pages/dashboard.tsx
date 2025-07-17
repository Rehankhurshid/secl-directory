import { useState } from "react";
import { Navigation } from "@/components/layout/navigation";
import { BottomNavigation } from "@/components/layout/bottom-navigation";
import { EmployeeGrid } from "@/components/directory/employee-grid";
import { FilterDrawer } from "@/components/directory/filter-drawer";
import { EmployeeDetailDrawer } from "@/components/directory/employee-detail-drawer";
import { GroupsList } from "@/components/messaging/groups-list";
import { MessageView } from "@/components/messaging/message-view";
import { AdminPanel } from "@/components/admin/admin-panel";
import { useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { AddressBook, ChatCircle, GearSix } from "@phosphor-icons/react";

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "groups" | "admin">("directory");
  const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isEmployeeDetailOpen, setIsEmployeeDetailOpen] = useState(false);
  const { user } = useAuth();
  const isMobile = useIsMobile();

  // console.log("Dashboard rendered with user:", user);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FilterDrawer 
          onSearchChange={setSearchQuery}
          onFiltersChange={setFilters}
          searchQuery={searchQuery}
          currentFilters={filters}
        />
        
        {/* Tab Navigation */}
        <div className="border-b border-border mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab("directory")}
              className={`py-2 px-1 border-b-2 font-medium flex items-center gap-2 ${
                activeTab === "directory"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <AddressBook size={20} />
              Directory
            </button>
            <button
              onClick={() => setActiveTab("groups")}
              className={`py-2 px-1 border-b-2 font-medium flex items-center gap-2 ${
                activeTab === "groups"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <ChatCircle size={20} />
              Groups
            </button>
            {user?.role === "admin" && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`py-2 px-1 border-b-2 font-medium flex items-center gap-2 ${
                  activeTab === "admin"
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <GearSix size={20} />
                Admin
              </button>
            )}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-6">
          {activeTab === "directory" && (
            <EmployeeGrid 
              searchQuery={searchQuery} 
              filters={filters} 
              onEmployeeClick={(employee) => {
                setSelectedEmployee(employee);
                setIsEmployeeDetailOpen(true);
              }}
            />
          )}
          
          {activeTab === "groups" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GroupsList
                selectedGroupId={selectedGroupId}
                onSelectGroup={setSelectedGroupId}
              />
              {selectedGroupId && (
                <MessageView
                  groupId={selectedGroupId}
                  onClose={() => setSelectedGroupId(null)}
                />
              )}
            </div>
          )}
          
          {activeTab === "admin" && user?.role === "admin" && <AdminPanel />}
        </div>
        
        {/* Employee Detail Drawer */}
        <EmployeeDetailDrawer
          employee={selectedEmployee}
          isOpen={isEmployeeDetailOpen}
          onClose={() => {
            setIsEmployeeDetailOpen(false);
            setSelectedEmployee(null);
          }}
        />
      </div>

      {isMobile && <BottomNavigation activeTab={activeTab} onTabChange={setActiveTab} />}
    </div>
  );
}
