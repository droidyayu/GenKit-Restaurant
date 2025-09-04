package com.genkit.restaurant.ui

import android.content.Context
import android.content.Intent
import android.content.res.Configuration
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.View
import android.view.inputmethod.InputMethodManager
import android.widget.Button
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ProgressBar
import android.widget.TextView
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.lifecycleScope
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import kotlinx.coroutines.launch
import com.genkit.restaurant.R
import com.genkit.restaurant.data.model.SessionData
import com.genkit.restaurant.domain.viewmodel.ChatViewModel
import com.genkit.restaurant.domain.viewmodel.ChatUiState
import com.genkit.restaurant.util.Logger
import com.google.firebase.auth.FirebaseAuth

/**
 * Main chat activity for communicating with restaurant agents
 */
class ChatActivity : AppCompatActivity() {
    
    private lateinit var viewModel: ChatViewModel
    private lateinit var messageAdapter: MessageAdapter
    private lateinit var firebaseAuth: FirebaseAuth
    
    // UI components
    private lateinit var recyclerViewMessages: RecyclerView
    private lateinit var editTextMessage: EditText
    private lateinit var buttonSend: ImageButton
    private lateinit var buttonRetry: Button
    private lateinit var buttonCancel: Button
    private lateinit var buttonNewOrder: Button
    private lateinit var textViewStatus: TextView
    private lateinit var textViewWelcomeUser: TextView
    private lateinit var textViewHeaderUser: TextView
    private lateinit var textViewHeaderStatus: TextView
    private lateinit var welcomeContainer: View
    private lateinit var progressBarHeader: ProgressBar
    private lateinit var progressBarLoading: ProgressBar
    
    companion object {
        // Keys for saving instance state
        private const val STATE_MESSAGE_INPUT = "state_message_input"
        private const val STATE_SCROLL_POSITION = "state_scroll_position"
        private const val STATE_STATUS_MESSAGE = "state_status_message"
        private const val STATE_STATUS_VISIBLE = "state_status_visible"
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Logger.logLifecycle("ChatActivity", "onCreate", "Starting chat activity initialization")

        setContentView(R.layout.activity_chat)

        // Setup custom action bar with back button
        setupActionBar()

        // Initialize Firebase Auth
        firebaseAuth = FirebaseAuth.getInstance()
        Logger.d(Logger.Tags.UI, "FirebaseAuth initialized")

        // Initialize ViewModel
        viewModel = ViewModelProvider(this)[ChatViewModel::class.java]
        Logger.d(Logger.Tags.UI, "ChatViewModel initialized")
        
        // Initialize UI components
        initializeViews()
        Logger.d(Logger.Tags.UI, "UI components initialized")
        
        // Setup RecyclerView
        setupRecyclerView()
        Logger.d(Logger.Tags.UI, "RecyclerView setup completed")
        
        // Setup click listeners
        setupClickListeners()
        Logger.d(Logger.Tags.UI, "Click listeners setup completed")
        
        // Observe ViewModel
        observeViewModel()
        Logger.d(Logger.Tags.UI, "ViewModel observers setup completed")
        
        // Load session data and initialize chat
        loadSessionData()
        
        // Restore state if available
        restoreInstanceState(savedInstanceState)
        
        Logger.logLifecycle("ChatActivity", "onCreate", "Chat activity initialization completed")
    }
    
    /**
     * Initialize all UI components
     */
    private fun initializeViews() {
        recyclerViewMessages = findViewById(R.id.recyclerViewMessages)
        editTextMessage = findViewById(R.id.editTextMessage)
        buttonSend = findViewById(R.id.buttonSend)
        buttonRetry = findViewById(R.id.buttonRetry)
        buttonCancel = findViewById(R.id.buttonCancel)
        buttonNewOrder = findViewById(R.id.buttonNewOrder)
        textViewStatus = findViewById(R.id.textViewStatus)
        textViewWelcomeUser = findViewById(R.id.textViewWelcomeUser)
        textViewHeaderUser = findViewById(R.id.textViewHeaderUser)
        textViewHeaderStatus = findViewById(R.id.textViewHeaderStatus)
        welcomeContainer = findViewById(R.id.welcomeContainer)
        progressBarHeader = findViewById(R.id.progressBarHeader)
        progressBarLoading = findViewById(R.id.progressBarLoading)
    }
    
