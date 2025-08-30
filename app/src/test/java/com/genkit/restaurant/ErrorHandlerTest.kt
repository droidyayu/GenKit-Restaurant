package com.genkit.restaurant

import com.genkit.restaurant.data.util.ErrorHandler
import org.junit.Test
import org.junit.Assert.*
import java.io.IOException
import java.net.SocketTimeoutException
import java.net.UnknownHostException

/**
 * Test class for ErrorHandler utility
 */
class ErrorHandlerTest {

    @Test
    fun testGetErrorMessage_UnknownHostException() {
        val exception = UnknownHostException("Host not found")
        val message = ErrorHandler.getErrorMessage(exception)
        assertEquals("No internet connection. Please check your network and try again.", message)
    }

    @Test
    fun testGetErrorMessage_SocketTimeoutException() {
        val exception = SocketTimeoutException("Timeout")
        val message = ErrorHandler.getErrorMessage(exception)
        assertEquals("Request timed out. Please check your connection and try again.", message)
    }

    @Test
    fun testGetErrorMessage_IOException() {
        val exception = IOException("Network error")
        val message = ErrorHandler.getErrorMessage(exception)
        assertEquals("Network error. Please check your connection and try again.", message)
    }

    @Test
    fun testGetHttpErrorMessage() {
        assertEquals("Authentication failed. Please restart the app.", ErrorHandler.getHttpErrorMessage(401))
        assertEquals("Service not found. Please try again later.", ErrorHandler.getHttpErrorMessage(404))
        assertEquals("Server error. Please try again later.", ErrorHandler.getHttpErrorMessage(500))
    }

    @Test
    fun testIsRetryableError() {
        assertTrue(ErrorHandler.isRetryableError(UnknownHostException()))
        assertTrue(ErrorHandler.isRetryableError(SocketTimeoutException()))
        assertTrue(ErrorHandler.isRetryableError(IOException()))
        assertFalse(ErrorHandler.isRetryableError(IllegalArgumentException()))
    }

    @Test
    fun testIsSessionExpiredError() {
        // This would need a mock HttpException for proper testing
        // For now, just test with regular exceptions
        assertFalse(ErrorHandler.isSessionExpiredError(IOException()))
        assertFalse(ErrorHandler.isSessionExpiredError(RuntimeException()))
    }
}