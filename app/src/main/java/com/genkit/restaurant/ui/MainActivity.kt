package com.genkit.restaurant.ui

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import com.genkit.restaurant.R

class MainActivity : AppCompatActivity() {
    
    private lateinit var sharedPreferences: SharedPreferences
    private var hasNavigated = false
    
    companion object {
        private const val PREFS_NAME = "restaurant_chat_prefs"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_SESSION_ID = "session_id"
        private const val KEY_APP_NAME = "app_name"
        private const val SPLASH_DELAY = 1000L // 1 second delay for splash screen effect
        
        // Keys for saving instance state
        private const val STATE_HAS_NAVIGATED = "state_has_navigated"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // Initialize SharedPreferences
        sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        
        // Restore state if available
        restoreInstanceState(savedInstanceState)
        
        // Only navigate if we haven't already navigated (prevents double navigation on rotation)
        if (!hasNavigated) {
            // Add a brief delay to show the splash screen, then navigate
            Handler(Looper.getMainLooper()).postDelayed({
                if (!hasNavigated && !isFinishing && !isDestroyed) {
                    navigateToAppropriateActivity()
                }
            }, SPLASH_DELAY)
        }
    }
    
    /**
     * Check session data and navigate to appropriate activity
     */
    private fun navigateToAppropriateActivity() {
        val userId = sharedPreferences.getString(KEY_USER_ID, null)
        val sessionId = sharedPreferences.getString(KEY_SESSION_ID, null)
        val appName = sharedPreferences.getString(KEY_APP_NAME, null)
        
        if (isSessionValid(userId, sessionId, appName)) {
            // Valid session exists - navigate to ChatActivity
            navigateToChatActivity()
        } else {
            // No valid session - navigate to UserIdActivity
            navigateToUserIdActivity()
        }
    }
    
    /**
     * Check if the stored session data is valid
     */
    private fun isSessionValid(userId: String?, sessionId: String?, appName: String?): Boolean {
        // Session is valid if all required data exists and is not empty
        return !userId.isNullOrBlank() && 
               !sessionId.isNullOrBlank() && 
               !appName.isNullOrBlank()
    }
    
    /**
     * Navigate to UserIdActivity for new session creation
     */
    private fun navigateToUserIdActivity() {
        if (!hasNavigated && !isFinishing && !isDestroyed) {
            hasNavigated = true
            val intent = Intent(this, UserIdActivity::class.java)
            startActivity(intent)
            finish() // Close MainActivity to prevent going back
        }
    }
    
    /**
     * Navigate to ChatActivity with existing session
     */
    private fun navigateToChatActivity() {
        if (!hasNavigated && !isFinishing && !isDestroyed) {
            hasNavigated = true
            val intent = Intent(this, ChatActivity::class.java)
            startActivity(intent)
            finish() // Close MainActivity to prevent going back
        }
    }
    
    override fun onResume() {
        super.onResume()
        
        // If the activity is resumed (e.g., user comes back from background),
        // check if session is still valid
        if (!isFinishing && !isDestroyed) {
            val userId = sharedPreferences.getString(KEY_USER_ID, null)
            val sessionId = sharedPreferences.getString(KEY_SESSION_ID, null)
            val appName = sharedPreferences.getString(KEY_APP_NAME, null)
            
            // If session became invalid while app was in background, restart navigation
            if (!isSessionValid(userId, sessionId, appName)) {
                navigateToUserIdActivity()
            }
        }
    }
    
    override fun onBackPressed() {
        // Override back button to exit app instead of navigating back
        // This prevents users from getting stuck in navigation loops
        finishAffinity() // Close all activities and exit app
    }
    
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        
        // Save navigation state to prevent double navigation on rotation
        outState.putBoolean(STATE_HAS_NAVIGATED, hasNavigated)
    }
    
    private fun restoreInstanceState(savedInstanceState: Bundle?) {
        savedInstanceState?.let { state ->
            // Restore navigation state
            hasNavigated = state.getBoolean(STATE_HAS_NAVIGATED, false)
        }
    }
    
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        
        // Handle configuration changes
        // MainActivity is typically short-lived, so not much to do here
        // The main thing is to prevent double navigation, which we handle with hasNavigated flag
    }
}