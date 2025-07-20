# Navbar Implementation Guide - Employee Directory PWA

## 🎯 Navigation Architecture Overview

The Employee Directory PWA uses a **responsive, multi-layer navigation system** that adapts to different device types and user roles. The navigation consists of three main components:

1. **AppHeader** - Top navigation bar (desktop + mobile)
2. **Bottom Navigation** - Mobile-specific tab navigation
3. **Context-specific Navigation** - In-page navigation for complex features

## 🖥️ AppHeader Component (Primary Navigation)

### Component Structure
```typescript
// File: client/src/components/app-header.tsx
interface AppHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
  onInstall?: () => void;
  showInstallButton?: boolean;
  onProfileImageClick?: () => void;
  onShowTutorial?: () => void;
  onShowInstallDialog?: () => void;
}
```

### Layout Structure
```jsx
<header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
  {/* Offline Indicator */}
  {!isOnline && (
    <div className="bg-yellow-600 text-white px-4 py-2 text-center text-sm">
      <WifiOff className="w-4 h-4 inline mr-2" />
      You're offline - showing cached data
    </div>
  )}

  <div className="container mx-auto px-4 py-4">
    <div className="flex items-center justify-between">
      {/* Left Section: Brand & Primary Actions */}
      <div className="flex items-center space-x-4">
        {/* Brand Title */}
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Employee Directory</h1>
          <span className="text-xs text-muted-foreground">
            v{getCurrentVersion()}
          </span>
        </div>
        
        {/* Desktop-only Navigation */}
        {employee?.role === 'admin' && (
          <Button variant={isActive('/admin') ? 'default' : 'outline'} size="sm">
            <Shield className="w-4 h-4" />
            Admin Panel
          </Button>
        )}
        
        {isInstallable && (
          <Button variant="outline" size="sm" className="hidden md:flex">
            <Plus className="w-4 h-4" />
            Install App
          </Button>
        )}
      </div>

      {/* Right Section: Actions & User Menu */}
      <div className="flex items-center space-x-2">
        <ThemeToggle />
        <NavigationActions />
        <UserProfileMenu />
      </div>
    </div>
  </div>
</header>
```

## 🎨 Visual Design System

### Styling Classes
```css
/* Header Container */
.navbar-container {
  @apply sticky top-0 z-40 w-full border-b;
  @apply bg-background/95 backdrop-blur;
  @apply supports-[backdrop-filter]:bg-background/60;
}

/* Brand Section */
.navbar-brand {
  @apply flex flex-col;
}

.navbar-title {
  @apply text-2xl font-bold;
}

.navbar-version {
  @apply text-xs text-muted-foreground;
}

/* Action Buttons */
.navbar-action {
  @apply h-8 w-8 rounded-full;
  @apply flex items-center justify-center;
  @apply transition-colors hover:bg-accent;
}

.navbar-button {
  @apply flex items-center gap-2;
  @apply transition-all duration-200;
}
```

### Color System
```typescript
// Theme-aware color variants
const getNavVariants = () => ({
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
  ghost: "hover:bg-accent hover:text-accent-foreground",
  destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90"
});
```

## 📱 Responsive Behavior

### Desktop Layout (≥768px)
```jsx
{/* Desktop: Full navigation with text labels */}
<div className="hidden md:flex items-center space-x-4">
  <Button variant="outline" size="sm" className="flex items-center gap-2">
    <Shield className="w-4 h-4" />
    Admin Panel
  </Button>
  <Button variant="outline" size="sm" className="flex items-center gap-2">
    <Plus className="w-4 h-4" />
    Install App
  </Button>
</div>
```

### Mobile Layout (<768px)
```jsx
{/* Mobile: Icon-only navigation */}
<div className="md:hidden flex items-center space-x-2">
  <Button variant="outline" size="sm" title="Install App">
    <Plus className="w-4 h-4" />
  </Button>
  <Button variant="ghost" size="sm" title="Group Messaging">
    <MessageSquare className="w-4 h-4" />
  </Button>
</div>
```

## 🚀 Navigation Actions Component

