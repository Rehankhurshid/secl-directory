'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Users, MessageSquare, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/hooks/use-auth';

interface TabButtonProps {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onClick: () => void;
  badge?: string;
}

function TabButton({ icon, label, active, onClick, badge }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex flex-col items-center justify-center p-2 min-w-[60px] relative',
        'transition-colors duration-200',
        active 
          ? 'text-primary' 
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <div className="relative">
        {icon}
        {badge && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-4 w-4 p-0 text-[10px] flex items-center justify-center"
          >
            {badge}
          </Badge>
        )}
      </div>
      <span className="text-xs mt-1">{label}</span>
      {active && (
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary transition-all duration-300" />
      )}
    </button>
  );
}

interface BottomNavigationProps {
  className?: string;
}

export function BottomNavigation({ className }: BottomNavigationProps) {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuth();
  const employee = auth?.employee;

  // Only show on mobile
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // HIDDEN: Bottom navigation is temporarily hidden as requested
  // To restore: remove the 'hidden' class below
  if (!isMobile) return null;

  const isActive = (path: string) => pathname.startsWith(path);

  return (
    <nav className={cn(
      'fixed bottom-0 left-0 right-0 z-40 bg-background border-t',
      'pb-safe-bottom',
      'hidden', // Hide bottom navigation on mobile as requested
      className
    )}>
      <div className="flex items-center justify-around py-2">
        <TabButton
          icon={<Users className="w-5 h-5" />}
          label="Directory"
          active={isActive('/employee-directory')}
          onClick={() => router.push('/employee-directory')}
        />
        
        <TabButton
          icon={<MessageSquare className="w-5 h-5" />}
          label="Messages"
          active={isActive('/messaging')}
          onClick={() => router.push('/messaging')}
        />
        
        {employee?.role === 'admin' && (
          <TabButton
            icon={<Shield className="w-5 h-5" />}
            label="Admin"
            active={isActive('/admin')}
            onClick={() => router.push('/admin')}
            badge="A"
          />
        )}
      </div>
    </nav>
  );
}