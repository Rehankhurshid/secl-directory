# PWA Notification Demo

## Overview

This is a Progressive Web App (PWA) demonstration project that showcases browser notification capabilities with button-triggered notifications using open source libraries. The application is built with a modern full-stack architecture using React with TypeScript on the frontend and Express.js on the backend, with PostgreSQL as the database layer. Successfully tested on both desktop and Android devices with proper cross-platform notification support.

## User Preferences

Preferred communication style: Simple, everyday language.

## Complete Implementation Guide

### Core Requirements
- Must use open source libraries for notifications
- PWA with service worker for reliable cross-platform notifications
- Works on both desktop and mobile (Android tested)
- Proper async/await handling prevents timing issues
- Error handling with success/failure feedback system

### Required Dependencies
```json
{
  "react-toastify": "^latest",
  "nanoid": "^latest",
  "@radix-ui/react-*": "^latest",
  "tailwindcss": "^latest"
}
```

### Implementation Steps

#### 1. PWA Manifest Setup (`client/public/manifest.json`)
```json
{
  "name": "PWA Notification Demo",
  "short_name": "PWA Demo",
  "description": "A Progressive Web App with button-triggered notifications",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#1976D2",
  "icons": [
    {
      "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODggNDg4Ij48cmVjdCB3aWR0aD0iNDg4IiBoZWlnaHQ9IjQ4OCIgZmlsbD0iIzE5NzZEMiIvPjx0ZXh0IHg9IjI0NCIgeT0iMjQ0IiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNzBweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+UE9TSUZZVEVNUE88L3RleHQ+PC9zdmc+",
      "sizes": "192x192",
      "type": "image/svg+xml"
    }
  ]
}
```

#### 2. Service Worker (`client/public/sw.js`)
```javascript
const CACHE_NAME = 'pwa-demo-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Critical: Notification handling with proper icon paths
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from PWA!',
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODggNDg4Ij48cmVjdCB3aWR0aD0iNDg4IiBoZWlnaHQ9IjQ4OCIgZmlsbD0iIzE5NzZEMiIvPjx0ZXh0IHg9IjI0NCIgeT0iMjQ0IiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNzBweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tk9USUZZVEVNUE88L3RleHQ+PC9zdmc+',
    badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODggNDg4Ij48cmVjdCB3aWR0aD0iNDg4IiBoZWlnaHQ9IjQ4OCIgZmlsbD0iIzE5NzZEMiIvPjx0ZXh0IHg9IjI0NCIgeT0iMjQ0IiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNzBweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tk9USUZZVEVNUE88L3RleHQ+PC9zdmc+',
    tag: 'pwa-demo',
    requireInteraction: false,
    silent: false,
    data: { dateOfArrival: Date.now(), primaryKey: 1, url: '/' }
  };

  event.waitUntil(
    self.registration.showNotification('PWA Notification', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
```

#### 3. HTML Integration (`client/index.html`)
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>PWA Notification Demo</title>
  <link rel="manifest" href="/manifest.json" />
  <meta name="theme-color" content="#1976D2" />
  <meta name="description" content="A Progressive Web App with button-triggered notifications" />
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
          .then((registration) => {
            console.log('Service Worker registered:', registration);
          })
          .catch((error) => {
            console.log('Service Worker registration failed:', error);
          });
      });
    }
  </script>
</body>
</html>
```

#### 4. Critical: Notification Hook (`client/src/hooks/use-notifications.tsx`)
```typescript
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

export const useNotifications = () => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) return 'denied';
    
    const result = await Notification.requestPermission();
    setPermission(result);
    
    return result;
  };

  // Critical: Async function with proper error handling
  const showNotification = async (title: string, options?: NotificationOptions): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notifications are not supported');
      return false;
    }

    if (permission !== 'granted') {
      toast.warning('Please enable notifications first');
      return false;
    }

    const defaultOptions: NotificationOptions = {
      body: options?.body || 'This is a notification from your PWA!',
      icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODggNDg4Ij48cmVjdCB3aWR0aD0iNDg4IiBoZWlnaHQ9IjQ4OCIgZmlsbD0iIzE5NzZEMiIvPjx0ZXh0IHg9IjI0NCIgeT0iMjQ0IiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNzBweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tk9USUZZVEVNUE88L3RleHQ+PC9zdmc+',
      badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODggNDg4Ij48cmVjdCB3aWR0aD0iNDg4IiBoZWlnaHQ9IjQ4OCIgZmlsbD0iIzE5NzZEMiIvPjx0ZXh0IHg9IjI0NCIgeT0iMjQ0IiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNzBweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tk9USUZZVEVNUE88L3RleHQ+PC9zdmc+',
      tag: 'pwa-demo',
      requireInteraction: false,
      silent: false,
      data: { url: window.location.href }
    };

    try {
      // Try service worker first (critical for Android)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.showNotification) {
          await registration.showNotification(title, { ...defaultOptions, ...options });
          return true;
        }
      }

      // Fallback to direct notification API
      const notification = new Notification(title, { ...defaultOptions, ...options });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };

      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    showNotification
  };
};
```

#### 5. Main App Component (`client/src/App.tsx`)
```typescript
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { Route, Switch } from 'wouter';
import Home from './pages/home';
import NotFound from './pages/not-found';

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Switch>
        <Route path="/" component={Home} />
        <Route component={NotFound} />
      </Switch>
      <ToastContainer position="top-right" />
    </div>
  );
}
```

#### 6. Home Page with Notification Buttons (`client/src/pages/home.tsx`)
```typescript
import { useState } from 'react';
import { useNotifications } from '../hooks/use-notifications';
import { toast } from 'react-toastify';
import { Button } from '@/components/ui/button';