### Implementation
```jsx
function NavigationActions() {
  const { employee } = useAuth();
  const [location, setLocation] = useLocation();
  const { isInstallable, installApp } = usePWA();

  return (
    <>
      {/* Install App Button */}
      {isInstallable && (
        <Button
          variant="outline"
          size="sm"
          onClick={installApp}
          className="md:hidden"
          title="Install App"
        >
          <Plus className="w-4 h-4" />
        </Button>
      )}
      
      {/* Messaging Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setLocation('/messaging')}
        title="Group Messaging"
      >
        <MessageSquare className="w-4 h-4" />
      </Button>
      
      {/* Admin Panel Button */}
      {employee?.role === 'admin' && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/admin')}
          title="Admin Panel"
          className="relative"
        >
          <Shield className="w-4 h-4" />
          <Badge variant="secondary" className="absolute -top-1 -right-1 h-4 w-4 p-0">
            A
          </Badge>
        </Button>
      )}
      
      {/* Refresh Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={onRefresh}
        disabled={isLoading}
        title="Refresh data"
      >
        <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
      </Button>
    </>
  );
}
```

## 👤 User Profile Menu

### Dropdown Implementation
```jsx
function UserProfileMenu() {
  const { employee } = useAuth();
  const logout = useLogout();
  const { hardRefresh } = usePWA();

  if (!employee) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={employee.profileImage || ""} alt={employee.name} />
            <AvatarFallback className="text-xs">
              {employee.name.split(" ").map(n => n[0]).join("").toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="end" forceMount>
        {/* User Info Header */}
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <div className="flex items-center gap-2">
              <p className="font-medium">{employee.name}</p>
              {employee.role === 'admin' && (
                <Badge variant="destructive" className="text-xs">Admin</Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {employee.employeeId} • {employee.designation}
            </p>
          </div>
        </div>
        
        <DropdownMenuSeparator />
        
        {/* Navigation Actions */}
        {employee.role === 'admin' && (
          <DropdownMenuItem onClick={() => setLocation('/admin')}>
            <Shield className="mr-2 h-4 w-4" />
            Admin Panel
          </DropdownMenuItem>
        )}
        
        {/* Profile Actions */}
        <DropdownMenuItem onClick={onProfileImageClick}>
          <Camera className="mr-2 h-4 w-4" />
          Update Picture
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onShowTutorial}>
          <HelpCircle className="mr-2 h-4 w-4" />
          Show Tutorial
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={onShowInstallDialog}>
          <Download className="mr-2 h-4 w-4" />
          Install App
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        {/* System Actions */}
        <DropdownMenuItem onClick={hardRefresh}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Hard Refresh
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={() => logout.mutate()} disabled={logout.isPending}>
          <LogOut className="mr-2 h-4 w-4" />
          {logout.isPending ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

## 📱 Bottom Navigation (Mobile)

### Component Structure
```jsx
// File: client/src/components/layout/bottom-navigation.tsx
function BottomNavigation() {
  const [location, setLocation] = useLocation();
  const { employee } = useAuth();
  const { isMobile } = useDeviceType();

  if (!isMobile) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t">
      <div className="flex items-center justify-around py-2">
        <TabButton
          icon={<Users className="w-5 h-5" />}
          label="Directory"
          active={location === '/directory'}
          onClick={() => setLocation('/directory')}
        />
        
        <TabButton
          icon={<MessageSquare className="w-5 h-5" />}
          label="Messages"
          active={location === '/messaging'}
          onClick={() => setLocation('/messaging')}
        />
        
        {employee?.role === 'admin' && (
          <TabButton
            icon={<Shield className="w-5 h-5" />}
            label="Admin"
            active={location === '/admin'}
            onClick={() => setLocation('/admin')}
            badge="A"
          />
        )}
      </div>
    </nav>
  );
}

function TabButton({ icon, label, active, onClick, badge }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center p-2 min-w-[60px] relative",
        "transition-colors duration-200",
        active 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <div className="relative">
        {icon}
        {badge && (
          <Badge 
            variant="secondary" 
            className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs"
          >
            {badge}
          </Badge>
        )}
      </div>
      <span className="text-xs mt-1">{label}</span>
    </button>
  );
}
```

## 🔧 State Management

### Navigation State Hook
```typescript
// File: client/src/hooks/use-navigation.ts
export function useNavigation() {
  const [location, setLocation] = useLocation();
  const { employee } = useAuth();
  const { isMobile } = useDeviceType();

  const isActive = (path: string) => location === path;
  
  const navigate = (path: string) => {
    setLocation(path);
  };

  const canAccess = (path: string) => {
    if (path.startsWith('/admin')) {
      return employee?.role === 'admin';
    }
    if (path.startsWith('/messaging')) {
      return !!employee; // Authenticated users only
    }
    return true;
  };

  return {
    location,
    navigate,
    isActive,
    canAccess,
    isMobile,
    employee
  };
}
```

### Theme Integration
```typescript
// File: client/src/components/theme-toggle.tsx
export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setTheme(theme === "light" ? "dark" : "light")}
      title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
    >
      <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
