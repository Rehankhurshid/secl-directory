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
