#!/bin/bash

# Repository Reorganization Script for SECL Directory
# This script will help organize your repository structure

echo "🚀 Starting SECL Repository Reorganization..."

# Create new directory structure
echo "📁 Creating directory structure..."
mkdir -p docs/deployment
mkdir -p docs/development
mkdir -p docs/api
mkdir -p scripts/deploy
mkdir -p scripts/setup
mkdir -p scripts/utils
mkdir -p config

# Move deployment documentation
echo "📚 Organizing deployment documentation..."
mv DEPLOYMENT*.md docs/deployment/ 2>/dev/null
mv RAILWAY*.md docs/deployment/ 2>/dev/null
mv VERCEL*.md docs/deployment/ 2>/dev/null
mv QUICK-DEPLOY.md docs/deployment/ 2>/dev/null
mv vercel-*.md docs/deployment/ 2>/dev/null

# Move development documentation
echo "📝 Organizing development documentation..."
mv CLAUDE-V0-WORKFLOW.md docs/development/ 2>/dev/null
mv PRODUCTION-TEST-CHECKLIST.md docs/development/ 2>/dev/null

# Keep CLAUDE.md in root (it's for AI assistance)
echo "🤖 Keeping CLAUDE.md in root for AI assistance..."

# Move scripts
echo "🔧 Organizing scripts..."
mv deploy-*.sh scripts/deploy/ 2>/dev/null
mv fix-database-url.sh scripts/utils/ 2>/dev/null
mv set-vercel-env.sh scripts/setup/ 2>/dev/null
mv remove-vercel-env.sh scripts/utils/ 2>/dev/null

# Move configuration files
echo "⚙️ Organizing configuration files..."
mv railway.toml config/ 2>/dev/null
mv vercel.json config/ 2>/dev/null
cp .env.example config/.env.example 2>/dev/null

# Clean up text files
echo "🧹 Cleaning up misc files..."
mkdir -p docs/deployment/logs
mv VERCEL-ENV-VARS.txt docs/deployment/logs/ 2>/dev/null
mv vercel-env.txt docs/deployment/logs/ 2>/dev/null

# Create a proper .gitignore if it doesn't exist
echo "📄 Updating .gitignore..."
cat >> .gitignore << 'EOL'

# Environment files
.env
.env.local
.env.production.local
.env.development.local
.env.test.local
.env.vercel
.env.production

# Logs
*.log
logs/
dev_output.log

# OS files
.DS_Store
Thumbs.db

# IDE files
.idea/
.vscode/
*.swp
*.swo

# Temporary files
*.tmp
*.temp
.cache/

# Build outputs
.next/
out/
dist/
build/

# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
.nyc_output/

# Misc
.vercel/
.taskmaster/
.cursor/
.ngrok-urls.json

# Database
*.sqlite
*.sqlite3
*.db
EOL

# Create CONTRIBUTING.md
echo "✍️ Creating CONTRIBUTING.md..."
cat > CONTRIBUTING.md << 'EOL'
# Contributing to SECL Directory

Thank you for your interest in contributing to SECL Directory! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to abide by our Code of Conduct: be respectful, inclusive, and professional.

## How to Contribute

### Reporting Bugs
- Use the issue tracker to report bugs
- Describe the bug and include steps to reproduce
- Include system information and error messages

### Suggesting Features
- Open an issue with the "feature request" label
- Clearly describe the feature and its benefits
- Provide use cases and examples

### Pull Requests

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Write or update tests as needed
5. Run tests and ensure they pass (`npm run test`)
6. Commit your changes (`git commit -m 'feat: add amazing feature'`)
7. Push to your branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Coding Standards

- Follow the patterns in `.cursor/rules/`
- Use TypeScript with strict mode
- Follow Clean Architecture principles
- Write tests for new features
- Use conventional commits for commit messages

### Commit Message Format

We use conventional commits:
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

### Testing

- Write tests for all new features
- Maintain test coverage above 80%
- Use Vitest and React Testing Library
- Test behavior, not implementation

## Development Setup

See README.md for development setup instructions.

## Questions?

Feel free to open an issue for any questions about contributing.
EOL

# Create LICENSE file
echo "📜 Creating LICENSE file..."
cat > LICENSE << 'EOL'
MIT License

Copyright (c) 2024 SECL Directory Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOL

# Create index files for documentation
echo "📑 Creating documentation index files..."
cat > docs/README.md << 'EOL'
# SECL Directory Documentation

## Documentation Structure

- **[Development](./development/)** - Development guides and workflows
- **[Deployment](./deployment/)** - Deployment guides for various platforms
- **[API](./api/)** - API documentation (coming soon)

## Quick Links

- [Main README](../README.md)
- [Contributing Guide](../CONTRIBUTING.md)
- [Claude AI Assistant Guide](../CLAUDE.md)
EOL

cat > docs/deployment/README.md << 'EOL'
# Deployment Guides

This directory contains deployment guides for various platforms:

- **Vercel** - Serverless deployment
- **Railway** - Container-based deployment
- **Docker** - Self-hosted deployment (coming soon)

## Quick Start

For most users, we recommend starting with [Vercel deployment](./VERCEL-QUICK-SETUP.md).
EOL

# Summary
echo ""
echo "✅ Repository reorganization complete!"
echo ""
echo "📋 Summary of changes:"
echo "  - Created organized directory structure"
echo "  - Moved documentation to docs/"
echo "  - Moved scripts to scripts/"
echo "  - Created README.md, CONTRIBUTING.md, and LICENSE"
echo "  - Updated .gitignore"
echo ""
echo "🎯 Next steps:"
echo "  1. Review the changes"
echo "  2. Update any import paths in your code if needed"
echo "  3. Commit the reorganized structure"
echo "  4. Update your GitHub repository settings"
echo ""
echo "💡 Tip: Run 'git status' to see all changes"