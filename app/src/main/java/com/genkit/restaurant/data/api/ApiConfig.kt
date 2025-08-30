package com.genkit.restaurant.data.api

import com.genkit.restaurant.BuildConfig

object ApiConfig {
    // Base URL configuration - same for all builds
    const val BASE_URL = "https://a2a-kitchen-api.onrender.com"
    
    // API endpoints
    object Endpoints {
        const val HEALTH_CHECK = "/adk/docs"
        const val CREATE_SESSION = "/adk/apps/app/users/{userId}/sessions/{sessionId}"
        const val SEND_MESSAGE = "/adk/run_sse"
    }
    
    // Headers
    object Headers {
        const val CONTENT_TYPE = "Content-Type"
        const val API_KEY = "x-api-key"
        const val APPLICATION_JSON = "application/json"
    }
    
    // API Key - should be set via BuildConfig or environment variables
    val API_KEY_VALUE = BuildConfig.API_KEY.takeIf { it.isNotEmpty() } 
        ?: System.getenv("RESTAURANT_API_KEY") 
        ?: "your-api-key-here" // Default placeholder
    
    init {
        // Log configuration for debugging
        println("ApiConfig initialized:")
        println("  BASE_URL: $BASE_URL")
        println("  API_KEY present: ${API_KEY_VALUE.isNotEmpty()}")
    }
}