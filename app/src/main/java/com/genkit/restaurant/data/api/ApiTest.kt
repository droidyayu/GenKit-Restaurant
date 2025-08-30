package com.genkit.restaurant.data.api

import android.content.Context
import com.genkit.restaurant.data.repository.ChatRepository
import kotlinx.coroutines.runBlocking

/**
 * Simple test class to verify API connectivity
 * Remove this file after testing
 */
class ApiTest(private val context: Context) {
    
    private val chatRepository = ChatRepository(context)
    
    /**
     * Test backend connectivity
     */
    fun testBackendHealth(): Boolean {
        return runBlocking {
            try {
                val result = chatRepository.checkBackendHealth()
                result.getOrDefault(false)
            } catch (e: Exception) {
                println("Health check failed: ${e.message}")
                false
            }
        }
    }
    
    /**
     * Test session creation
     */
    fun testCreateSession(userId: String = "test-user"): Boolean {
        return runBlocking {
            try {
                val result = chatRepository.createSession(userId)
                result.isSuccess
            } catch (e: Exception) {
                println("Session creation failed: ${e.message}")
                false
            }
        }
    }
}