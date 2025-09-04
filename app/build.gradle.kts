plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    // Add Firebase plugins
    id("com.google.gms.google-services")
    id("com.google.firebase.crashlytics")
}

android {
    namespace = "com.genkit.restaurant"
    compileSdk = libs.versions.compileSdk.get().toInt()

    defaultConfig {
        applicationId = "com.genkit.restaurant"
        minSdk = libs.versions.minSdk.get().toInt()
        targetSdk = libs.versions.targetSdk.get().toInt()
        versionCode = 1
        versionName = "1.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        
        // API Keys - set these via environment variables or gradle.properties
        buildConfigField("String", "API_KEY", "\"${project.findProperty("RESTAURANT_API_KEY") ?: ""}\"")
        buildConfigField("String", "GEMINI_API_KEY", "\"${project.findProperty("GEMINI_API_KEY") ?: ""}\"")
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_1_8
        targetCompatibility = JavaVersion.VERSION_1_8
    }

    kotlinOptions {
        jvmTarget = "1.8"
    }
    
    buildFeatures {
        compose = true
        buildConfig = true
    }
    
    composeOptions {
        kotlinCompilerExtensionVersion = libs.versions.composeCompiler.get()
    }
}

dependencies {
    // Android Core
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.appcompat)
    implementation(libs.material)
    implementation(libs.androidx.constraintlayout)
    implementation(libs.androidx.activity.ktx)
    implementation(libs.androidx.fragment.ktx)
    
    // Lifecycle
    implementation(libs.bundles.lifecycle)
    
    // Networking
    implementation(libs.bundles.networking)
    
    // Coroutines
    implementation(libs.bundles.coroutines)
    
    // JSON parsing
    implementation(libs.gson)


    // RecyclerView (for legacy support if needed)
    implementation(libs.androidx.recyclerview)
    
    // Jetpack Compose BOM
    implementation(platform(libs.androidx.compose.bom))
    
    // Compose UI Bundle
    implementation(libs.bundles.compose)
    
    // Compose Debug Tools
    debugImplementation(libs.bundles.compose.debug)
    
    // Firebase
    implementation(platform("com.google.firebase:firebase-bom:32.0.0"))
    implementation("com.google.firebase:firebase-functions-ktx")
    implementation("com.google.firebase:firebase-auth-ktx")
    implementation("com.google.firebase:firebase-firestore-ktx")
    implementation("com.google.firebase:firebase-analytics-ktx")
    implementation("com.google.firebase:firebase-crashlytics-ktx")
    implementation("com.firebaseui:firebase-ui-auth:8.0.2")
    
    // Testing
    testImplementation(libs.bundles.testing)
    
    // Android Testing
    androidTestImplementation(libs.bundles.android.testing)
}