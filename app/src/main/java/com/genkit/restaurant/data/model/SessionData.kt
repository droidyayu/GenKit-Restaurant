package com.genkit.restaurant.data.model

/**
 * Data class representing a chat session
 */
data class SessionData(
    val userId: String,
    val sessionId: String,
    val appName: String
)