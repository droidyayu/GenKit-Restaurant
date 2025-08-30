package com.genkit.restaurant

import com.genkit.restaurant.data.api.ApiService
import com.genkit.restaurant.data.model.*
import com.genkit.restaurant.data.repository.ChatRepository
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import okhttp3.ResponseBody
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.kotlin.whenever
import org.mockito.kotlin.any
import retrofit2.Response

/**
 * Test API integration with real backend scenarios
 */
@ExperimentalCoroutinesApi
class ApiIntegrationTest {

    @Mock
    private lateinit var mockApiService: ApiService

    @Mock
    private lateinit var mockResponseBody: ResponseBody

    private lateinit var chatRepository: ChatRepository

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        chatRepository = ChatRepository(mockApiService)
    }

    @Test
    fun `test successful session creation with backend`() = runTest {
        // Given
        val userId = "testuser123"
        val sessionId = "session123"
        val mockResponse = Response.success(SessionResponse("success", sessionId))

        whenever(mockApiService.createSession(userId, any(), any())).thenReturn(mockResponse)

        // When
        val result = chatRepository.createSession(userId)

        // Then
        assertTrue("Session creation should succeed", result.isSuccess)
        val sessionData = result.getOrNull()
        assertNotNull("Session data should not be null", sessionData)
        assertEquals("User ID should match", userId, sessionData?.userId)
        assertEquals("App name should be set", "restaurant-chat", sessionData?.appName)
    }

    @Test
    fun `test session creation with API error`() = runTest {
        // Given
        val userId = "testuser123"
        val errorResponse = Response.error<SessionResponse>(400, mockResponseBody)

        whenever(mockApiService.createSession(userId, any(), any())).thenReturn(errorResponse)

        // When
        val result = chatRepository.createSession(userId)

        // Then
        assertTrue("Session creation should fail", result.isFailure)
        val exception = result.exceptionOrNull()
        assertNotNull("Exception should not be null", exception)
    }

    @Test
    fun `test message sending with SSE response parsing`() = runTest {
        // Given
        val sessionData = SessionData("testuser", "session123", "restaurant-chat")
        val message = "I want to order pizza"
        val sseResponse = """
            data: {"type": "agent_response", "agent": "MenuAgent", "content": "What size pizza would you like?"}
            
            data: {"type": "agent_response", "agent": "ChefAgent", "content": "We have margherita and pepperoni available."}
            
        """.trimIndent()

        whenever(mockResponseBody.string()).thenReturn(sseResponse)
        val mockResponse = Response.success(mockResponseBody)
        whenever(mockApiService.sendMessage(any(), any())).thenReturn(mockResponse)

        // When
        val result = chatRepository.sendMessage(sessionData, message)

        // Then
        assertTrue("Message sending should succeed", result.isSuccess)
        val response = result.getOrNull()
        assertNotNull("Response should not be null", response)
        assertTrue("Response should contain agent responses", response!!.contains("MenuAgent"))
        assertTrue("Response should contain agent responses", response.contains("ChefAgent"))
    }

    @Test
    fun `test SSE response parsing with malformed data`() = runTest {
        // Given
        val sessionData = SessionData("testuser", "session123", "restaurant-chat")
        val message = "test message"
        val malformedSseResponse = """
            data: invalid json
            
            data: {"incomplete": 
            
            data: {"type": "agent_response", "agent": "MenuAgent", "content": "Valid response"}
            
        """.trimIndent()

        whenever(mockResponseBody.string()).thenReturn(malformedSseResponse)
        val mockResponse = Response.success(mockResponseBody)
        whenever(mockApiService.sendMessage(any(), any())).thenReturn(mockResponse)

        // When
        val result = chatRepository.sendMessage(sessionData, message)

        // Then
        assertTrue("Message sending should handle malformed data gracefully", result.isSuccess)
        val response = result.getOrNull()
        assertNotNull("Response should not be null", response)
        assertTrue("Should extract valid responses", response!!.contains("Valid response"))
    }

    @Test
    fun `test network timeout handling`() = runTest {
        // Given
        val userId = "testuser123"
        whenever(mockApiService.createSession(userId, any(), any()))
            .thenThrow(java.net.SocketTimeoutException("Connection timeout"))

        // When
        val result = chatRepository.createSession(userId)

        // Then
        assertTrue("Should handle timeout gracefully", result.isFailure)
        val exception = result.exceptionOrNull()
        assertTrue("Should be timeout exception", exception is java.net.SocketTimeoutException)
    }

    @Test
    fun `test API request format validation`() {
        // Given
        val sessionData = SessionData("testuser", "session123", "restaurant-chat")
        val message = "Test message"

        // When
        val apiRequest = ApiRequest(
            appName = sessionData.appName,
            userId = sessionData.userId,
            sessionId = sessionData.sessionId,
            newMessage = MessagePart(
                parts = listOf(TextPart(message)),
                role = "user"
            ),
            streaming = false
        )

        // Then
        assertEquals("App name should match", sessionData.appName, apiRequest.appName)
        assertEquals("User ID should match", sessionData.userId, apiRequest.userId)
        assertEquals("Session ID should match", sessionData.sessionId, apiRequest.sessionId)
        assertEquals("Message should match", message, apiRequest.newMessage.parts[0].text)
        assertEquals("Role should be user", "user", apiRequest.newMessage.role)
        assertFalse("Streaming should be false", apiRequest.streaming)
    }
}

// Mock response class for testing
data class SessionResponse(
    val status: String,
    val sessionId: String
)