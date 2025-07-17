#!/bin/bash

# Employee Directory PWA - Cursor Setup Script

echo "🚀 Setting up Employee Directory PWA for Cursor IDE..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js (v18 or higher)"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'.' -f1 | cut -d'v' -f2)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please update the .env file with your database credentials"
fi

# Check if PostgreSQL is available
if command -v psql &> /dev/null; then
    echo "✅ PostgreSQL detected"
    
    # Ask if user wants to create database
    read -p "🗄️  Do you want to create the database schema? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🔄 Setting up database schema..."
        npm run db:push
        echo "✅ Database schema created successfully"
    fi
else
    echo "⚠️  PostgreSQL not found. Please install PostgreSQL or update DATABASE_URL in .env"
fi

# Create development scripts for different platforms
echo "📝 Creating platform-specific scripts..."

# Windows batch file
cat > run-dev.bat << 'EOF'
@echo off
set NODE_ENV=development
tsx server/index.ts
EOF

# Unix shell script
cat > run-dev.sh << 'EOF'
#!/bin/bash
NODE_ENV=development tsx server/index.ts
EOF

chmod +x run-dev.sh

echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Update .env file with your database credentials"
echo "2. Run 'npm run dev' to start development server"
echo "3. Open http://localhost:5000 in your browser"
echo ""
echo "📚 For detailed setup instructions, see README-CURSOR.md"
echo ""
echo "🔧 Available commands:"
echo "  npm run dev      - Start development server (Unix/Mac)"
echo "  npm run dev:win  - Start development server (Windows)"
echo "  npm run build    - Build for production"
echo "  npm run db:push  - Update database schema"
echo "  npm run db:studio - Open database studio"