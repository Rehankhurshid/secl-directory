# Employee Directory PWA - System Architecture

## Overview

This is a Progressive Web App (PWA) for employee directory management built with a modern full-stack architecture. The application provides a mobile-first employee directory experience with real-time messaging, OTP-based authentication, and comprehensive employee management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.
Design preferences: Phosphor Icons and Geist Font for modern aesthetics.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation
- **PWA Features**: Service Worker, Web App Manifest, offline capabilities

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon serverless PostgreSQL
- **Real-time**: WebSocket integration for live messaging
- **File Uploads**: Multer for profile image handling
- **Session Management**: Token-based authentication with 7-day expiration

### Database Schema
- **employees**: Core employee data with profile information, roles, and metadata
- **sessions**: User session management with token-based authentication
- **otpCodes**: OTP verification codes with expiration and usage tracking
- **notificationGroups**: Group messaging and notifications
- **messages**: Real-time messaging system

## Key Components

### Authentication System
- **OTP-based Authentication**: SMS-based two-factor authentication using employee ID
- **Session Management**: JWT-like token system with 7-day expiration
- **Role-based Access**: Employee and admin roles with different permissions
- **Auto-logout**: Automatic session timeout for security

### Employee Directory
- **Search & Filtering**: Advanced search with department, location, and role filters
- **Grid View**: Card-based employee display with profile images
- **Detail Modal**: Comprehensive employee information popup
- **Export Functionality**: CSV export capabilities for admin users

### Real-time Messaging
- **WebSocket Integration**: Live messaging using native WebSocket
- **Group Management**: Create and manage notification groups
- **Message History**: Persistent message storage and retrieval
- **Online Presence**: Real-time user status indicators

### PWA Features
- **Service Worker**: Offline functionality and caching
- **Install Prompt**: Native app-like installation experience
- **Offline Indicator**: Visual feedback for connectivity status
- **Responsive Design**: Mobile-first with desktop support

## Data Flow

1. **Authentication Flow**:
   - User enters employee ID
   - System generates and sends OTP
   - User verifies OTP
   - Server creates session token
   - Client stores token for API requests

2. **Employee Data Flow**:
   - Client requests employee data with filters/search
   - Server queries database with pagination
   - Response includes employee list and metadata
   - Client displays in grid with infinite scroll

3. **Real-time Messaging Flow**:
   - Client establishes WebSocket connection
   - Authentication over WebSocket
   - Message broadcasting to group members
   - Message persistence in database

## External Dependencies

### Database
- **Neon**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database operations
- **Connection Pooling**: Efficient database connection management

### UI/UX Libraries
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Phosphor Icons**: Modern icon library replacing Font Awesome
- **Geist Font**: Google Fonts typography for modern design

### Development Tools
- **Vite**: Fast build tool with HMR
- **TypeScript**: Type safety and developer experience
- **ESLint/Prettier**: Code formatting and linting
- **Drizzle Kit**: Database migration tools

## Deployment Strategy

### Development Environment
- **Local Development**: Vite dev server with Express backend
- **Hot Module Replacement**: Real-time code updates
- **Environment Variables**: Database connection and configuration
- **TypeScript Compilation**: Real-time type checking

### Production Build
- **Frontend**: Vite build with optimized bundles
- **Backend**: ESBuild compilation to single JavaScript file
- **Static Assets**: Served from dist/public directory
- **Database Migrations**: Drizzle push for schema updates

### Architecture Decisions

1. **PWA Choice**: Enables offline functionality and native app experience while maintaining web accessibility
2. **Drizzle ORM**: Provides type safety and excellent TypeScript integration over alternatives like Prisma
3. **OTP Authentication**: Enhances security without complex password management
4. **WebSocket for Real-time**: Direct WebSocket implementation for lower latency than Socket.IO
5. **Vite Build System**: Faster development experience compared to Webpack-based solutions
6. **Monorepo Structure**: Shared types and schemas between client and server for consistency

The architecture prioritizes security, performance, and user experience while maintaining developer productivity through modern tooling and type safety.

## Recent Changes

### July 15, 2025
- **Icon Library Migration**: Replaced Font Awesome with Phosphor Icons throughout the application
  - Updated all components to use Phosphor Icons (@phosphor-icons/react)
  - Improved visual consistency and modern design aesthetics
  - Icons now properly sized and styled for better UX
- **Typography Enhancement**: Integrated Geist Font as the primary typeface
  - Replaced Inter with Geist font for modern, clean typography
  - Updated font configuration in HTML, CSS, and Tailwind config
  - Enhanced readability and visual hierarchy
- **UI Component Updates**: Updated all major components with new icons
  - Navigation, search, employee cards, buttons, and forms
  - Maintained consistent icon sizing and spacing
  - Improved visual feedback and interaction states
- **Bottom Sheet Implementation**: Implemented modern bottom sheet drawers for mobile-first UX
  - Created FilterDrawer component using Vaul for advanced filtering
  - Built EmployeeDetailDrawer for comprehensive employee information display
  - Replaced traditional modals with mobile-friendly bottom sheets
  - Added floating filter button with active filter count badge
  - Enhanced user experience with slide-up interactions
- **Theme Update**: Switched to Slate Dark shadcn theme
  - Updated CSS variables to use slate color scheme
  - Applied dark theme globally for better visual consistency
  - Maintained accessibility and contrast standards