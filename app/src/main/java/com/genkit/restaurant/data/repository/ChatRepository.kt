package com.genkit.restaurant.data.repository

import android.content.Context
import com.google.gson.JsonParser
import com.genkit.restaurant.data.api.ApiService
import com.genkit.restaurant.data.model.*
import com.genkit.restaurant.data.network.NetworkModule
import com.genkit.restaurant.data.util.ErrorHandler
import com.genkit.restaurant.data.util.NetworkUtil
import com.genkit.restaurant.util.Logger
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.ResponseBody
import java.io.BufferedReader
import java.util.UUID
import com.google.firebase.functions.FirebaseFunctions
import com.google.firebase.functions.ktx.functions
import com.google.firebase.ktx.Firebase
import com.google.firebase.auth.FirebaseAuth
import kotlinx.coroutines.tasks.await

/**
 * Repository for handling chat-related data operations and API communication
 */
class ChatRepository(private val context: Context) {
    
    private val apiService: ApiService = NetworkModule.apiService
    private val sseApiService: ApiService = NetworkModule.sseApiService
    
    // Firebase Functions integration
    private val firebaseFunctions: FirebaseFunctions = Firebase.functions
    private val firebaseAuth: FirebaseAuth = FirebaseAuth.getInstance()
    

    
    companion object {
        private const val APP_NAME = "restaurant-chat-android"
        private const val MAX_RETRY_ATTEMPTS = 3
        private const val RETRY_DELAY_MS = 1000L
    }
    
    /**
     * Creates a new session for the user with retry logic
     * @param userId The user ID to create session for
     * @return Result containing SessionData on success or error message on failure
     */
    suspend fun createSession(userId: String): Result<SessionData> = withContext(Dispatchers.IO) {
        Logger.logSessionEvent("CREATE_ATTEMPT", userId = userId)
        
        // Check network connectivity first
        if (!NetworkUtil.isNetworkAvailable(context)) {
            val error = Exception("No internet connection. Please check your network and try again.")
            Logger.logApiError("createSession", error, "Network unavailable")
            return@withContext Result.failure(error)
        }
        
        return@withContext executeWithRetry(MAX_RETRY_ATTEMPTS) {
            val sessionId = UUID.randomUUID().toString()
            Logger.d(Logger.Tags.REPOSITORY, "Creating session for user: $userId with sessionId: ${sessionId.take(8)}...")
            
            val response = apiService.createSession(userId, sessionId)
            
            if (response.isSuccessful) {
                response.body()?.let { createSessionResponse ->
                    val sessionData = SessionData(
                        userId = createSessionResponse.userId,
                        sessionId = createSessionResponse.sessionId,
                        appName = createSessionResponse.appName
                    )
                    Logger.logSessionEvent("CREATE_SUCCESS", userId = userId, sessionId = sessionId)
                    Logger.i(Logger.Tags.REPOSITORY, "Session created successfully: ${sessionData}")
                    Result.success(sessionData)
                } ?: run {
                    val error = Exception("Empty response body")
                    Logger.logApiError("createSession", error, "Response body is null")
                    Result.failure(error)
                }
            } else {
                val errorMessage = ErrorHandler.getHttpErrorMessage(response.code())
                val error = Exception(errorMessage)
                Logger.logSessionEvent("CREATE_FAILED", userId = userId, details = "HTTP ${response.code()}: $errorMessage")
                Result.failure(error)
            }
        }
    }
    