    /**
     * Setup RecyclerView with adapter and layout manager
     */
    private fun setupRecyclerView() {
        messageAdapter = MessageAdapter(this)
        recyclerViewMessages.apply {
            adapter = messageAdapter
            layoutManager = LinearLayoutManager(this@ChatActivity).apply {
                stackFromEnd = true // Start from bottom
            }
        }
    }
    
    /**
     * Setup click listeners for UI components
     */
    private fun setupClickListeners() {
        buttonSend.setOnClickListener {
            Logger.logUiEvent("SEND_BUTTON_CLICKED", "ChatActivity")
            sendMessage()
        }
        
        buttonRetry.setOnClickListener {
            Logger.logUiEvent("RETRY_BUTTON_CLICKED", "ChatActivity")
            viewModel.retryLastMessage()
        }
        
        buttonCancel.setOnClickListener {
            Logger.logUiEvent("CANCEL_BUTTON_CLICKED", "ChatActivity")
            viewModel.cancelCurrentRequest()
        }

        buttonNewOrder.setOnClickListener {
            Logger.logUiEvent("NEW_ORDER_BUTTON_CLICKED", "ChatActivity")
            startNewOrder()
        }
        
        // Allow sending message with Enter key
        editTextMessage.setOnEditorActionListener { _, _, _ ->
            Logger.logUiEvent("ENTER_KEY_PRESSED", "ChatActivity", "Message input")
            sendMessage()
            true
        }
    }
    
    /**
     * Observe ViewModel StateFlow for UI updates
     */
    private fun observeViewModel() {
        // Observe messages
        lifecycleScope.launch {
            viewModel.messages.collect { messages ->
                messageAdapter.updateMessages(messages)
                // Show/hide welcome screen based on messages
                if (messages.isEmpty()) {
                    welcomeContainer.visibility = View.VISIBLE
                    recyclerViewMessages.visibility = View.GONE
                } else {
                    welcomeContainer.visibility = View.GONE
                    recyclerViewMessages.visibility = View.VISIBLE
                    // Scroll to bottom when new messages arrive
                    recyclerViewMessages.scrollToPosition(messages.size - 1)
                }
            }
        }
        
        // Observe UI state
        lifecycleScope.launch {
            viewModel.uiState.collect { state ->
                updateUIState(state)
            }
        }
    }
    
    /**
     * Update UI based on current state
     */
    private fun updateUIState(state: ChatUiState) {
        when (state) {
            is ChatUiState.Idle -> {
                // Normal state - ready for input
                buttonSend.isEnabled = true
                buttonSend.visibility = View.VISIBLE
                buttonRetry.visibility = View.GONE
                buttonCancel.visibility = View.GONE
                progressBarHeader.visibility = View.GONE
                progressBarLoading.visibility = View.GONE
                textViewStatus.visibility = View.GONE
                editTextMessage.isEnabled = true
                
                // Update header status
                textViewHeaderStatus.text = "Ready to help"
                textViewHeaderStatus.setTextColor(getColor(R.color.text_secondary))
            }
            
            is ChatUiState.Loading -> {
                // Loading state - disable input, show cancel
                buttonSend.isEnabled = false
                buttonRetry.visibility = View.GONE
                buttonCancel.visibility = View.VISIBLE
                progressBarHeader.visibility = View.VISIBLE
                progressBarLoading.visibility = View.VISIBLE
                textViewStatus.visibility = View.GONE
                editTextMessage.isEnabled = false
                
                // Update header status
                textViewHeaderStatus.text = "Processing..."
                textViewHeaderStatus.setTextColor(getColor(R.color.primary))
            }
            
            is ChatUiState.Typing -> {
                // Agent is typing - show indicator
                buttonSend.isEnabled = false
                buttonRetry.visibility = View.GONE
                progressBarHeader.visibility = View.VISIBLE
                progressBarLoading.visibility = View.GONE
                textViewStatus.visibility = View.VISIBLE
                textViewStatus.text = "Agent is typing..."
                textViewStatus.setTextColor(getColor(android.R.color.darker_gray))
                editTextMessage.isEnabled = false
                
                // Update header status
                textViewHeaderStatus.text = "Agent is typing..."
                textViewHeaderStatus.setTextColor(getColor(R.color.primary))
            }
            
            is ChatUiState.Error -> {
                // Error state - show error and enable retry if retryable
                buttonSend.isEnabled = !state.isRetryable
                buttonSend.visibility = if (state.isRetryable) View.GONE else View.VISIBLE
                buttonRetry.visibility = if (state.isRetryable) View.VISIBLE else View.GONE
                progressBarHeader.visibility = View.GONE
                progressBarLoading.visibility = View.GONE
                textViewStatus.visibility = View.VISIBLE
                textViewStatus.text = state.message
                textViewStatus.setTextColor(getColor(android.R.color.holo_red_dark))
                editTextMessage.isEnabled = true
                
                // Update header status
                textViewHeaderStatus.text = "Error occurred"
                textViewHeaderStatus.setTextColor(getColor(R.color.error))
                
                // Auto-clear error after 10 seconds if retryable
                if (state.isRetryable) {
                    textViewStatus.postDelayed({
                        if (viewModel.uiState.value is ChatUiState.Error) {
                            viewModel.clearError()
                        }
                    }, 10000)
                }
            }
            
            is ChatUiState.SessionExpired -> {
                // Session expired - redirect to login
                buttonSend.isEnabled = false
                buttonRetry.visibility = View.GONE
                progressBarHeader.visibility = View.GONE
                progressBarLoading.visibility = View.GONE
                textViewStatus.visibility = View.VISIBLE
                textViewStatus.text = "Session expired. Redirecting to login..."
                textViewStatus.setTextColor(getColor(android.R.color.holo_orange_dark))
                editTextMessage.isEnabled = false
                
                // Update header status
                textViewHeaderStatus.text = "Session expired"
                textViewHeaderStatus.setTextColor(getColor(R.color.warning))
                
                // Redirect after 2 seconds
                textViewStatus.postDelayed({
                    navigateToMainActivity()
                }, 2000)
            }
        }
    }
    
