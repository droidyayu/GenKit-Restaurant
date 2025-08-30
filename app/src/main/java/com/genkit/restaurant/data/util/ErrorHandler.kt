package com.genkit.restaurant.data.util

import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/**
 * Utility class for handling and categorizing errors
 */
object ErrorHandler {
    
    /**
     * Gets a user-friendly error message for HTTP status codes
     */
    fun getHttpErrorMessage(statusCode: Int): String {
        return when (statusCode) {
            400 -> "Bad request. Please check your input and try again."
            401 -> "Authentication failed. Please check your credentials."
            403 -> "Access denied. You don't have permission to perform this action."
            404 -> "Service not found. Please try again later."
            408 -> "Request timeout. Please check your connection and try again."
            429 -> "Too many requests. Please wait a moment and try again."
            500 -> "Server error. Please try again later."
            502 -> "Service temporarily unavailable. Please try again later."
            503 -> "Service unavailable. Please try again later."
            504 -> "Gateway timeout. Please try again later."
            else -> "Network error (Code: $statusCode). Please try again."
        }
    }
    
    /**
     * Gets a user-friendly error message for exceptions
     */
    fun getErrorMessage(exception: Exception): String {
        return when (exception) {
            is SocketTimeoutException -> "Connection timeout. Please check your internet connection and try again."
            is UnknownHostException -> "Cannot connect to server. Please check your internet connection."
            is IOException -> "Network error. Please check your connection and try again."
            else -> exception.message ?: "An unexpected error occurred. Please try again."
        }
    }
    
    /**
     * Determines if an error is retryable
     */
    fun isRetryableError(exception: Exception): Boolean {
        return when (exception) {
            is SocketTimeoutException -> true
            is IOException -> true
            else -> {
                val message = exception.message?.lowercase() ?: ""
                message.contains("timeout") || 
                message.contains("connection") ||
                message.contains("network") ||
                message.contains("502") ||
                message.contains("503") ||
                message.contains("504")
            }
        }
    }
    
    /**
     * Determines if an error indicates session expiration
     */
    fun isSessionExpiredError(exception: Exception): Boolean {
        val message = exception.message?.lowercase() ?: ""
        return message.contains("session") && 
               (message.contains("expired") || 
                message.contains("invalid") || 
                message.contains("401") ||
                message.contains("403"))
    }
}