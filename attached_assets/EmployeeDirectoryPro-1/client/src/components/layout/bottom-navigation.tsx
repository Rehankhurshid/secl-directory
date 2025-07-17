import { Button } from "@/components/ui/button";
import { AddressBook, ChatCircle, GearSix } from "@phosphor-icons/react";

interface BottomNavigationProps {
  activeTab: string;
  onTabChange: (tab: "directory" | "groups" | "admin") => void;
}

export function BottomNavigation({ activeTab, onTabChange }: BottomNavigationProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border md:hidden">
      <div className="grid grid-cols-3 h-16">
        <Button
          variant="ghost"
          className={`flex flex-col items-center justify-center space-y-1 ${
            activeTab === "directory" ? "text-primary" : "text-muted-foreground"
          }`}
          onClick={() => onTabChange("directory")}
        >
          <AddressBook size={20} />
          <span className="text-xs">Directory</span>
        </Button>
        
        <Button
          variant="ghost"
          className={`flex flex-col items-center justify-center space-y-1 ${
            activeTab === "groups" ? "text-primary" : "text-muted-foreground"
          }`}
          onClick={() => onTabChange("groups")}
        >
          <ChatCircle size={20} />
          <span className="text-xs">Groups</span>
        </Button>
        
        <Button
          variant="ghost"
          className={`flex flex-col items-center justify-center space-y-1 ${
            activeTab === "admin" ? "text-primary" : "text-muted-foreground"
          }`}
          onClick={() => onTabChange("admin")}
        >
          <GearSix size={20} />
          <span className="text-xs">Admin</span>
        </Button>
      </div>
    </nav>
  );
}