    /**
     * Send message to the backend
     */
    private fun sendMessage() {
        val messageText = editTextMessage.text.toString()
        
        // Validate input
        if (messageText.isBlank()) {
            editTextMessage.error = "Please enter a message"
            return
        }
        
        // Clear input field
        editTextMessage.setText("")
        editTextMessage.clearFocus()
        
        // Send message through ViewModel
        viewModel.sendMessage(messageText)
    }
    
    /**
     * Load session data from SharedPreferences and initialize chat
     */
    private fun loadSessionData() {
        val sharedPreferences = getSharedPreferences("restaurant_chat_prefs", MODE_PRIVATE)
        
        val userId = sharedPreferences.getString("user_id", null)
        val sessionId = sharedPreferences.getString("session_id", null)
        val appName = sharedPreferences.getString("app_name", "app")
        
        if (userId != null && sessionId != null) {
            val sessionData = SessionData(
                userId = userId,
                sessionId = sessionId,
                appName = appName ?: "app"
            )
            
            // Set session data in ViewModel
            viewModel.setSessionData(sessionData)
            
            // Validate session on startup
            viewModel.validateSession()
            
            // Show welcome message
            showWelcomeMessage()
        } else {
            // No session data found - redirect to MainActivity
            navigateToMainActivity()
        }
    }
    
    /**
     * Show a welcome message when chat starts
     */
    private fun showWelcomeMessage() {
        // Get display name from Firebase Auth
        val currentUser = firebaseAuth.currentUser
        val displayName = currentUser?.displayName ?: currentUser?.email ?: "User"

        textViewWelcomeUser.text = getString(R.string.welcome_user, displayName)

        // Update header with user info
        textViewHeaderUser.text = "Chat with $displayName"
        textViewHeaderStatus.text = "Ready to help"

        // Update input hint for homepage context
        editTextMessage.hint = getString(R.string.type_message_homepage)
    }
    
    /**
     * Start a new order (clear current session)
     */
    private fun startNewOrder() {
        viewModel.clearMessages()
        welcomeContainer.visibility = View.VISIBLE
        recyclerViewMessages.visibility = View.GONE
        editTextMessage.setText("")
        editTextMessage.hint = getString(R.string.type_message_homepage)
    }

    /**
     * Setup custom action bar with back button
     */
    private fun setupActionBar() {
        // Enable action bar and set custom view
        supportActionBar?.apply {
            setDisplayHomeAsUpEnabled(true)
            setDisplayShowHomeEnabled(true)
            setDisplayShowTitleEnabled(true)
            title = "Indian Grill"
        }
    }


    /**
     * Navigate to MainActivity when session is invalid
     */
    private fun navigateToMainActivity() {
        val intent = Intent(this, com.genkit.restaurant.ui.compose.MainActivity::class.java)
        intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
        startActivity(intent)
        finish()
    }
    
    override fun onBackPressed() {
        // Navigate back to MainActivity when user presses back
        navigateToMainActivity()
    }