export default function Home() {
  const { permission, requestPermission, showNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  // Critical: Proper async handling with success/failure feedback
  const handleMainNotification = async () => {
    setIsLoading(true);
    
    try {
      if (permission === 'granted') {
        const success = await showNotification('PWA Notification Demo', {
          body: 'This notification was triggered by clicking the button!',
          requireInteraction: true
        });
        if (success) {
          toast.success('Notification sent successfully!');
        } else {
          toast.error('Failed to send notification');
        }
      } else if (permission === 'default') {
        const result = await requestPermission();
        if (result === 'granted') {
          const success = await showNotification('PWA Notification Demo', {
            body: 'Welcome! Notifications are now enabled.',
            requireInteraction: true
          });
          if (success) {
            toast.success('Notification sent successfully!');
          }
        }
      } else {
        toast.error('Notifications are blocked. Please enable them in your browser settings.');
      }
    } catch (error) {
      toast.error('Error sending notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    if (permission === 'granted') {
      const success = await showNotification('Test Notification', {
        body: 'This is a test notification with custom options!',
        requireInteraction: false
      });
      if (success) {
        toast.success('Test notification sent!');
      } else {
        toast.error('Failed to send test notification');
      }
    } else {
      toast.warning('Please enable notifications first!');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-8">PWA Notification Demo</h1>
        
        <div className="space-y-6">
          <Button 
            onClick={handleMainNotification}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? 'Sending...' : 'Send Notification'}
          </Button>

          <Button 
            onClick={handleTestNotification}
            variant="outline"
            className="w-full"
          >
            Test Notification
          </Button>

          <Button 
            onClick={requestPermission}
            variant="secondary"
            className="w-full"
          >
            Request Permission
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Key Implementation Details

1. **Android Compatibility**: Must use service worker for notifications instead of direct API
2. **Async Handling**: All notification functions must be async with proper await
3. **Error Handling**: Functions return boolean for success/failure feedback
4. **Icon Paths**: Use SVG data URLs instead of file paths for cross-platform compatibility
5. **Toast Integration**: Use react-toastify for user feedback
6. **Permission Flow**: Handle all permission states (default, granted, denied)

### Testing Checklist

- [ ] Service worker registers successfully
- [ ] Notifications work on desktop
- [ ] Notifications work on Android
- [ ] Permission request works
- [ ] Success/failure feedback shows correctly
- [ ] No conflicting toast messages
- [ ] PWA installable on mobile devices

### Common Issues and Solutions

1. **Red error with notifications**: Ensure proper async/await handling
2. **No notifications on Android**: Must use service worker registration
3. **Conflicting toasts**: Return boolean from showNotification function
4. **Icon not showing**: Use SVG data URLs instead of file paths

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **UI Components**: Radix UI primitives with custom shadcn/ui styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Database**: PostgreSQL (configured for Neon Database)
- **Build Process**: ESBuild for production bundling

### PWA Features
- **Service Worker**: Custom service worker for offline caching and notification handling
- **Web App Manifest**: Configured for installable PWA experience
- **Notification API**: Browser notification system with permission handling
- **Offline Support**: Service worker caching strategy for core assets

## Key Components

### Frontend Components
- **Notification System**: Custom hooks for managing browser notifications (`useNotifications`)
- **PWA Installation**: Install prompt component with beforeinstallprompt event handling
- **Status Cards**: Real-time status display for PWA features, notifications, and offline capability
- **Toast Notifications**: React-toastify integration for in-app notifications
- **Responsive Design**: Mobile-first approach with adaptive layouts

### Backend Components
- **Storage Interface**: Abstracted storage layer with in-memory implementation
- **Route Registration**: Modular route system for API endpoints
- **Development Server**: Vite integration for hot module replacement
- **Error Handling**: Centralized error handling middleware

### Database Schema
- **Users Table**: Basic user model with username and password fields
- **Zod Validation**: Schema validation using drizzle-zod integration

## Data Flow

1. **Client-Server Communication**: REST API endpoints prefixed with `/api`
2. **Database Operations**: Drizzle ORM with PostgreSQL for persistent storage
3. **State Management**: TanStack Query for caching and synchronization
4. **Notification Flow**: Browser Notification API → Service Worker → User Interface
5. **PWA Installation**: beforeinstallprompt event → Install prompt → App installation

## External Dependencies

### Core Dependencies
- **Database**: Neon Database (PostgreSQL-compatible serverless database)
- **UI Library**: Radix UI for accessible component primitives
- **Styling**: Tailwind CSS for utility-first styling
- **Notifications**: React-toastify for toast notifications
- **Forms**: React Hook Form with Hookform Resolvers

### Development Dependencies
- **Build Tools**: Vite, ESBuild, TypeScript
- **Database Tools**: Drizzle Kit for migrations and schema management
- **Code Quality**: TypeScript strict mode, ESLint configuration

## Deployment Strategy

### Production Build
1. **Frontend**: Vite builds optimized static assets to `dist/public`
2. **Backend**: ESBuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` command

### Environment Configuration
- **Development**: Uses NODE_ENV=development with Vite dev server
- **Production**: NODE_ENV=production with static file serving
- **Database**: DATABASE_URL environment variable required

### PWA Deployment Considerations
- **HTTPS Required**: PWA features require secure context
- **Service Worker**: Must be served from same origin
- **Manifest**: Web app manifest must be accessible at `/manifest.json`
- **Icons**: PWA icons configured as inline SVG data URLs

### Replit-Specific Features
- **Cartographer Plugin**: Development environment integration
- **Runtime Error Overlay**: Enhanced error reporting in development
- **Banner Script**: Development mode identification banner