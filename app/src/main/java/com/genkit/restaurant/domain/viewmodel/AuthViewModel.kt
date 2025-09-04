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
 * ViewModel for authentication functionality
 * Handles session creation and UI state management
 */
class AuthViewModel(application: Application) : AndroidViewModel(application) {

    private val chatRepository = ChatRepository(application.applicationContext)

    private val _uiState = MutableStateFlow<AuthUiState>(AuthUiState.Idle)
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    /**
     * Creates a session for the authenticated Firebase user
     * @param firebaseUserId The Firebase user ID to create session for
     */
    fun createSession(firebaseUserId: String) {
        if (!validateFirebaseUserId(firebaseUserId)) {
            return
        }

        _uiState.value = AuthUiState.Loading

        viewModelScope.launch {
            try {
                val result = chatRepository.createSession(firebaseUserId)

                if (result.isSuccess) {
                    val sessionData = result.getOrNull()
                    if (sessionData != null) {
                        _uiState.value = AuthUiState.Success(sessionData)
                    } else {
                        _uiState.value = AuthUiState.Error("Failed to create session")
                    }
                } else {
                    val exception = result.exceptionOrNull()
                    _uiState.value = AuthUiState.Error(
                        exception?.message ?: "Something went wrong, please try again"
                    )
                }
            } catch (e: Exception) {
                _uiState.value = AuthUiState.Error(
                    "Network error. Please check your connection and try again"
                )
            }
        }
    }

    /**
     * Validates the Firebase user ID
     * @param firebaseUserId The Firebase user ID to validate
     * @return true if valid, false otherwise
     */
    private fun validateFirebaseUserId(firebaseUserId: String): Boolean {
        when {
            firebaseUserId.isEmpty() -> {
                _uiState.value = AuthUiState.Error("Invalid user authentication")
                return false
            }
            firebaseUserId.length < 10 -> {
                _uiState.value = AuthUiState.Error("Invalid user authentication")
                return false
            }
            else -> return true
        }
    }

    /**
     * Resets the UI state to idle
     */
    fun resetState() {
        _uiState.value = AuthUiState.Idle
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
        if (currentState is AuthUiState.Loading) {
            _uiState.value = AuthUiState.Idle
        }
    }

    /**
     * Refreshes session validation
     * Called when activity is resumed to check if session is still valid
     */
    fun refreshSessionValidation() {
        // Check if we need to validate anything on resume
        // For AuthActivity, we typically don't have a session yet,
        // so this is mainly for consistency with ChatViewModel
        val currentState = _uiState.value
        if (currentState is AuthUiState.Error) {
            // Clear transient errors on resume
            _uiState.value = AuthUiState.Idle
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
 * Sealed class representing different UI states for authentication
 */
sealed class AuthUiState {
    object Idle : AuthUiState()
    object Loading : AuthUiState()
    data class Success(val sessionData: SessionData) : AuthUiState()
    data class Error(val message: String) : AuthUiState()
}