    override fun onOptionsItemSelected(item: android.view.MenuItem): Boolean {
        when (item.itemId) {
            android.R.id.home -> {
                // Handle action bar back button click
                Logger.logUiEvent("ACTION_BAR_BACK_CLICKED", "ChatActivity")
                navigateToMainActivity()
                return true
            }
        }
        return super.onOptionsItemSelected(item)
    }
    
    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        
        // Save current message input
        outState.putString(STATE_MESSAGE_INPUT, editTextMessage.text.toString())
        
        // Save scroll position
        val layoutManager = recyclerViewMessages.layoutManager as? LinearLayoutManager
        layoutManager?.let {
            outState.putInt(STATE_SCROLL_POSITION, it.findLastVisibleItemPosition())
        }
        
        // Save status message state
        if (textViewStatus.visibility == View.VISIBLE) {
            outState.putString(STATE_STATUS_MESSAGE, textViewStatus.text.toString())
            outState.putBoolean(STATE_STATUS_VISIBLE, true)
        } else {
            outState.putBoolean(STATE_STATUS_VISIBLE, false)
        }
    }
    
    private fun restoreInstanceState(savedInstanceState: Bundle?) {
        savedInstanceState?.let { state ->
            // Restore message input
            val messageInput = state.getString(STATE_MESSAGE_INPUT)
            if (!messageInput.isNullOrEmpty()) {
                editTextMessage.setText(messageInput)
                // Set cursor to end of text
                editTextMessage.setSelection(messageInput.length)
            }
            
            // Restore scroll position (will be applied after messages are loaded)
            val scrollPosition = state.getInt(STATE_SCROLL_POSITION, -1)
            if (scrollPosition >= 0) {
                // Post to message queue to ensure RecyclerView is ready
                recyclerViewMessages.post {
                    val layoutManager = recyclerViewMessages.layoutManager as? LinearLayoutManager
                    layoutManager?.scrollToPosition(scrollPosition)
                }
            }
            
            // Restore status message
            val statusVisible = state.getBoolean(STATE_STATUS_VISIBLE, false)
            if (statusVisible) {
                val statusMessage = state.getString(STATE_STATUS_MESSAGE)
                if (!statusMessage.isNullOrEmpty()) {
                    textViewStatus.text = statusMessage
                    textViewStatus.visibility = View.VISIBLE
                }
            }
        }
    }
    
    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        
        // Handle configuration changes (like rotation)
        // ViewModels automatically retain their state, so messages and UI state are preserved
        
        // Ensure keyboard behavior is correct after rotation
        when (newConfig.orientation) {
            Configuration.ORIENTATION_LANDSCAPE -> {
                // In landscape, we might want to adjust the layout
                // The windowSoftInputMode in manifest handles most of this
            }
            Configuration.ORIENTATION_PORTRAIT -> {
                // In portrait, ensure normal behavior
                // Scroll to bottom if we have messages
                recyclerViewMessages.post {
                    val adapter = recyclerViewMessages.adapter
                    if (adapter != null && adapter.itemCount > 0) {
                        recyclerViewMessages.scrollToPosition(adapter.itemCount - 1)
                    }
                }
            }
        }
    }
    
    override fun onPause() {
        super.onPause()
        
        // Pause any ongoing network requests to save battery and data
        viewModel.pauseNetworkRequests()
        
        // Hide keyboard if visible
        val inputMethodManager = getSystemService(Context.INPUT_METHOD_SERVICE) as InputMethodManager
        inputMethodManager.hideSoftInputFromWindow(editTextMessage.windowToken, 0)
    }
    
    override fun onResume() {
        super.onResume()
        
        // Resume network requests
        viewModel.resumeNetworkRequests()
        
        // Validate session is still active
        viewModel.validateSession()
        
        // Scroll to bottom to show latest messages
        recyclerViewMessages.post {
            val adapter = recyclerViewMessages.adapter
            if (adapter != null && adapter.itemCount > 0) {
                recyclerViewMessages.scrollToPosition(adapter.itemCount - 1)
            }
        }
    }
    
    override fun onStop() {
        super.onStop()
        
        // Activity is no longer visible
        // Cancel any pending UI updates to prevent memory leaks
        textViewStatus.removeCallbacks(null)
    }
    
    override fun onDestroy() {
        super.onDestroy()
        
        // Clean up any remaining callbacks
        textViewStatus.removeCallbacks(null)
        recyclerViewMessages.removeCallbacks(null)
    }
}