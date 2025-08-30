# Development Setup Guide

This guide will help you set up the GenKit Restaurant Chat project for local development.

## 📋 Prerequisites

### Required Software

1. **Android Studio** (Hedgehog 2023.1.1 or newer)
   - Download from [developer.android.com](https://developer.android.com/studio)
   - Install with Android SDK

2. **Java Development Kit (JDK) 17**
   - Android Studio includes a JDK, or install separately
   - Verify: `java -version`

3. **Git**
   - For version control
   - Verify: `git --version`

### Android SDK Requirements

- **Minimum SDK**: API 26 (Android 8.0)
- **Target SDK**: API 36 (Android 14)
- **Compile SDK**: API 36

## 🚀 Project Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/genkit-restaurant.git
cd genkit-restaurant
```

### 2. Configure API Keys

The app requires API keys for backend services. You have several options:

#### Option A: Using gradle.properties (Recommended)

1. Copy the sample file:
   ```bash
   cp gradle.properties.sample gradle.properties
   ```

2. Edit `gradle.properties` and add your API keys:
   ```properties
   RESTAURANT_API_KEY=your-actual-restaurant-api-key
   GEMINI_API_KEY=your-actual-gemini-api-key
   ```

#### Option B: Using Environment Variables

Set environment variables in your system:

```bash
export RESTAURANT_API_KEY="your-actual-restaurant-api-key"
export GEMINI_API_KEY="your-actual-gemini-api-key"
```

#### Option C: Using Android Studio

1. Open **File > Project Structure**
2. Go to **Modules > app > Build Types**
3. Add the keys in the build configuration

### 3. Open in Android Studio

1. Launch Android Studio
2. Select **"Open an existing project"**
3. Navigate to the cloned directory
4. Click **"Open"**

### 4. Sync Project

Android Studio should automatically prompt to sync. If not:
- Click **"Sync Now"** in the notification bar
- Or go to **File > Sync Project with Gradle Files**

## 🔑 API Key Setup

### Restaurant API Key

1. Contact your backend team for the API key
2. Or use the development/testing key if available
3. Add to your configuration as shown above

### Gemini API Key (Optional)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add to your configuration

**Note**: The app will work without Gemini integration, but some AI features may be disabled.

## 🏃‍♂️ Running the App

### 1. Set Up Device/Emulator

#### Physical Device
- Enable **Developer Options** and **USB Debugging**
- Connect via USB
- Allow debugging when prompted

#### Android Emulator
- Open **AVD Manager** in Android Studio
- Create a new virtual device (API 26+)
- Start the emulator

### 2. Build and Run

1. Select your device/emulator in the toolbar
2. Click the **"Run"** button (green triangle)
3. Or press **Shift + F10**

The app should build and install automatically.

## 🧪 Running Tests

### Unit Tests
```bash
./gradlew test
```

### Instrumented Tests
```bash
./gradlew connectedAndroidTest
```

### All Tests
```bash
./gradlew check
```

## 🔧 Development Tools

### Useful Gradle Commands

```bash
# Clean build
./gradlew clean

# Build debug APK
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease

# Run lint checks
./gradlew lint

# Generate test reports
./gradlew test jacocoTestReport
```

### Android Studio Plugins (Recommended)

- **Kotlin** (built-in)
- **Android Jetpack Compose** (built-in)
- **GitToolBox** - Enhanced Git integration
- **Rainbow Brackets** - Better code readability
- **SonarLint** - Code quality analysis

## 🐛 Troubleshooting

### Common Issues

#### Build Fails with "API key not found"
- Ensure you've set up API keys as described above
- Check that `gradle.properties` exists and contains the keys
- Restart Android Studio after adding keys

#### Gradle Sync Fails
- Check your internet connection
- Try **File > Invalidate Caches and Restart**
- Ensure you're using the correct JDK version

#### App Crashes on Startup
- Check the Logcat output in Android Studio
- Ensure your device/emulator meets minimum requirements
- Verify API keys are correctly configured

#### Tests Fail
- Ensure all dependencies are properly synced
- Check that test devices meet requirements
- Run tests individually to isolate issues

### Getting Help

1. Check the [Issues](https://github.com/yourusername/genkit-restaurant/issues) page
2. Search existing issues before creating new ones
3. Include device info, Android version, and error logs
4. Follow the issue template for bug reports

## 📚 Additional Resources

- [Android Developer Documentation](https://developer.android.com/docs)
- [Jetpack Compose Documentation](https://developer.android.com/jetpack/compose)
- [Kotlin Documentation](https://kotlinlang.org/docs/home.html)
- [Material Design 3](https://m3.material.io/)

## 🎯 Next Steps

Once you have the project running:

1. Explore the codebase structure
2. Run the existing tests
3. Try making small changes
4. Read the [Contributing Guide](CONTRIBUTING.md)
5. Check the [Project Roadmap](README.md#-roadmap)

Happy coding! 🚀