import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, MessageCircle, Settings, X, ChevronUp, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useLocation } from 'wouter';

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  priority: number;
  condition?: () => boolean;
}

interface FloatingActionButtonProps {
  onSearchClick?: () => void;
  onFilterClick?: () => void;
  onExportClick?: () => void;
  onGroupsClick?: () => void;
  onSettingsClick?: () => void;
  className?: string;
  hasActiveFilters?: boolean;
  unreadCount?: number;
  isExporting?: boolean;
}

export function FloatingActionButton({
  onSearchClick,
  onFilterClick,
  onExportClick,
  onGroupsClick,
  onSettingsClick,
  className,
  hasActiveFilters = false,
  unreadCount = 0,
  isExporting = false
}: FloatingActionButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [location] = useLocation();

  // Handle scroll behavior for FAB visibility
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      const isScrollingDown = currentScrollY > scrollY;
      
      // Hide FAB when scrolling down, show when scrolling up
      setIsVisible(!isScrollingDown || currentScrollY < 100);
      setScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrollY]);

  // Close FAB when route changes
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Define context-aware actions based on current page and state
  const getContextualActions = (): FABAction[] => {
    const actions: FABAction[] = [];

    // Search action - always available on directory page
    if (location === '/' && onSearchClick) {
      actions.push({
        id: 'search',
        label: 'Search Employees',
        icon: <Search className="w-4 h-4" />,
        onClick: () => {
          onSearchClick();
          setIsOpen(false);
        },
        priority: 1
      });
    }

    // Filter action - available on directory page
    if (location === '/' && onFilterClick) {
      actions.push({
        id: 'filter',
        label: hasActiveFilters ? 'Active Filters' : 'Filter Employees',
        icon: <Filter className={cn("w-4 h-4", hasActiveFilters && "text-orange-500")} />,
        onClick: () => {
          onFilterClick();
          setIsOpen(false);
        },
        priority: 2
      });
    }

    // Export action - available on directory page
    if (location === '/' && onExportClick) {
      actions.push({
        id: 'export',
        label: isExporting ? 'Exporting...' : 'Export Data',
        icon: <Download className={cn("w-4 h-4", isExporting && "animate-pulse")} />,
        onClick: () => {
          onExportClick();
          setIsOpen(false);
        },
        priority: 3
      });
    }

    // Groups/Messages action - available everywhere
    if (onGroupsClick) {
      actions.push({
        id: 'groups',
        label: unreadCount > 0 ? `Messages (${unreadCount})` : 'Group Messages',
        icon: (
          <div className="relative">
            <MessageCircle className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        ),
        onClick: () => {
          onGroupsClick();
          setIsOpen(false);
        },
        priority: 4
      });
    }

    // Settings action - available everywhere
    if (onSettingsClick) {
      actions.push({
        id: 'settings',
        label: 'Settings',
        icon: <Settings className="w-4 h-4" />,
        onClick: () => {
          onSettingsClick();
          setIsOpen(false);
        },
        priority: 5
      });
    }

    return actions.sort((a, b) => a.priority - b.priority);
  };

  const actions = getContextualActions();

  // Don't render if no actions are available
  if (actions.length === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 transition-all duration-300",
        !isVisible && "translate-y-24 opacity-0",
        className
      )}
    >
      {/* Action buttons */}
      <div className={cn(
        "flex flex-col items-end gap-2 transition-all duration-300 ease-in-out",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {actions.map((action, index) => (
          <div
            key={action.id}
            className={cn(
              "transform transition-all duration-300 ease-in-out",
              isOpen ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            )}
            style={{
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms'
            }}
          >
            <Button
              variant="default"
              size="sm"
              onClick={action.onClick}
              className={cn(
                "flex items-center gap-2 shadow-lg hover:shadow-xl transition-all duration-200",
                "bg-primary text-primary-foreground hover:bg-primary/90",
                "backdrop-blur-sm border border-border/50",
                action.id === 'filter' && hasActiveFilters && "bg-orange-500 hover:bg-orange-600",
                action.id === 'groups' && unreadCount > 0 && "bg-blue-500 hover:bg-blue-600",
                action.id === 'export' && isExporting && "bg-green-500 hover:bg-green-600"
              )}
            >
              {action.icon}
              <span className="text-sm font-medium">{action.label}</span>
            </Button>
          </div>
        ))}
      </div>

      {/* Main FAB button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-14 h-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
          "bg-primary text-primary-foreground hover:bg-primary/90",
          "backdrop-blur-sm border border-border/50",
          "flex items-center justify-center",
          isOpen && "rotate-45"
        )}
      >
        {isOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        
        {/* Notification indicators */}
        {!isOpen && (
          <>
            {hasActiveFilters && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></span>
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-1 -left-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </>
        )}
      </Button>
    </div>
  );
}

// Hook for managing FAB state
export function useFAB() {
  const [fabState, setFabState] = useState({
    hasActiveFilters: false,
    unreadCount: 0,
    isSearchOpen: false,
    isFilterOpen: false
  });

  const updateFabState = (updates: Partial<typeof fabState>) => {
    setFabState(prev => ({ ...prev, ...updates }));
  };

  return {
    fabState,
    updateFabState
  };
}