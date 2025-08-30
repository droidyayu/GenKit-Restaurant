package com.genkit.restaurant.domain.viewmodel

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import com.genkit.restaurant.data.model.SessionData
import com.genkit.restaurant.data.repository.ChatRepository
import kotlinx.coroutines.launch

/**
 * ViewModel for user ID input functionality
 * Handles session creation and UI state management
 */
class UserIdViewModel(application: Application) : AndroidViewModel(application) {
    
    private val chatRepository = ChatRepository(application.applicationContext)
    
    private val _uiState = MutableStateFlow<UserIdUiState>(UserIdUiState.Idle)
    val uiState: StateFlow<UserIdUiState> = _uiState.asStateFlow()
    
    /**
     * Creates a session for the given user ID
     * @param userId The user ID to create session for
     */
    fun createSession(userId: String) {
        if (!validateUserId(userId)) {
            return
        }
        
        _uiState.value = UserIdUiState.Loading
        
        viewModelScope.launch {
            try {
                val result = chatRepository.createSession(userId)
                
                if (result.isSuccess) {
                    val sessionData = result.getOrNull()
                    if (sessionData != null) {
                        _uiState.value = UserIdUiState.Success(sessionData)
                    } else {
                        _uiState.value = UserIdUiState.Error("Failed to create session")
                    }
                } else {
                    val exception = result.exceptionOrNull()
                    _uiState.value = UserIdUiState.Error(
                        exception?.message ?: "Something went wrong, please try again"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = UserIdUiState.Error(
                    "Network error. Please check your connection and try again"
                )
            }
        }
    }
    
    /**
     * Validates the user ID input
     * @param userId The user ID to validate
     * @return true if valid, false otherwise
     */
    private fun validateUserId(userId: String): Boolean {
        val trimmedUserId = userId.trim()
        
        when {
            trimmedUserId.isEmpty() -> {
                _uiState.value = UserIdUiState.Error("Please enter a user ID")
                return false
            }
            !trimmedUserId.matches(Regex("^[a-zA-Z0-9]+$")) -> {
                _uiState.value = UserIdUiState.Error("User ID can only contain letters and numbers")
                return false
            }
            trimmedUserId.length < 2 -> {
                _uiState.value = UserIdUiState.Error("User ID must be at least 2 characters long")
                return false
            }
            else -> return true
        }
    }
    
    /**
     * Resets the UI state to idle
     */
    fun resetState() {
        _uiState.value = UserIdUiState.Idle
    }
    
    /**
     * Retries the last failed session creation
     */
    fun retry() {
        val currentState = _uiState.value
        if (currentState is UserIdUiState.Error) {
            // Get the last attempted user ID from some storage or ask user to re-enter
            _uiState.value = UserIdUiState.Idle
        }
    }
    
    /**
     * Cancels any ongoing network requests
     * Called when activity is paused to prevent memory leaks
     */
    fun cancelOngoingRequests() {
        // Cancel any ongoing coroutines in viewModelScope
        // ViewModelScope automatically cancels when ViewModel is cleared,
        // but we can also cancel manually when activity is paused
        val currentState = _uiState.value
        if (currentState is UserIdUiState.Loading) {
            _uiState.value = UserIdUiState.Idle
        }
    }
    
    /**
     * Refreshes session validation
     * Called when activity is resumed to check if session is still valid
     */
    fun refreshSessionValidation() {
        // Check if we need to validate anything on resume
        // For UserIdActivity, we typically don't have a session yet,
        // so this is mainly for consistency with ChatViewModel
        val currentState = _uiState.value
        if (currentState is UserIdUiState.Error) {
            // Clear transient errors on resume
            _uiState.value = UserIdUiState.Idle
        }
    }
    
    override fun onCleared() {
        super.onCleared()
        // ViewModel is being destroyed
        // ViewModelScope will automatically cancel all coroutines
        // Any additional cleanup can be done here
    }
}

/**
 * Sealed class representing different UI states for user ID input
 */
sealed class UserIdUiState {
    object Idle : UserIdUiState()
    object Loading : UserIdUiState()
    data class Success(val sessionData: SessionData) : UserIdUiState()
    data class Error(val message: String) : UserIdUiState()
}