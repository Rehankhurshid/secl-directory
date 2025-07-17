# Development Guide for Cursor IDE

## Setting Up the Development Environment

### 1. Prerequisites Installation

```bash
# Install Node.js (v18+)
# Download from https://nodejs.org/

# Install PostgreSQL
# Download from https://www.postgresql.org/download/

# Verify installations
node --version
npm --version
psql --version
```

### 2. Project Setup

```bash
# Clone/download the project
# Navigate to project directory
cd employee-directory-pwa

# Run setup script
# On Unix/Mac:
chmod +x cursor-setup.sh
./cursor-setup.sh

# On Windows:
cursor-setup.bat
```

### 3. Database Configuration

```sql
-- Create database
CREATE DATABASE employee_directory;

-- Create user (optional)
CREATE USER emp_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE employee_directory TO emp_user;
```

Update `.env` file:
```env
DATABASE_URL=postgresql://emp_user:your_password@localhost:5432/employee_directory
```

### 4. Development Workflow

```bash
# Start development server
npm run dev

# In separate terminal - watch for changes
npm run db:push  # Updates database schema

# Build for production
npm run build
```

## IDE Configuration

### Cursor IDE Settings

1. **Extensions to Install:**
   - TypeScript and JavaScript Language Features
   - ES7+ React/Redux/React-Native snippets
   - Tailwind CSS IntelliSense
   - PostCSS Language Support

2. **Workspace Settings (.vscode/settings.json):**
```json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)([^']*)(?:'|\"|`)"],
    ["className\\s*=\\s*[\"']([^\"']*)[\"']", "([^\"']+)"]
  ]
}
```

### Debugging Configuration

Create `.vscode/launch.json`:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Server",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/server/index.ts",
      "outFiles": ["${workspaceFolder}/dist/**/*.js"],
      "runtimeArgs": ["-r", "tsx/register"],
      "env": {
        "NODE_ENV": "development"
      }
    }
  ]
}
```

## Common Development Tasks

### Adding New Features

1. **Frontend Component:**
```bash
# Create component
touch client/src/components/new-feature.tsx

# Add to routing in App.tsx
# Import and use in pages
```

2. **Backend API Endpoint:**
```typescript
// Add to server/routes.ts
app.get('/api/new-endpoint', authMiddleware, async (req, res) => {
  // Implementation
});
```

3. **Database Schema Changes:**
```typescript
// Update shared/schema.ts
export const newTable = pgTable('new_table', {
  id: serial('id').primaryKey(),
  // ... other fields
});

// Run migration
npm run db:push
```

### Testing Real-time Features

1. **WebSocket Testing:**
```bash
# Open multiple browser tabs
# Test messaging between tabs
# Check browser console for WebSocket logs
```

2. **PWA Testing:**
```bash
# Test installation prompt
# Test offline functionality
# Test push notifications
```

## Troubleshooting

### Common Issues

1. **Port Already in Use:**
```bash
# Kill process using port 5000
lsof -ti:5000 | xargs kill -9  # Mac/Linux
netstat -ano | findstr :5000   # Windows
```

2. **Database Connection Error:**
```bash
# Check PostgreSQL status
sudo service postgresql status  # Linux
brew services list postgresql   # Mac

# Reset database
npm run db:push
```

3. **Module Resolution Issues:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install
```

### Performance Optimization

1. **Database Queries:**
```typescript
// Use indexes for frequently queried fields
// Implement pagination for large datasets
// Cache expensive queries
```

2. **Frontend Optimization:**
```typescript
// Use React.memo for expensive components
// Implement lazy loading for routes
// Optimize bundle size with code splitting
```

## Deployment

### Local Production Build

```bash
# Build application
npm run build

# Start production server
npm start
```

### Environment Variables

```env
NODE_ENV=production
DATABASE_URL=postgresql://...
FIREBASE_API_KEY=...
TWILIO_ACCOUNT_SID=...
```

### Health Checks

```bash
# Check application health
curl http://localhost:5000/health

# Check database connection
curl http://localhost:5000/api/employees/stats
```

## Code Style Guidelines

### TypeScript

```typescript
// Use proper types
interface User {
  id: number;
  name: string;
  email: string;
}

// Avoid any types
const processUser = (user: User): void => {
  // Implementation
};
```

### React Components

```typescript
// Use functional components with hooks
const Component: React.FC<Props> = ({ prop1, prop2 }) => {
  const [state, setState] = useState<StateType>(initialState);
  
  return <div>{/* JSX */}</div>;
};
```

### Database Operations

```typescript
// Use proper error handling
try {
  const result = await storage.getEmployees();
  return result;
} catch (error) {
  console.error('Database error:', error);
  throw new Error('Failed to fetch employees');
}
```

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use strong database passwords
   - Rotate API keys regularly

2. **Authentication:**
   - Implement proper session management
   - Use HTTPS in production
   - Validate all user inputs

3. **Database Security:**
   - Use parameterized queries
   - Implement proper access controls
   - Regular security updates

## Contributing

1. Follow existing code style
2. Add tests for new features
3. Update documentation
4. Test on multiple devices/browsers
5. Ensure proper error handling