    /**
     * Sends a message to the backend and receives agent response with retry logic
     * @param sessionData The session data containing user and session info
     * @param message The message text to send
     * @return Result containing agent response on success or error message on failure
     */
    suspend fun sendMessage(sessionData: SessionData, message: String): Result<AgentResponse> = withContext(Dispatchers.IO) {
        Logger.logMessage("SENDING", message)
        Logger.d(Logger.Tags.REPOSITORY, "Sending message for session: ${sessionData.sessionId.take(8)}...")
        
        // Check network connectivity first
        if (!NetworkUtil.isNetworkAvailable(context)) {
            val error = Exception("No internet connection. Please check your network and try again.")
            Logger.logApiError("sendMessage", error, "Network unavailable")
            return@withContext Result.failure(error)
        }
        
        // Try Firebase Functions first (authentication bypassed for testing)
        try {
            Logger.d(Logger.Tags.REPOSITORY, "Attempting Firebase Functions call (auth bypassed)")
            return@withContext sendMessageViaFirebase(message)
        } catch (e: Exception) {
            Logger.w(Logger.Tags.REPOSITORY, "Firebase Functions call failed, falling back to API: ${e.message}")
        }
        
        // Fallback to existing API implementation
        return@withContext executeWithRetry(MAX_RETRY_ATTEMPTS) {
            val sendMessageRequest = SendMessageRequest(
                appName = sessionData.appName,
                userId = sessionData.userId,
                sessionId = sessionData.sessionId,
                newMessage = NewMessage(
                    parts = listOf(MessagePart(text = message)),
                    role = "user"
                ),
                streaming = false
            )
            
            Logger.d(Logger.Tags.REPOSITORY, "Message request payload: $sendMessageRequest")
            val startTime = System.currentTimeMillis()
            
            // Use SSE-specific service with extended timeout
            Logger.d(Logger.Tags.API, "Sending SSE request...")
            val response = sseApiService.sendMessage(sendMessageRequest)
            val duration = System.currentTimeMillis() - startTime
            
            Logger.d(Logger.Tags.API, "SSE request completed in ${duration}ms")
            Logger.d(Logger.Tags.API, "Response code: ${response.code()}")
            Logger.d(Logger.Tags.API, "Response headers: ${response.headers()}")
            
            if (response.isSuccessful) {
                response.body()?.let { responseBody ->
                    Logger.d(Logger.Tags.REPOSITORY, "Parsing SSE response...")
                    val agentResponse = parseSSEResponse(responseBody)
                    
                    if (agentResponse.text.isNotEmpty()) {
                        Logger.logMessage("RECEIVED", agentResponse.text)
                        Logger.logPerformance("sendMessage", duration, "Success")
                        Result.success(agentResponse)
                    } else {
                        val error = Exception("Empty response from server")
                        Logger.logApiError("sendMessage", error, "Empty agent response after parsing")
                        Result.failure(error)
                    }
                } ?: run {
                    val error = Exception("No response body received")
                    Logger.logApiError("sendMessage", error, "Response body is null")
                    Result.failure(error)
                }
            } else {
                val errorMessage = ErrorHandler.getHttpErrorMessage(response.code())
                val error = Exception(errorMessage)
                Logger.logPerformance("sendMessage", duration, "Failed with HTTP ${response.code()}")
                Result.failure(error)
            }
        }
    }
    
    /**
     * Checks if Firebase Functions are available and user is authenticated
     * @return Result indicating if Firebase Functions can be used
     */
    private suspend fun checkFirebaseAvailability(): Result<Boolean> = withContext(Dispatchers.IO) {
        return@withContext try {
            val currentUser = firebaseAuth.currentUser
            if (currentUser != null) {
                Result.success(true)
            } else {
                // Try to sign in anonymously
                try {
                    val result = firebaseAuth.signInAnonymously().await()
                    Logger.d(Logger.Tags.REPOSITORY, "Anonymous authentication successful")
                    Result.success(result.user != null)
                } catch (e: Exception) {
                    Logger.w(Logger.Tags.REPOSITORY, "Firebase anonymous sign-in failed: ${e.message}")
                    Result.success(false)
                }
            }
        } catch (e: Exception) {
            Logger.w(Logger.Tags.REPOSITORY, "Firebase availability check failed: ${e.message}")
            Result.success(false)
        }
    }
    
    /**
     * Sends a message using Firebase Functions
     * @param message The message text to send
     * @return Result containing agent response on success or error message on failure
     */
    private suspend fun sendMessageViaFirebase(message: String): Result<AgentResponse> = withContext(Dispatchers.IO) {
        return@withContext try {
            Logger.d(Logger.Tags.REPOSITORY, "Sending message via Firebase Functions: ${message.take(50)}...")

            // Get the current authenticated user
            val currentUser = firebaseAuth.currentUser
            val userId = currentUser?.uid ?: "guest_user_${System.currentTimeMillis()}"

            val data = mapOf(
                "userId" to userId,
                "message" to message
            )

            val result = firebaseFunctions
                .getHttpsCallable("kitchenFlow")
                .call(data)
                .await()

            val response = result.data as? Map<*, *>
            val responseText = (response?.get("message") as? String)?.trim()?.takeIf { it.isNotEmpty() }
                ?: (response?.get("text") as? String)?.trim()?.takeIf { it.isNotEmpty() }
                ?: (response?.get("response") as? String)?.trim()?.takeIf { it.isNotEmpty() }
                ?: "I'm sorry, I couldn't process your request. Please try again."

            Logger.logMessage("RECEIVED_FIREBASE", responseText)

            // Extract agent name from response or use dynamic name
            val agentName = response?.get("agentName") as? String
                ?: response?.get("agent") as? String
                ?: "Restaurant Assistant"

            val agentResponse = AgentResponse(
                text = responseText,
                agentName = agentName
            )

            Result.success(agentResponse)
        } catch (e: Exception) {
            Logger.logApiError("sendMessageViaFirebase", e, "Firebase Functions call failed")
            Result.failure(e)
        }
    }
    
