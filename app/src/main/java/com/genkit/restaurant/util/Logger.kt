package com.genkit.restaurant.util

import android.util.Log
import com.genkit.restaurant.BuildConfig

/**
 * Centralized logging utility for the Restaurant Chat app
 * Provides structured logging with different levels and categories
 */
object Logger {
    
    private const val TAG_PREFIX = "RestaurantChat"
    
    // Log categories
    object Tags {
        const val API = "${TAG_PREFIX}_API"
        const val NETWORK = "${TAG_PREFIX}_Network"
        const val UI = "${TAG_PREFIX}_UI"
        const val REPOSITORY = "${TAG_PREFIX}_Repository"
        const val VIEWMODEL = "${TAG_PREFIX}_ViewModel"
        const val ERROR = "${TAG_PREFIX}_Error"
        const val SESSION = "${TAG_PREFIX}_Session"
        const val MESSAGE = "${TAG_PREFIX}_Message"
        const val LIFECYCLE = "${TAG_PREFIX}_Lifecycle"
    }
    
    // Enable logging in debug builds or when explicitly enabled
    private val isLoggingEnabled = BuildConfig.DEBUG || BuildConfig.BUILD_TYPE == "debug"
    
    // Always enable API logging for debugging network issues
    private val isApiLoggingEnabled = true
    
    /**
     * Log debug messages
     */
    fun d(tag: String, message: String, throwable: Throwable? = null) {
        if (isLoggingEnabled) {
            if (throwable != null) {
                Log.d(tag, message, throwable)
            } else {
                Log.d(tag, message)
            }
        }
    }
    
    /**
     * Log info messages
     */
    fun i(tag: String, message: String, throwable: Throwable? = null) {
        if (isLoggingEnabled) {
            if (throwable != null) {
                Log.i(tag, message, throwable)
            } else {
                Log.i(tag, message)
            }
        }
    }
    
    /**
     * Log warning messages
     */
    fun w(tag: String, message: String, throwable: Throwable? = null) {
        if (isLoggingEnabled) {
            if (throwable != null) {
                Log.w(tag, message, throwable)
            } else {
                Log.w(tag, message)
            }
        }
    }
    
    /**
     * Log error messages (always logged, even in release)
     */
    fun e(tag: String, message: String, throwable: Throwable? = null) {
        if (throwable != null) {
            Log.e(tag, message, throwable)
        } else {
            Log.e(tag, message)
        }
    }
    
    /**
     * Log verbose messages
     */
    fun v(tag: String, message: String, throwable: Throwable? = null) {
        if (isLoggingEnabled) {
            if (throwable != null) {
                Log.v(tag, message, throwable)
            } else {
                Log.v(tag, message)
            }
        }
    }
    
    // Convenience methods for common logging scenarios
    
    /**
     * Log API request details (always enabled)
     */
    fun logApiRequest(endpoint: String, method: String, params: Map<String, Any>? = null) {
        if (isApiLoggingEnabled) {
            val paramsStr = params?.let { " | Params: $it" } ?: ""
            Log.d(Tags.API, "🚀 API Request: $method $endpoint$paramsStr")
        }
    }
    
    /**
     * Log API response details (always enabled)
     */
    fun logApiResponse(endpoint: String, statusCode: Int, responseBody: String?, duration: Long? = null) {
        if (isApiLoggingEnabled) {
            val durationStr = duration?.let { " | Duration: ${it}ms" } ?: ""
            val bodyPreview = responseBody?.take(500)?.let { 
                if (responseBody.length > 500) "$it..." else it 
            } ?: "Empty"
            
            when {
                statusCode in 200..299 -> {
                    Log.i(Tags.API, "✅ API Success: $endpoint | Status: $statusCode$durationStr")
                    Log.d(Tags.API, "📄 Response Body: $bodyPreview")
                }
                statusCode in 400..499 -> {
                    Log.w(Tags.API, "⚠️ API Client Error: $endpoint | Status: $statusCode$durationStr")
                    Log.w(Tags.API, "📄 Error Response: $bodyPreview")
                }
                statusCode >= 500 -> {
                    Log.e(Tags.API, "❌ API Server Error: $endpoint | Status: $statusCode$durationStr")
                    Log.e(Tags.API, "📄 Error Response: $bodyPreview")
                }
            }
        }
    }
    
    /**
     * Log API errors (always enabled)
     */
    fun logApiError(endpoint: String, error: Throwable, context: String? = null) {
        if (isApiLoggingEnabled) {
            val contextStr = context?.let { " | Context: $it" } ?: ""
            Log.e(Tags.API, "💥 API Error: $endpoint$contextStr", error)
        }
    }
    
    /**
     * Log network connectivity changes
     */
    fun logNetworkStatus(isConnected: Boolean, networkType: String? = null) {
        val typeStr = networkType?.let { " ($it)" } ?: ""
        if (isConnected) {
            i(Tags.NETWORK, "🌐 Network Connected$typeStr")
        } else {
            w(Tags.NETWORK, "📵 Network Disconnected")
        }
    }
    
    /**
     * Log session events
     */
    fun logSessionEvent(event: String, userId: String? = null, sessionId: String? = null, details: String? = null) {
        val userStr = userId?.let { " | User: $it" } ?: ""
        val sessionStr = sessionId?.let { " | Session: ${it.take(8)}..." } ?: ""
        val detailsStr = details?.let { " | $it" } ?: ""
        i(Tags.SESSION, "👤 Session $event$userStr$sessionStr$detailsStr")
    }
    
    /**
     * Log message events
     */
    fun logMessage(direction: String, content: String, agent: String? = null) {
        val agentStr = agent?.let { " | Agent: $it" } ?: ""
        val preview = content.take(100).let { if (content.length > 100) "$it..." else it }
        i(Tags.MESSAGE, "💬 Message $direction$agentStr: $preview")
    }
    
    /**
     * Log UI events
     */
    fun logUiEvent(event: String, screen: String? = null, details: String? = null) {
        val screenStr = screen?.let { " | Screen: $it" } ?: ""
        val detailsStr = details?.let { " | $it" } ?: ""
        d(Tags.UI, "🎨 UI Event: $event$screenStr$detailsStr")
    }
    
    /**
     * Log lifecycle events
     */
    fun logLifecycle(component: String, event: String, details: String? = null) {
        val detailsStr = details?.let { " | $it" } ?: ""
        d(Tags.LIFECYCLE, "🔄 Lifecycle: $component.$event$detailsStr")
    }
    
    /**
     * Log performance metrics
     */
    fun logPerformance(operation: String, duration: Long, details: String? = null) {
        val detailsStr = details?.let { " | $it" } ?: ""
        val level = when {
            duration < 100 -> "⚡"
            duration < 500 -> "🐌"
            else -> "🐢"
        }
        i(Tags.API, "$level Performance: $operation took ${duration}ms$detailsStr")
    }
}