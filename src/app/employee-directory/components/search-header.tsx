'use client';

import React from 'react';
import { Users, Search as SearchIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchHeaderProps {
  isMobile?: boolean;
  className?: string;
  totalEmployees?: number;
  filteredCount?: number;
}

export const SearchHeader = React.memo(function SearchHeader({ 
  isMobile = false,
  className,
  totalEmployees = 0,
  filteredCount = 0
}: SearchHeaderProps) {

  if (isMobile) {
    return (
      <div className={cn(
        "container mx-auto px-4 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className
      )}>
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Employee Directory</span>
            </div>
            
            {filteredCount !== totalEmployees && (
              <div className="text-xs">
                {filteredCount.toLocaleString()} of {totalEmployees.toLocaleString()}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40",
      className
    )}>
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-center gap-3">
          <Users className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Employee Directory</h1>
        </div>
      </div>
    </div>
  );
});