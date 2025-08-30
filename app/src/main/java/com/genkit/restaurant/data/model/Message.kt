package com.genkit.restaurant.data.model

/**
 * Data class representing a chat message
 */
data class Message(
    val id: String,
    val content: String,
    val isFromUser: Boolean,
    val agentName: String? = null,
    val timestamp: Long = System.currentTimeMillis()
)