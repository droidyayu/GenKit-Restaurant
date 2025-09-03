package com.genkit.restaurant

import android.app.Application
import com.google.firebase.FirebaseApp
import com.genkit.restaurant.util.Logger

/**
 * Application class for Restaurant Chat app
 * Initializes Firebase and other app-wide configurations
 */
class RestaurantApplication : Application() {
    
    override fun onCreate() {
        super.onCreate()
        
        // Initialize Firebase
        try {
            FirebaseApp.initializeApp(this)
            Logger.i(Logger.Tags.LIFECYCLE, "Firebase initialized successfully")
        } catch (e: Exception) {
            Logger.e(Logger.Tags.ERROR, "Failed to initialize Firebase: ${e.message}")
        }
        
        Logger.i(Logger.Tags.LIFECYCLE, "RestaurantApplication onCreate completed")
    }
}
