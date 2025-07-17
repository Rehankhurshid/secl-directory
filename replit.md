# Employee Directory - SECL

## Overview

This is a Progressive Web Application (PWA) for an employee directory system built specifically for SECL (South Eastern Coalfields Limited). The application provides a modern, mobile-first interface for browsing, searching, and managing employee information with offline capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.
UI Components: Use bottom sheets (drawers) for filters and employee details instead of modals/sidebars.
Employee Card Layout: Display employee ID prominently at top, followed by name, then organized two-column layout with color-coded categories and grades.
Theme: Light/dark mode toggle with intuitive color coding throughout the interface.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing with protected routes
- **Authentication**: OTP-based login system with secure session management
- **PWA Features**: Service Worker for offline functionality, Web App Manifest for native app-like experience

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Neon serverless driver
- **ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: OTP verification via 2factor.in API with secure session tokens
- **Session Management**: PostgreSQL session storage with 7-day expiration
- **Build System**: Vite for frontend bundling, esbuild for backend bundling

### Data Storage
- **Primary Database**: PostgreSQL (configured for Neon serverless) - ACTIVE
- **ORM**: Drizzle ORM with Zod integration for schema validation
- **Migrations**: Drizzle Kit for database schema management
- **Batch Processing**: Implements 100-record batches for large CSV imports
- **Storage Layer**: DatabaseStorage class replaces MemStorage for persistent data

## Key Components

