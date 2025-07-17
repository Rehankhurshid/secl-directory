# Employee Directory PWA - Cursor IDE Setup Guide

This is a comprehensive Employee Directory Progressive Web Application with real-time messaging, built with React, Node.js, and PostgreSQL.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **PostgreSQL** database
3. **npm** or **yarn** package manager

## Quick Setup for Cursor

### 1. Install Dependencies

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in the root directory with the following variables:

```env
# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/employee_directory

# Optional: Firebase Configuration (for push notifications)
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_APP_ID=your_firebase_app_id
FIREBASE_CLIENT_EMAIL=your_firebase_client_email
FIREBASE_PRIVATE_KEY=your_firebase_private_key
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_SENDER_ID=your_firebase_sender_id
FIREBASE_VAPID_KEY=your_firebase_vapid_key

# Optional: Twilio Configuration (for SMS OTP)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 3. Database Setup

```bash
# Push the database schema
npm run db:push

# Optional: Open database studio
npm run db:studio
```

### 4. Development Scripts

```bash
# Development (Unix/Mac)
npm run dev

# Development (Windows)
npm run dev:win

# Build for production
npm run build

# Start production server (Unix/Mac)
npm start

# Start production server (Windows)
npm run start:win
```

### 5. Access the Application

- **Local Development**: http://localhost:5000
- **PWA Features**: Install the app from your browser's install prompt

## Key Features

### 🔐 Authentication System
- SMS OTP-based login
- Secure session management
- Role-based permissions

### 👥 Employee Directory
- Advanced search and filtering
- Department and location-based organization
- Profile management with image uploads

### 💬 Real-time Messaging
- Group messaging with WebSocket connections
- Native push notifications
- Offline support with service workers

### 📱 Progressive Web App
- Installable on mobile and desktop
- Offline functionality
- Native-like experience

### 🎨 Modern UI/UX
- Light/dark theme toggle
- Responsive design
- Bottom sheets for mobile-first experience

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utility functions
│   │   └── pages/         # Application pages
├── server/                # Node.js backend
│   ├── routes.ts          # API routes
│   ├── storage.ts         # Database layer
│   └── services/          # Business logic
├── shared/                # Shared types and schemas
└── public/                # Static assets
```

## Database Schema

The application uses a PostgreSQL database with the following main tables:

- **employees**: Core employee information
- **auth_sessions**: User session management
- **groups**: Messaging groups
- **group_members**: Group membership
- **messages**: Chat messages
- **user_roles**: Role-based permissions

## Configuration for Different Environments

### Local Development
- Uses SQLite for quick setup (fallback)
- Hot reload enabled
- Development logging

### Production
- PostgreSQL database required
- Environment variables for secrets
- Optimized builds with esbuild

## Troubleshooting

### Database Connection Issues
1. Ensure PostgreSQL is running
2. Check DATABASE_URL format
3. Verify database permissions

### Port Conflicts
- Default port is 5000
- Change in `server/index.ts` if needed

### Missing Dependencies
```bash
npm install --save-dev @types/node @types/express
```

### Build Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Initiate OTP login
- `POST /api/auth/verify-otp` - Verify OTP code
- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user

### Employees
- `GET /api/employees` - List employees (with filters)
- `GET /api/employees/:id` - Get employee details
- `GET /api/employees/stats` - Get statistics

### Messaging
- `GET /api/groups` - List user's groups
- `GET /api/groups/:id/messages` - Get group messages
- `POST /api/messages` - Send message
- WebSocket `/ws` - Real-time messaging

## Development Tips

1. **Hot Reload**: The development server supports hot reload for both frontend and backend
2. **Database Migrations**: Use `npm run db:push` to update schema
3. **Debugging**: Check browser console and server logs for errors
4. **Testing**: Use different browser tabs to test real-time features

## Security Considerations

- Session tokens are stored securely
- OTP codes have 5-minute expiration
- Database queries use parameterized statements
- CORS is properly configured

## Contributing

1. Ensure all tests pass
2. Follow the existing code style
3. Update documentation for new features
4. Test on multiple browsers/devices

## License

MIT License - See LICENSE file for details