# GenKit Restaurant Chat Android App

A modern Android application built with Jetpack Compose for communicating with restaurant management systems. This app provides an intuitive chat interface for restaurant operations and customer interactions.

## 🚀 Features

- **Modern UI**: Built with Jetpack Compose for a smooth, native Android experience
- **Chat Interface**: Real-time messaging with restaurant systems
- **Session Management**: User authentication and session handling
- **Multi-Agent Support**: Communicate with different restaurant service agents
- **Error Handling**: Robust error management and user feedback
- **Offline Support**: Basic offline state management
- **Accessibility**: Full accessibility support for all users

## 🏗️ Architecture

This app follows **Clean Architecture** principles with **MVVM** pattern:

```
app/src/main/java/com/genkit/restaurant/
├── ui/                           # Presentation Layer
│   ├── compose/                  # Jetpack Compose UI
│   │   ├── MainActivity.kt       # Main Compose activity
│   │   ├── ChatScreen.kt         # Chat interface
│   │   ├── UserIdScreen.kt       # User authentication
│   │   └── Previews.kt           # UI previews
│   ├── theme/                    # App theming
│   └── [legacy]/                 # Legacy View-based UI (migration support)
├── domain/                       # Business Logic Layer
│   └── viewmodel/                # ViewModels for UI state management
├── data/                         # Data Layer
│   ├── api/                      # API interfaces and configuration
│   ├── model/                    # Data models and DTOs
│   ├── repository/               # Repository implementations
│   ├── network/                  # Network configuration
│   ├── llm/                      # LLM service integration
│   └── util/                     # Data utilities
└── util/                         # App utilities and helpers
```

## 🛠️ Tech Stack

### Core
- **Kotlin** - Primary programming language
- **Jetpack Compose** - Modern UI toolkit
- **Material Design 3** - Design system

### Architecture Components
- **ViewModel** - UI state management
- **Navigation Compose** - Navigation between screens
- **StateFlow** - Reactive state management

### Networking
- **Retrofit** - HTTP client
- **OkHttp** - HTTP/HTTP2 client
- **Gson** - JSON serialization

### Async Programming
- **Kotlin Coroutines** - Asynchronous programming
- **Flow** - Reactive streams

### Testing
- **JUnit** - Unit testing
- **Mockito** - Mocking framework
- **Espresso** - UI testing
- **Compose Testing** - Compose UI testing

## 📋 Requirements

- **Android 8.0** (API level 26) or higher
- **Target SDK**: Android 14 (API level 36)
- **Android Studio**: Hedgehog (2023.1.1) or newer
- **Kotlin**: 1.9.10+

## 🚀 Getting Started

### Prerequisites

1. Install [Android Studio](https://developer.android.com/studio)
2. Set up an Android device or emulator
3. Ensure you have the latest Android SDK

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/genkit-restaurant.git
   cd genkit-restaurant
   ```

2. **Open in Android Studio**
   - Launch Android Studio
   - Select "Open an existing project"
   - Navigate to the cloned directory

3. **Sync Gradle**
   - Android Studio will automatically prompt to sync
   - Or manually sync via `File > Sync Project with Gradle Files`

4. **Run the app**
   - Connect an Android device or start an emulator
   - Click the "Run" button or press `Shift + F10`

### Configuration

1. **API Configuration** (if needed)
   - Update `ApiConfig.kt` with your backend URL
   - Configure authentication settings

2. **Build Variants**
   - Debug: Development build with logging
   - Release: Production build with optimizations

## 🧪 Testing

### Running Tests

```bash
# Unit tests
./gradlew test

# Instrumented tests
./gradlew connectedAndroidTest

# All tests
./gradlew check
```

### Test Coverage

The project includes:
- **Unit Tests**: Business logic and ViewModels
- **Integration Tests**: API and Repository layers
- **UI Tests**: Compose screens and user flows
- **Accessibility Tests**: Screen reader and navigation support

## 🔧 Development

### Code Style

This project follows [Kotlin coding conventions](https://kotlinlang.org/docs/coding-conventions.html) and [Android Kotlin style guide](https://developer.android.com/kotlin/style-guide).

### Git Workflow

1. Create feature branches from `main`
2. Use conventional commit messages
3. Submit pull requests for review
4. Ensure all tests pass before merging

### Building for Release

```bash
# Generate release APK
./gradlew assembleRelease

# Generate release AAB (recommended for Play Store)
./gradlew bundleRelease
```

## 📱 Screenshots

*Coming soon - Add screenshots of your app here*

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/genkit-restaurant/issues) page
2. Create a new issue with detailed information
3. Include device information, Android version, and steps to reproduce

## 🗺️ Roadmap

- [ ] Enhanced chat features (file sharing)
- [ ] Push notifications
- [ ] Dark mode support
- [ ] Multi-language support
- [ ] Advanced restaurant management features
- [ ] Integration with more backend services

---

**Built with ❤️ using Jetpack Compose**