### Database Schema
The application uses a single `employees` table with comprehensive employee information including:
- Basic info (name, employee ID, designation, department)
- Contact details (email, phone numbers, addresses)
- Personal information (DOB, father's name, spouse name, blood group)
- Employment details (grade, discipline, location, unit)
- Banking information (account number, bank details)

### API Endpoints
- `GET /api/employees` - Paginated employee listing with filtering and search
- `GET /api/employees/:id` - Individual employee details
- `GET /api/employees/stats` - Dashboard statistics (departments, locations, grades)
- `POST /api/auth/login` - Initiate OTP-based login with employee ID
- `POST /api/auth/verify-otp` - Verify OTP code and create session
- `POST /api/auth/logout` - End authenticated session
- `GET /api/auth/me` - Get current authenticated user details
- `PATCH /api/auth/profile-image` - Update profile image (authenticated)

### PWA Features
- **Offline Support**: Service Worker caches API responses and static assets
- **Installable**: Web App Manifest enables "Add to Home Screen" functionality
- **Mobile Optimized**: Responsive design with touch-friendly interface
- **Push Notifications**: Full web-push implementation with VAPID authentication for cross-platform messaging notifications

### UI Components
- **Employee Cards**: Compact grid layout with icon-based information display and color-coded categories and grades
- **Search & Filters**: Advanced filtering by department, location, grade with live search using scrollable bottom drawer with icons
- **Employee Details**: Full employee information in scrollable bottom drawer with sticky action buttons and icon-based layout
- **Theme Toggle**: Light/dark mode switch with persistent settings
- **Install Prompt**: Custom PWA installation prompts
- **Scrollable Layout**: All bottom sheets implement proper scrolling with flex layout and sticky headers/footers
- **Color Coding**: Intuitive colors for categories (Executive: Purple, Non-Executive: Green, Officer: Orange) and grades (E-: Red, S-: Blue, A-: Yellow)
- **Icon System**: Consistent icon usage throughout cards and forms for better visual hierarchy and quick recognition
- **Floating Action Button**: Mobile-optimized filter button positioned at bottom right with notification indicator
- **QR Code Sharing**: Quick contact sharing via QR codes with vCard format for easy device importing

## Authentication System

### OTP-Based Login Process
1. **Employee ID Input**: User enters their employee ID on the login page
2. **Phone Number Lookup**: System finds registered phone number from employee database
3. **OTP Generation**: 6-digit code generated locally and sent via Twilio SMS API
4. **OTP Verification**: User enters code, system validates against stored hash in database
5. **Session Creation**: 7-day session token generated and stored in PostgreSQL
6. **Client Storage**: Session token stored in localStorage with expiration

### Security Features
- **Session Management**: Secure tokens with 7-day expiration
- **Phone Verification**: Only employees with registered phone numbers can access
- **OTP Expiration**: 5-minute window for OTP validation
- **Session Cleanup**: Automatic cleanup of expired sessions and OTP records
- **Route Protection**: Authentication middleware protects sensitive endpoints
- **Profile Updates**: Authenticated users can update their profile images

### Database Tables
- **auth_sessions**: Stores active user sessions with expiration times
- **otp_verifications**: Temporary storage for OTP codes during verification
- **employees**: Enhanced with profileImage field for authenticated users

## Data Flow

1. **Initial Load**: Application loads employee data from CSV file on server startup
2. **Authentication**: Users authenticate via OTP system before accessing directory
3. **Search/Filter**: Client sends filtered requests to `/api/employees` endpoint
4. **Caching**: TanStack Query caches responses with 5-minute stale time
5. **Offline**: Service Worker serves cached data when network is unavailable
6. **Real-time**: Manual refresh available for updated data

## External Dependencies

### Frontend Dependencies
- **UI Framework**: React, Radix UI primitives
- **Styling**: Tailwind CSS, class-variance-authority for component variants
- **Data Fetching**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation
- **Utilities**: date-fns, clsx for conditional styling

### Backend Dependencies
- **Database**: @neondatabase/serverless for PostgreSQL connection
- **ORM**: drizzle-orm with drizzle-zod for schema validation
- **Session**: connect-pg-simple for PostgreSQL session storage
- **Development**: tsx for TypeScript execution, nodemon for hot reloading

### Development Tools
- **Build**: Vite for frontend, esbuild for backend
- **Database**: Drizzle Kit for migrations and introspection
- **TypeScript**: Strict mode with path mapping for imports
- **Replit Integration**: Custom plugins for development environment

## Deployment Strategy

### Production Build
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles Express server to `dist/index.js`
3. **Assets**: Static files served from build directory
4. **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Database**: PostgreSQL connection via `DATABASE_URL` environment variable
- **Sessions**: Secure session configuration with PostgreSQL storage
- **PWA**: Service Worker registration in production mode
- **CORS**: Configured for cross-origin requests in development

### Development Workflow
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend
- **Database**: Local development with memory storage fallback
- **CSV Import**: Automatic employee data loading from attached CSV file
- **Replit**: Integrated development environment with custom tooling

The application is designed to be deployed on platforms like Replit, Vercel, or any Node.js hosting service with PostgreSQL database support.

## Recent Changes (July 17, 2025)
- **Pagination**: Added comprehensive pagination system for better performance with large datasets
- **Hard Refresh**: Implemented hard refresh functionality for PWA app updates and cache clearing
- **Enhanced PWA Install**: Improved install prompts with clear benefits, cross-platform support, and native-like experience
- **Automatic Updates**: Added seamless update detection and application with service worker improvements
- **Update Management**: Created dedicated update prompt component for better user experience
- **Service Worker**: Enhanced with skip waiting and immediate client claiming for faster updates
- **PWA Features**: Comprehensive offline support, update notifications, and installation guidance
- **Authentication System**: Implemented complete SMS OTP-based authentication system with 2factor.in R1 API integration using TRANS_SMS module
- **Profile Management**: Added profile image upload functionality for authenticated users
- **Session Management**: Secure 7-day session management with PostgreSQL storage
- **Protected Routes**: Implemented route protection with authentication middleware
- **Hard Refresh Feature**: Added hard refresh button to clear all caches, localStorage, and force reload - available in user dropdown menu and login page for debugging cached content issues
- **Native PWA Configuration**: Complete native app configuration with iOS/Android support, proper manifest, service worker with advanced caching, and platform-specific installation guidance
- **Group Messaging**: Real-time WebSocket messaging with group creation, member management, and searchable member lists
- **Mobile-First Design**: Enhanced mobile experience with touch-friendly interfaces, proper viewport handling, and native app behaviors
- **Enhanced Employee Modal**: Comprehensive employee details modal with proper categorization (Basic Info, Contact, Work, Personal, Banking, Address), copy-to-clipboard functionality for all fields, and organized card-based layout for better information accessibility
- **Onboarding Tutorial**: Interactive step-by-step tutorial system covering search/filters, employee details, group messaging, and PWA features
- **Fullscreen Group Chat**: Enhanced group messaging with dedicated fullscreen interface, back button navigation, sticky message input, auto-scrolling, and typing indicators for better mobile experience
- **Enhanced PWA Installation**: Platform-specific installation guidance for iOS, Android, and desktop with visual step-by-step instructions, native app benefits highlighting, and multiple installation entry points throughout the app
- **Native Notification System**: Implemented seamless native browser notifications based on NotificationBridge pattern for optimal Android compatibility:
  - Native service worker (native-sw.js) for notification handling with proper Android support
  - useNativeNotifications hook for unified notification management
  - In-app toast notifications combined with browser notifications for seamless experience
  - Service worker message handling for notification clicks and actions
  - Visibility detection to show notifications only when app is in background
  - Notification permission management with status indicator
  - Direct WebSocket integration for real-time message notifications
  - Cross-platform compatibility with enhanced Android notification support
  - Reply and view actions in notifications with proper navigation handling
- **Version Tracking System**: Added real-time version timestamps to both Employee Directory and Messaging pages showing deployment time (MM/DD HH:MM format) to track cache updates and ensure users see latest versions
- **Cache Management**: Implemented service worker cache versioning (v9 for main SW, v2 for native SW) to force cache refresh when updates are deployed
- **Test Notification Cleanup**: Removed test notification functionality from messaging dashboard per user request, maintaining only in login page where it functions properly
- **Force Cache Clear Utility**: Added `/clear-cache.html` page for aggressive cache clearing when standard refresh doesn't work, with complete service worker unregistration
- **Enhanced Cache Management**: Implemented force refresh button in messaging dashboard and upgraded service worker to v11 with CLEAR_ALL_CACHES message handling
- **Test Notification Complete Removal**: Found and removed test notification button from simple-messaging-dashboard.tsx - the persistent test button issue has been resolved
- **Bell Icon Import Fix**: Fixed ReferenceError by restoring Bell icon import needed for notification permission UI elements
- **Service Worker Refresh Loop Fix**: Temporarily disabled service worker to stop continuous refresh loop caused by aggressive update mechanism

