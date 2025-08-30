package com.genkit.restaurant.data.model

import com.google.gson.annotations.SerializedName

data class MessagePart(
    val text: String
)

data class NewMessage(
    val parts: List<MessagePart>,
    val role: String = "user"
)

data class SendMessageRequest(
    val appName: String,
    val userId: String,
    val sessionId: String,
    val newMessage: NewMessage,
    val streaming: Boolean = false
)

// Response models
data class CreateSessionResponse(
    @SerializedName("userId")
    val userId: String,
    @SerializedName("id")
    val sessionId: String,
    @SerializedName("appName")
    val appName: String
)

data class ApiError(
    val message: String,
    val code: Int? = null
)

data class AgentResponse(
    val agentName: String?,
    val text: String
)