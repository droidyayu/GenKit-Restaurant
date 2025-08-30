# Contributing to GenKit Restaurant Chat

Thank you for your interest in contributing to GenKit Restaurant Chat! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### Reporting Issues

1. **Search existing issues** first to avoid duplicates
2. **Use the issue template** when creating new issues
3. **Provide detailed information**:
   - Device and Android version
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable

### Submitting Changes

1. **Fork the repository**
2. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
3. **Make your changes** following our coding standards
4. **Test thoroughly** - ensure all tests pass
5. **Commit with clear messages** using conventional commits
6. **Push and create a Pull Request**

## 📝 Coding Standards

### Kotlin Style

- Follow [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html)
- Use [Android Kotlin style guide](https://developer.android.com/kotlin/style-guide)
- Maximum line length: 120 characters
- Use meaningful variable and function names

### Compose Guidelines

- Keep composables small and focused
- Use `@Preview` for UI components
- Follow Material Design 3 principles
- Ensure accessibility compliance

### Architecture

- Follow MVVM pattern
- Use Repository pattern for data access
- Keep ViewModels UI-agnostic
- Use dependency injection where appropriate

## 🧪 Testing Requirements

### Before Submitting

- [ ] All unit tests pass
- [ ] All instrumented tests pass
- [ ] New features have corresponding tests
- [ ] UI changes include accessibility tests
- [ ] No lint warnings or errors

### Test Types

1. **Unit Tests**: Business logic, ViewModels, utilities
2. **Integration Tests**: Repository, API interactions
3. **UI Tests**: Compose screens, user flows
4. **Accessibility Tests**: Screen reader support

## 📋 Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new functionality
3. **Ensure CI passes** all checks
4. **Request review** from maintainers
5. **Address feedback** promptly
6. **Squash commits** if requested

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Tests added and passing
- [ ] Documentation updated
```

## 🏗️ Development Setup

### Prerequisites

- Android Studio Hedgehog (2023.1.1) or newer
- JDK 8 or higher
- Android SDK with API 26+

### Local Development

1. **Clone and setup**:
   ```bash
   git clone https://github.com/yourusername/genkit-restaurant.git
   cd genkit-restaurant
   ```

2. **Open in Android Studio** and sync Gradle

3. **Run tests**:
   ```bash
   ./gradlew test
   ./gradlew connectedAndroidTest
   ```

### Code Quality Tools

- **Lint**: `./gradlew lint`
- **Detekt**: Static code analysis (if configured)
- **Tests**: `./gradlew check`

## 🎯 Areas for Contribution

### High Priority
- Bug fixes and stability improvements
- Accessibility enhancements
- Performance optimizations
- Test coverage improvements

### Medium Priority
- New features (discuss first in issues)
- UI/UX improvements
- Documentation updates
- Code refactoring

### Low Priority
- Code style improvements
- Minor optimizations
- Additional test cases

## 📞 Getting Help

- **Questions**: Open a discussion or issue
- **Chat**: Join our community (if available)
- **Email**: Contact maintainers directly

## 🏆 Recognition

Contributors will be:
- Listed in the README
- Mentioned in release notes
- Invited to join the contributors team (for regular contributors)

Thank you for helping make GenKit Restaurant Chat better! 🚀