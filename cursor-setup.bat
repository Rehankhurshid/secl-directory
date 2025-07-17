@echo off
REM Employee Directory PWA - Cursor Setup Script for Windows

echo 🚀 Setting up Employee Directory PWA for Cursor IDE...

REM Check if Node.js is installed
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js (v18 or higher)
    pause
    exit /b 1
)

echo ✅ Node.js detected

REM Install dependencies
echo 📦 Installing dependencies...
call npm install

REM Check if .env file exists
if not exist ".env" (
    echo 📄 Creating .env file from template...
    copy .env.example .env
    echo ⚠️  Please update the .env file with your database credentials
)

echo ✅ Setup complete!
echo.
echo 🎯 Next steps:
echo 1. Update .env file with your database credentials
echo 2. Run 'npm run dev' to start development server
echo 3. Open http://localhost:5000 in your browser
echo.
echo 📚 For detailed setup instructions, see README-CURSOR.md
echo.
echo 🔧 Available commands:
echo   npm run dev      - Start development server (Unix/Mac)
echo   set NODE_ENV=development ^&^& tsx server/index.ts  - Start development server (Windows)
echo   npm run build    - Build for production
echo   npm run db:push  - Update database schema
echo   npm run db:studio - Open database studio

pause