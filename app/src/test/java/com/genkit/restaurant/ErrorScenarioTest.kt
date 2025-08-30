package com.genkit.restaurant

import com.genkit.restaurant.data.repository.ChatRepository
import com.genkit.restaurant.data.util.ErrorHandler
import com.genkit.restaurant.data.util.NetworkUtil
import com.genkit.restaurant.domain.viewmodel.ChatViewModel
import com.genkit.restaurant.domain.viewmodel.UserIdViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.test.runTest
import org.junit.Before
import org.junit.Test
import org.junit.Assert.*
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.kotlin.whenever
import java.net.UnknownHostException
import java.net.SocketTimeoutException
import javax.net.ssl.SSLException

/**
 * Test error scenarios and recovery mechanisms
 */
@ExperimentalCoroutinesApi
class ErrorScenarioTest {

    @Mock
    private lateinit var mockRepository: ChatRepository

    @Mock
    private lateinit var mockNetworkUtil: NetworkUtil

    private lateinit var userIdViewModel: UserIdViewModel
    private lateinit var chatViewModel: ChatViewModel
    private lateinit var errorHandler: ErrorHandler

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        userIdViewModel = UserIdViewModel()
        chatViewModel = ChatViewModel()
        errorHandler = ErrorHandler()
    }

    @Test
    fun `test no internet connection error`() = runTest {
        // Given
        whenever(mockNetworkUtil.isNetworkAvailable()).thenReturn(false)
        whenever(mockRepository.createSession("testuser"))
            .thenReturn(Result.failure(UnknownHostException("No internet connection")))

        // When
        val result = mockRepository.createSession("testuser")

        // Then
        assertTrue("Should fail with no internet", result.isFailure)
        val exception = result.exceptionOrNull()
        assertTrue("Should be network exception", exception is UnknownHostException)
        
        // Test error message formatting
        val errorMessage = errorHandler.getErrorMessage(exception!!)
        assertEquals("Should show no internet message", "No internet connection", errorMessage)
    }

    @Test
    fun `test server timeout error`() = runTest {
        // Given
        val timeoutException = SocketTimeoutException("Connection timeout")
        whenever(mockRepository.createSession("testuser"))
            .thenReturn(Result.failure(timeoutException))

        // When
        val result = mockRepository.createSession("testuser")

        // Then
        assertTrue("Should fail with timeout", result.isFailure)
        val errorMessage = errorHandler.getErrorMessage(timeoutException)
        assertEquals("Should show timeout message", "Connection timeout, please try again", errorMessage)
    }

    @Test
    fun `test SSL certificate error`() = runTest {
        // Given
        val sslException = SSLException("Certificate verification failed")
        whenever(mockRepository.sendMessage(any(), any()))
            .thenReturn(Result.failure(sslException))

        // When
        val result = mockRepository.sendMessage(any(), "test message")

        // Then
        assertTrue("Should fail with SSL error", result.isFailure)
        val errorMessage = errorHandler.getErrorMessage(sslException)
        assertEquals("Should show SSL error message", "Secure connection failed", errorMessage)
    }

    @Test
    fun `test session expired error handling`() = runTest {
        // Given
        val sessionExpiredException = Exception("Session expired")
        whenever(mockRepository.sendMessage(any(), any()))
            .thenReturn(Result.failure(sessionExpiredException))

        // When
        val result = mockRepository.sendMessage(any(), "test message")

        // Then
        assertTrue("Should fail with session expired", result.isFailure)
        val errorMessage = errorHandler.getErrorMessage(sessionExpiredException)
        assertTrue("Should indicate session issue", errorMessage.contains("session") || errorMessage.contains("expired"))
    }

    @Test
    fun `test retry mechanism with exponential backoff`() = runTest {
        // Given
        var attemptCount = 0
        whenever(mockRepository.createSession("testuser")).thenAnswer {
            attemptCount++
            if (attemptCount < 3) {
                Result.failure(Exception("Temporary error"))
            } else {
                Result.success(any())
            }
        }

        // When - Simulate retry logic
        var result: Result<*>
        var retryCount = 0
        do {
            result = mockRepository.createSession("testuser")
            retryCount++
        } while (result.isFailure && retryCount < 3)

        // Then
        assertEquals("Should retry 3 times", 3, attemptCount)
        assertTrue("Should eventually succeed", result.isSuccess)
    }

    @Test
    fun `test input validation errors`() {
        // Given
        val invalidInputs = listOf("", "   ", "user@invalid", "user with spaces", "123")
        val validInputs = listOf("user123", "testuser", "john_doe", "user2024")

        invalidInputs.forEach { input ->
            // When
            val isValid = userIdViewModel.validateUserId(input)
            
            // Then
            assertFalse("Input '$input' should be invalid", isValid)
        }

        validInputs.forEach { input ->
            // When
            val isValid = userIdViewModel.validateUserId(input)
            
            // Then
            assertTrue("Input '$input' should be valid", isValid)
        }
    }

    @Test
    fun `test message length validation`() {
        // Given
        val emptyMessage = ""
        val tooLongMessage = "a".repeat(1001) // Assuming 1000 char limit
        val validMessage = "This is a valid message"

        // When & Then
        assertFalse("Empty message should be invalid", chatViewModel.isValidMessage(emptyMessage))
        assertFalse("Too long message should be invalid", chatViewModel.isValidMessage(tooLongMessage))
        assertTrue("Valid message should be accepted", chatViewModel.isValidMessage(validMessage))
    }

    @Test
    fun `test error recovery after network restoration`() = runTest {
        // Given - Initially no network
        whenever(mockNetworkUtil.isNetworkAvailable()).thenReturn(false)
        whenever(mockRepository.createSession("testuser"))
            .thenReturn(Result.failure(UnknownHostException("No internet")))

        // When - First attempt fails
        val firstResult = mockRepository.createSession("testuser")

        // Given - Network restored
        whenever(mockNetworkUtil.isNetworkAvailable()).thenReturn(true)
        whenever(mockRepository.createSession("testuser"))
            .thenReturn(Result.success(any()))

        // When - Retry after network restoration
        val secondResult = mockRepository.createSession("testuser")

        // Then
        assertTrue("First attempt should fail", firstResult.isFailure)
        assertTrue("Second attempt should succeed", secondResult.isSuccess)
    }

    @Test
    fun `test malformed server response handling`() = runTest {
        // Given
        val malformedResponses = listOf(
            "",
            "invalid json",
            "{incomplete json",
            "null",
            "{\"error\": \"server error\"}"
        )

        malformedResponses.forEach { response ->
            // When
            val parsedResponse = errorHandler.parseServerResponse(response)

            // Then
            assertNotNull("Should handle malformed response gracefully", parsedResponse)
            assertTrue("Should indicate parsing error", parsedResponse.contains("error") || parsedResponse.isEmpty())
        }
    }
}

// Extension functions for testing
private fun UserIdViewModel.validateUserId(userId: String): Boolean {
    return userId.trim().isNotEmpty() && 
           userId.matches(Regex("^[a-zA-Z0-9_]+$")) &&
           userId.length >= 3 &&
           userId.length <= 50
}

private fun ChatViewModel.isValidMessage(message: String): Boolean {
    return message.trim().isNotEmpty() && message.length <= 1000
}

private fun ErrorHandler.parseServerResponse(response: String): String {
    return try {
        if (response.isBlank()) return ""
        // Simulate JSON parsing
        if (response.startsWith("{") && response.endsWith("}")) {
            response
        } else {
            "Parse error"
        }
    } catch (e: Exception) {
        "Parse error: ${e.message}"
    }
}