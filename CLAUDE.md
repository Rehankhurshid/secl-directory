# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Core Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server (http://localhost:3000)
npm run build        # Build for production
npm start            # Start production server
```

### Code Quality
```bash
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run test         # Run tests once
npm run test:watch   # Run tests in watch mode
npm run test:ui      # Run tests with UI interface
```

### Database Management
```bash
npm run db:generate  # Generate migrations from schema changes
npm run db:push      # Push schema changes to database
npm run db:migrate   # Run migrations
npm run db:studio    # Open Drizzle Studio GUI

# Data Import
npm run import:employees     # Import employee data from CSV
npm run deploy:prepare       # Generate and push schema
npm run deploy:full          # Full deployment with data import
```

## Architecture & Key Patterns

### Clean Architecture Layers

**STRICT RULE**: Never violate layer boundaries. Each layer can only depend on layers below it.

1. **Domain Layer** (`contexts/*/domain/`)
   - Pure business logic, NO React, NO external dependencies
   - Entities with validation and business rules
   - Repository interfaces (abstractions only)

2. **Application Layer** (`contexts/*/application/`, `lib/services/`)
   - Custom hooks for UI orchestration
   - Service classes for business operations
   - Use Server Actions for mutations (when implemented)

3. **Infrastructure Layer** (`contexts/*/infrastructure/`, `lib/db/`)
   - React components (Client Components)
   - Database implementations
   - External service integrations

4. **Presentation Layer** (`app/`)
   - Next.js App Router pages
   - Server Components by default
   - Client Components only when necessary

### Server vs Client Components

**Default to Server Components**. Only use Client Components for:
- Interactive state (useState, useReducer)
- Browser APIs (geolocation, localStorage)
- Event handlers (onClick, onChange)
- Third-party client libraries

Mark Client Components with `'use client'` directive at the top of the file.

### Database Configuration

- **Current**: PostgreSQL with Drizzle ORM
- **Connection**: Configured for Supabase (SSL required)
- **Schema**: Defined in `src/lib/database/schema.ts`
- **Migrations**: Generated to `src/lib/database/migrations/`
- **Best Practices**:
  - Use branded types for all IDs
  - Add indexes for foreign keys and frequently queried columns
  - Use Server Actions for all database operations
  - Implement soft deletes with `is_active` flags
  - Add audit logging for sensitive data changes
  - Enable Row Level Security (RLS) on all tables

### Security Requirements

1. **Input Validation**: Zod schemas for ALL user inputs
2. **Sanitization**: DOMPurify for any HTML content
3. **Authentication**: Session-based (to be implemented)
4. **Authorization**: Row Level Security (RLS) for all tables
5. **CSRF Protection**: Use Server Actions with built-in CSRF protection
6. **Rate Limiting**: Implement on all public endpoints
7. **Sensitive Data**: Never log or expose in errors
8. **Environment Variables**: Use `.env.local` for secrets
9. **Error Handling**: Generic messages to users, detailed logs server-side

### Coding Standards

1. **TypeScript**: 
   - Strict mode, no `any` types
   - Use branded types for IDs (e.g., `EmployeeId`, `DepartmentId`)
   - Comprehensive interfaces for all data structures
   - Result types for error handling (e.g., `Result<T, E>`)
2. **Naming**: 
   - lowercase-dash for directories
   - PascalCase for components
   - camelCase for utilities and variables
   - UPPER_SNAKE_CASE for constants
3. **Exports**: Prefer named exports over default exports
4. **Styling**: 
   - Tailwind utilities only, no custom CSS
   - Mobile-first responsive design
   - Follow shadcn/ui theming patterns
5. **Components**: 
   - Use shadcn/ui components from `components/ui/`
   - Apply accessibility patterns (ARIA labels, keyboard navigation)
   - Use Radix UI primitives for complex interactions

### Testing Strategy

- **Framework**: Vitest with React Testing Library
- **Philosophy**: Test behavior, not implementation details
- **Location**: Place tests next to components (`*.test.tsx`)
- **Mocking**: 
  - Mock external services and database calls
  - Use MSW (Mock Service Worker) for API mocking
  - Mock at the infrastructure layer, not domain
- **Coverage**: 
  - 90% coverage for business logic
  - Focus on critical user paths
  - Integration tests for key workflows
- **Best Practices**:
  - Use `userEvent` over `fireEvent`
  - Test accessibility with `screen.getByRole`
  - Avoid testing implementation details

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── employee-directory/ # Feature routes
│   └── messaging/         # Feature routes
├── components/
│   ├── ui/               # shadcn/ui components
│   └── shared/           # Shared components
├── contexts/             # Clean Architecture modules
│   └── [feature]/
│       ├── domain/       # Business logic
│       ├── application/  # Orchestration
│       └── infrastructure/ # External concerns
├── lib/
│   ├── database/         # Schema and migrations
│   ├── db/              # Database connection
│   ├── services/        # Application services
│   └── utils.ts         # Utilities
└── types/               # Global TypeScript types
```

## Key Features & Implementation Status

### Implemented
- Employee Directory with search and filtering
- Clean architecture foundation
- Database schema and import scripts
- Responsive UI with shadcn/ui
- Type-safe database queries with Drizzle

### Planned (Not Yet Implemented)
- Real-time messaging system
- Authentication & authorization
- PWA features (offline, push notifications)
- Server Actions for mutations
- WebSocket integration

## Environment Setup

Required environment variables in `.env.local`:
```bash
DATABASE_URL="postgresql://..."  # Supabase connection string
# Future additions:
NEXT_PUBLIC_SUPABASE_URL="..."
NEXT_PUBLIC_SUPABASE_ANON_KEY="..."
```

## Performance Best Practices

1. **Component Optimization**:
   - Minimize Client Components (Server Components by default)
   - Use dynamic imports for heavy components
   - Implement virtual scrolling for large lists
   - Add Suspense boundaries with loading states

2. **Data Fetching**:
   - Parallel data fetching where possible
   - Implement proper caching strategies
   - Use streaming for large datasets
   - Optimize database queries with proper indexes

3. **Asset Optimization**:
   - Use Next.js Image component for all images
   - Implement lazy loading for below-fold content
   - Optimize bundle size with tree shaking
   - Monitor Core Web Vitals

## Error Handling Patterns

1. **Result Types**: Use `Result<T, E>` pattern for operations that can fail
2. **Error Boundaries**: Implement error boundaries for graceful UI failures
3. **Logging**: Detailed server-side logs, generic client messages
4. **Validation**: Fail fast with Zod schemas at entry points
5. **Recovery**: Provide retry mechanisms for transient failures

## Important Notes

1. **Database**: Currently configured for PostgreSQL (Supabase-ready)
2. **Import Data**: Use `npm run import:employees` with CSV in `instructions/`
3. **MCP Servers**: Configured in `.mcp.json` for Supabase, Shadcn, and Webflow
4. **Node Version**: Requires Node.js 18.17.0+
5. **Cursor Rules**: Follow patterns in `.cursor/rules/` for consistency
6. **Templates**: Use templates in `.cursor/templates/` for new files
7. **UI Design**: Follow specs in `instructions/LISTING-PAGE-UI-DESIGN.md`