```

## 🛡️ Security & Role-Based Access

### Role-Based Navigation
```typescript
const getNavigationItems = (employee: Employee | null) => {
  const baseItems = [
    { path: '/directory', label: 'Directory', icon: Users },
    { path: '/messaging', label: 'Messages', icon: MessageSquare },
  ];

  if (employee?.role === 'admin') {
    baseItems.push({
      path: '/admin',
      label: 'Admin Panel',
      icon: Shield,
      badge: 'A'
    });
  }

  return baseItems;
};
```

### Access Control
```typescript
// Route protection middleware
const ProtectedRoute = ({ children, requiredRole }: { children: React.ReactNode, requiredRole?: string }) => {
  const { employee, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && employee?.role !== requiredRole) {
    return <div>Access Denied</div>;
  }

  return <>{children}</>;
};
```

## 🌐 PWA Integration

### Install Prompt Integration
```typescript
const { isInstallable, installApp, isInstalled } = usePWA();

// Show install button only when installable and not installed
{isInstallable && !isInstalled && (
  <Button variant="outline" size="sm" onClick={installApp}>
    <Plus className="w-4 h-4 mr-2" />
    Install App
  </Button>
)}
```

### Offline Status Indicator
```jsx
function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="bg-yellow-600 text-white px-4 py-2 text-center text-sm">
      <WifiOff className="w-4 h-4 inline mr-2" />
      You're offline - showing cached data
    </div>
  );
}
```

## 📊 Analytics & Version Tracking

### Version Display
```typescript
const getCurrentVersion = () => {
  return new Date().toLocaleString('en-US', { 
    month: '2-digit', 
    day: '2-digit', 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
};
```

### Navigation Analytics
```typescript
const trackNavigation = (from: string, to: string) => {
  // Track navigation events for analytics
  console.log(`Navigation: ${from} → ${to}`);
};
```

## 🎨 Animation & Transitions

### Smooth Transitions
```css
/* Navigation animations */
.nav-button {
  @apply transition-all duration-200 ease-in-out;
}

.nav-button:hover {
  @apply scale-105 shadow-md;
}

.nav-active {
  @apply bg-primary text-primary-foreground;
  @apply shadow-md;
}

/* Mobile tab animations */
.tab-indicator {
  @apply absolute bottom-0 left-0 right-0 h-0.5;
  @apply bg-primary transition-all duration-300;
}
```

### Loading States
```jsx
function LoadingNavButton({ isLoading, children, ...props }) {
  return (
    <Button {...props} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        children
      )}
    </Button>
  );
}
```

## 🔍 Search Integration

### Global Search in Header
```jsx
function GlobalSearch() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsSearchOpen(true)}
        title="Search employees"
      >
        <Search className="w-4 h-4" />
      </Button>
      
      {isSearchOpen && (
        <SearchDialog
          query={searchQuery}
          onQueryChange={setSearchQuery}
          onClose={() => setIsSearchOpen(false)}
        />
      )}
    </div>
  );
}
```

## 📱 Mobile-First Best Practices

### Touch Targets
```css
/* Ensure minimum 44px touch targets on mobile */
.mobile-touch-target {
  @apply min-h-[44px] min-w-[44px];
  @apply flex items-center justify-center;
}
```

### Safe Areas
```css
/* iOS safe area support */
.bottom-nav {
  @apply pb-safe-bottom;
  padding-bottom: max(env(safe-area-inset-bottom), 0.5rem);
}
```

## 🧪 Testing & Quality Assurance

### Component Testing
```typescript
// Test navigation functionality
describe('AppHeader', () => {
  it('should display admin button for admin users', () => {
    render(<AppHeader {...props} />, {
      wrapper: ({ children }) => (
        <AuthProvider value={{ employee: adminEmployee }}>
          {children}
        </AuthProvider>
      )
    });
    
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });
});
```

This comprehensive navbar implementation provides a robust, accessible, and responsive navigation system that adapts to different user roles, device types, and application states while maintaining consistency with the overall design system.