    /**
     * Checks if the backend is healthy and reachable
     * @return Result indicating if backend is healthy
     */
    suspend fun checkBackendHealth(): Result<Boolean> = withContext(Dispatchers.IO) {
        // Check network connectivity first
        if (!NetworkUtil.isNetworkAvailable(context)) {
            return@withContext Result.failure(Exception("No internet connection"))
        }
        
        return@withContext try {
            val response = apiService.checkBackendHealth()
            Result.success(response.isSuccessful)
        } catch (e: Exception) {
            Result.success(false) // Backend not ready yet
        }
    }

    /**
     * Validates if a session is still active
     * @param sessionData The session data to validate
     * @return Result indicating if session is valid
     */
    suspend fun validateSession(sessionData: SessionData): Result<Boolean> = withContext(Dispatchers.IO) {
        // Check network connectivity first
        if (!NetworkUtil.isNetworkAvailable(context)) {
            return@withContext Result.failure(Exception("No internet connection"))
        }
        
        return@withContext try {
            // Try to send a simple validation message
            val testMessage = "ping"
            val result = sendMessage(sessionData, testMessage)
            
            if (result.isSuccess) {
                Result.success(true)
            } else {
                val exception = result.exceptionOrNull() as? Exception ?: Exception("Unknown error")
                if (ErrorHandler.isSessionExpiredError(exception)) {
                    Result.success(false) // Session expired
                } else {
                    Result.failure(exception)
                }
            }
        } catch (e: Exception) {
            if (ErrorHandler.isSessionExpiredError(e)) {
                Result.success(false)
            } else {
                Result.failure(e)
            }
        }
    }
    
    /**
     * Executes a network operation with retry logic
     * @param maxAttempts Maximum number of retry attempts
     * @param operation The operation to execute
     * @return Result of the operation
     */
    private suspend fun <T> executeWithRetry(
        maxAttempts: Int,
        operation: suspend () -> Result<T>
    ): Result<T> {
        var lastException: Exception? = null
        
        repeat(maxAttempts) { attempt ->
            try {
                val result = operation()
                if (result.isSuccess) {
                    return result
                }
                
                lastException = result.exceptionOrNull() as? Exception ?: Exception("Unknown error")
                
                // Don't retry if it's not a retryable error
                if (lastException != null && !ErrorHandler.isRetryableError(lastException!!)) {
                    return result
                }
                
                // Wait before retrying (exponential backoff)
                if (attempt < maxAttempts - 1) {
                    kotlinx.coroutines.delay(RETRY_DELAY_MS * (attempt + 1))
                }
            } catch (e: Exception) {
                lastException = e
                
                // Don't retry if it's not a retryable error
                if (!ErrorHandler.isRetryableError(e)) {
                    return Result.failure(Exception(ErrorHandler.getErrorMessage(e)))
                }
                
                // Wait before retrying (exponential backoff)
                if (attempt < maxAttempts - 1) {
                    kotlinx.coroutines.delay(RETRY_DELAY_MS * (attempt + 1))
                }
            }
        }
        
        return Result.failure(
            lastException ?: Exception("Operation failed after $maxAttempts attempts")
        )
    }
    
