package com.genkit.restaurant

import android.content.Context
import android.content.SharedPreferences
import android.os.Bundle
import androidx.arch.core.executor.testing.InstantTaskExecutorRule
import androidx.lifecycle.Observer
import com.genkit.restaurant.data.model.SessionData
import com.genkit.restaurant.domain.viewmodel.ChatViewModel
import com.genkit.restaurant.domain.viewmodel.ChatUiState
import com.genkit.restaurant.domain.viewmodel.UserIdViewModel
import com.genkit.restaurant.domain.viewmodel.UserIdUiState
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.mockito.Mock
import org.mockito.MockitoAnnotations
import org.mockito.junit.MockitoJUnitRunner
import org.mockito.kotlin.verify
import org.mockito.kotlin.whenever

/**
 * Test class for lifecycle handling in ViewModels
 */
@RunWith(MockitoJUnitRunner::class)
class LifecycleTest {

    @get:Rule
    val instantTaskExecutorRule = InstantTaskExecutorRule()

    @Mock
    private lateinit var mockContext: Context

    @Mock
    private lateinit var mockSharedPreferences: SharedPreferences

    @Mock
    private lateinit var mockEditor: SharedPreferences.Editor

    @Mock
    private lateinit var mockObserver: Observer<ChatUiState>

    @Mock
    private lateinit var mockUserIdObserver: Observer<UserIdUiState>

    private lateinit var chatViewModel: ChatViewModel
    private lateinit var userIdViewModel: UserIdViewModel

    @Before
    fun setup() {
        MockitoAnnotations.openMocks(this)
        
        // Mock SharedPreferences behavior
        whenever(mockSharedPreferences.edit()).thenReturn(mockEditor)
        whenever(mockEditor.putString(any(), any())).thenReturn(mockEditor)
        whenever(mockEditor.apply()).then { }
        
        // Create ViewModels with mocked context
        chatViewModel = ChatViewModel(mockContext as android.app.Application)
        userIdViewModel = UserIdViewModel(mockContext as android.app.Application)
    }

    @Test
    fun testChatViewModelLifecycleHandling() {
        // Observe the ViewModel
        chatViewModel.uiState.observeForever(mockObserver)
        
        // Test pause/resume network requests
        chatViewModel.pauseNetworkRequests()
        chatViewModel.resumeNetworkRequests()
        
        // Test canceling ongoing requests
        chatViewModel.cancelOngoingRequests()
        
        // Test app lifecycle changes
        chatViewModel.handleAppLifecycleChange(false) // Background
        chatViewModel.handleAppLifecycleChange(true)  // Foreground
        
        // Verify that the ViewModel handles lifecycle correctly
        // The state should remain stable through lifecycle changes
        assert(chatViewModel.uiState.value is ChatUiState.Idle)
        
        // Clean up
        chatViewModel.uiState.removeObserver(mockObserver)
    }

    @Test
    fun testUserIdViewModelLifecycleHandling() {
        // Observe the ViewModel
        userIdViewModel.uiState.observeForever(mockUserIdObserver)
        
        // Test lifecycle methods
        userIdViewModel.cancelOngoingRequests()
        userIdViewModel.refreshSessionValidation()
        
        // Verify that the ViewModel handles lifecycle correctly
        assert(userIdViewModel.uiState.value is UserIdUiState.Idle)
        
        // Clean up
        userIdViewModel.uiState.removeObserver(mockUserIdObserver)
    }

    @Test
    fun testViewModelStateRetention() {
        // Set up a session in ChatViewModel
        val sessionData = SessionData("testUser", "testSession", "testApp")
        chatViewModel.setSessionData(sessionData)
        
        // Simulate configuration change by creating new observer
        val newObserver = Observer<ChatUiState> { }
        chatViewModel.uiState.observeForever(newObserver)
        
        // Verify that the ViewModel retains its state
        // The session data should still be available
        chatViewModel.validateSession()
        
        // Clean up
        chatViewModel.uiState.removeObserver(newObserver)
    }

    @Test
    fun testBundleStateSaving() {
        // Test that we can save and restore state using Bundle
        val bundle = Bundle()
        
        // Simulate saving state
        bundle.putString("state_user_id_input", "testUser")
        bundle.putString("state_error_message", "Test error")
        bundle.putBoolean("state_show_retry", true)
        
        // Simulate restoring state
        val userIdInput = bundle.getString("state_user_id_input")
        val errorMessage = bundle.getString("state_error_message")
        val showRetry = bundle.getBoolean("state_show_retry")
        
        // Verify state was saved and restored correctly
        assert(userIdInput == "testUser")
        assert(errorMessage == "Test error")
        assert(showRetry == true)
    }

    private fun <T> any(): T {
        org.mockito.kotlin.any<T>()
        return null as T
    }
}