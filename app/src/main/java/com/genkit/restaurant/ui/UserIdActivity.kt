package com.genkit.restaurant.ui

import android.content.Context
import android.content.Intent
import android.content.SharedPreferences
import android.content.res.Configuration
import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.EditText
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import com.genkit.restaurant.R
import com.genkit.restaurant.domain.viewmodel.UserIdViewModel
import com.genkit.restaurant.domain.viewmodel.UserIdUiState

class UserIdActivity : AppCompatActivity() {
    
    private lateinit var editTextUserId: EditText
    private lateinit var buttonStart: Button
    private lateinit var buttonRetry: Button
    private lateinit var progressBar: ProgressBar
    private lateinit var textViewError: TextView
    private lateinit var sharedPreferences: SharedPreferences
    private lateinit var viewModel: UserIdViewModel
    
    companion object {
        private const val PREFS_NAME = "restaurant_chat_prefs"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_SESSION_ID = "session_id"
        private const val KEY_APP_NAME = "app_name"
        
        // Keys for saving instance state
        private const val STATE_USER_ID_INPUT = "state_user_id_input"
        private const val STATE_ERROR_MESSAGE = "state_error_message"
        private const val STATE_SHOW_RETRY = "state_show_retry"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_user_id)
        
        initializeViews()
        initializeComponents()
        setupClickListeners()
        observeViewModel()
        
        // Restore state if available
        restoreInstanceState(savedInstanceState)
    }
    
    private fun initializeViews() {
        editTextUserId = findViewById(R.id.editTextUserId)
        buttonStart = findViewById(R.id.buttonStart)
        buttonRetry = findViewById(R.id.buttonRetry)
        progressBar = findViewById(R.id.progressBar)
        textViewError = findViewById(R.id.textViewError)
    }
    
    private fun initializeComponents() {
        sharedPreferences = getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        viewModel = ViewModelProvider(this)[UserIdViewModel::class.java]
    }
    
    private fun setupClickListeners() {
        buttonStart.setOnClickListener {
            val userId = editTextUserId.text.toString().trim()
            viewModel.createSession(userId)
        }
        
        buttonRetry.setOnClickListener {
            val userId = editTextUserId.text.toString().trim()
            viewModel.createSession(userId)
        }
    }
    
    private fun observeViewModel() {
        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                when (state) {
                    is UserIdUiState.Idle -> {
                        setLoadingState(false)
                        hideError()
                        hideRetryButton()
                    }
                    is UserIdUiState.Loading -> {
                        setLoadingState(true)
                        hideError()
                        hideRetryButton()
                    }
                    is UserIdUiState.Success -> {
                        setLoadingState(false)
                        hideError()
                        hideRetryButton()
                        saveSessionData(state.sessionData.userId, state.sessionData.sessionId, state.sessionData.appName)
                        navigateToChatActivity()
                    }
                    is UserIdUiState.Error -> {
                        setLoadingState(false)
                        showError(state.message)
                        showRetryButton()
                    }
                }
            }
        }
    }
    

    
    private fun saveSessionData(userId: String, sessionId: String, appName: String) {
        sharedPreferences.edit().apply {
            putString(KEY_USER_ID, userId)
            putString(KEY_SESSION_ID, sessionId)
            putString(KEY_APP_NAME, appName)
            apply()
        }
    }
    
    private fun navigateToChatActivity() {
        val intent = Intent(this, ChatActivity::class.java)
        startActivity(intent)
        finish() // Close UserIdActivity so user can't go back
    }
    
    private fun setLoadingState(isLoading: Boolean) {
        if (isLoading) {
            progressBar.visibility = View.VISIBLE
            buttonStart.isEnabled = false
            buttonRetry.isEnabled = false
            editTextUserId.isEnabled = false
        } else {
            progressBar.visibility = View.GONE
            buttonStart.isEnabled = true
            buttonRetry.isEnabled = true
            editTextUserId.isEnabled = true
        }
    }
    
    private fun showError(message: String) {
        textViewError.text = message
        textViewError.visibility = View.VISIBLE
    }
    
    private fun hideError() {
        textViewError.visibility = View.GONE
    }
    
    private fun showRetryButton() {
        buttonRetry.visibility = View.VISIBLE
        buttonStart.visibility = View.GONE
    }
    
    private fun hideRetryButton() {
        buttonRetry.visibility = View.GONE
        buttonStart.visibility = View.VISIBLE
    }
    
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        
        // Save current user input
        outState.putString(STATE_USER_ID_INPUT, editTextUserId.text.toString())
        
        // Save error state
        if (textViewError.visibility == View.VISIBLE) {
            outState.putString(STATE_ERROR_MESSAGE, textViewError.text.toString())
        }
        
        // Save retry button state
        outState.putBoolean(STATE_SHOW_RETRY, buttonRetry.visibility == View.VISIBLE)
    }
    
    private fun restoreInstanceState(savedInstanceState: Bundle?) {
        savedInstanceState?.let { state ->
            // Restore user input
            val userIdInput = state.getString(STATE_USER_ID_INPUT)
            if (!userIdInput.isNullOrEmpty()) {
                editTextUserId.setText(userIdInput)
                // Set cursor to end of text
                editTextUserId.setSelection(userIdInput.length)
            }
            
            // Restore error message
            val errorMessage = state.getString(STATE_ERROR_MESSAGE)
            if (!errorMessage.isNullOrEmpty()) {
                showError(errorMessage)
            }
            
            // Restore retry button state
            val showRetry = state.getBoolean(STATE_SHOW_RETRY, false)
            if (showRetry) {
                showRetryButton()
            }
        }
    }
    
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        
        // Handle configuration changes (like rotation)
        // ViewModels automatically retain their state, so we don't need to do anything special
        // The UI will be recreated and the ViewModel will provide the current state
    }
    
    override fun onPause() {
        super.onPause()
        
        // Cancel any ongoing network requests when activity is paused
        // This prevents memory leaks and unnecessary network usage
        viewModel.cancelOngoingRequests()
    }
    
    override fun onResume() {
        super.onResume()
        
        // Check if we need to refresh the session validation
        // This handles cases where the app was in background for a long time
        viewModel.refreshSessionValidation()
    }
}