    /**
     * Parses Server-Sent Events response to extract agent responses
     * @param responseBody The response body containing SSE data
     * @return Parsed agent response with agent name and text
     */
    private fun parseSSEResponse(responseBody: ResponseBody): AgentResponse {
        return try {
            Logger.d(Logger.Tags.API, "Starting SSE response parsing...")
            Logger.d(Logger.Tags.API, "Response content type: ${responseBody.contentType()}")
            Logger.d(Logger.Tags.API, "Response content length: ${responseBody.contentLength()}")
            
            val reader = BufferedReader(responseBody.charStream())
            var finalResponse = ""
            var currentAgent = ""
            var lineCount = 0
            
            reader.use { bufferedReader ->
                val startTime = System.currentTimeMillis()
                val maxParsingTime = 5 * 60 * 1000 // 5 minutes max
                
                bufferedReader.lineSequence().forEach { line ->
                    lineCount++
                    Logger.v(Logger.Tags.API, "SSE Line $lineCount: $line")
                    
                    // Check for timeout during parsing
                    if (System.currentTimeMillis() - startTime > maxParsingTime) {
                        Logger.w(Logger.Tags.API, "SSE parsing timeout after 5 minutes, stopping")
                        return@forEach
                    }
                    
                    when {
                        line.startsWith("data: ") -> {
                            val data = line.substring(6) // Remove "data: " prefix
                            Logger.d(Logger.Tags.API, "Processing SSE data: ${data.take(200)}${if (data.length > 200) "..." else ""}")
                            
                            if (data.trim() != "[DONE]" && data.isNotBlank()) {
                                try {
                                    // Parse JSON properly using Gson
                                    val jsonObject = JsonParser.parseString(data).asJsonObject
                                    
                                    // Extract author/agent
                                    if (jsonObject.has("author")) {
                                        val author = jsonObject.get("author").asString
                                        if (author.isNotEmpty()) {
                                            currentAgent = author
                                            Logger.d(Logger.Tags.API, "Found agent: $currentAgent")
                                        }
                                    }
                                    
                                    // Extract content from the nested structure
                                    if (jsonObject.has("content")) {
                                        val contentObj = jsonObject.getAsJsonObject("content")
                                        if (contentObj.has("parts")) {
                                            val partsArray = contentObj.getAsJsonArray("parts")
                                            
                                            for (part in partsArray) {
                                                val partObj = part.asJsonObject
                                                
                                                // Look for text content
                                                if (partObj.has("text")) {
                                                    val textContent = partObj.get("text").asString
                                                    Logger.d(Logger.Tags.API, "Extracted text content: ${textContent.take(100)}${if (textContent.length > 100) "..." else ""}")
                                                    
                                                    if (textContent.isNotBlank()) {
                                                        // Replace with the latest text content (final response)
                                                        finalResponse = textContent
                                                        Logger.d(Logger.Tags.API, "Updated final response with text content: ${textContent.take(50)}...")
                                                    }
                                                }
                                                
                                                // Look for function responses
                                                if (partObj.has("functionResponse")) {
                                                    val funcResponse = partObj.getAsJsonObject("functionResponse")
                                                    if (funcResponse.has("response")) {
                                                        val responseObj = funcResponse.getAsJsonObject("response")
                                                        if (responseObj.has("result")) {
                                                            val resultText = responseObj.get("result").asString
                                                            Logger.d(Logger.Tags.API, "Extracted function response: ${resultText.take(100)}${if (resultText.length > 100) "..." else ""}")
                                                            
                                                            if (resultText.isNotBlank()) {
                                                                // Replace with the latest function response (final response)
                                                                finalResponse = resultText
                                                                Logger.d(Logger.Tags.API, "Updated final response with function result: ${resultText.take(50)}...")
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                } catch (e: Exception) {
                                    Logger.w(Logger.Tags.API, "JSON parsing failed for SSE data, treating as plain text", e)
                                    // If JSON parsing fails, treat as plain text
                                    if (data.isNotBlank()) {
                                        finalResponse = data
                                        Logger.d(Logger.Tags.API, "Updated final response with plain text: ${data.take(50)}...")
                                    }
                                }
                            } else if (data.trim() == "[DONE]") {
                                Logger.d(Logger.Tags.API, "SSE stream completed with [DONE] marker")
                            }
                        }
                        line.startsWith("event: ") -> {
                            // Handle event types if needed
                            val eventType = line.substring(7)
                            Logger.d(Logger.Tags.API, "SSE Event: $eventType")
                            if (eventType == "error") {
                                Logger.e(Logger.Tags.API, "Server sent error event")
                                throw Exception("Server sent error event")
                            }
                        }
                        line.isEmpty() -> {
                            Logger.v(Logger.Tags.API, "SSE: Empty line (event separator)")
                        }
                        else -> {
                            Logger.v(Logger.Tags.API, "SSE: Unknown line format: $line")
                        }
                    }
                }
            }
            
            Logger.i(Logger.Tags.API, "SSE parsing completed. Total lines: $lineCount, Response length: ${finalResponse.length}")
            Logger.d(Logger.Tags.API, "Final parsed response: ${finalResponse.take(300)}${if (finalResponse.length > 300) "..." else ""}")
            
            // Return AgentResponse with agent name and text
            val responseText = if (finalResponse.isEmpty()) {
                Logger.w(Logger.Tags.API, "SSE parsing resulted in empty response")
                "No response received from server"
            } else {
                finalResponse.trim()
            }
            
            AgentResponse(
                agentName = currentAgent.takeIf { it.isNotEmpty() },
                text = responseText
            )
        } catch (e: Exception) {
            Logger.logApiError("parseSSEResponse", e, "Failed to parse SSE response")
            throw Exception("Failed to parse server response: ${e.message}")
        }
    }
}