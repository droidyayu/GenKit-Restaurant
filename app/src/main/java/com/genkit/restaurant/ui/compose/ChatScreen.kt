package com.genkit.restaurant.ui.compose

import android.content.Context
import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.rememberLazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.genkit.restaurant.data.model.Message
import com.genkit.restaurant.data.model.SessionData
import com.genkit.restaurant.domain.viewmodel.ChatViewModel
import com.genkit.restaurant.domain.viewmodel.ChatUiState

@Composable
fun ChatScreen(
    onNavigateToUserId: () -> Unit,
    viewModel: ChatViewModel = viewModel()
) {
    val context = LocalContext.current
    val messages by viewModel.messages.collectAsState()
    val uiState by viewModel.uiState.collectAsState()
    var messageText by remember { mutableStateOf("") }
    val listState = rememberLazyListState()
    
    // Load session data on startup
    LaunchedEffect(Unit) {
        loadSessionData(context, viewModel, onNavigateToUserId)
    }
    
    // Auto-scroll to bottom when new messages arrive
    LaunchedEffect(messages.size) {
        if (messages.isNotEmpty()) {
            listState.animateScrollToItem(messages.size - 1)
        }
    }
    
    // Handle session expiration
    LaunchedEffect(uiState) {
        val currentState = uiState
        if (currentState is ChatUiState.SessionExpired) {
            clearSessionData(context)
            onNavigateToUserId()
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                Brush.verticalGradient(
                    colors = listOf(
                        Color(0xFF1A1A1A),
                        Color(0xFF0F0F0F)
                    )
                )
            )
    ) {
        Column(
            modifier = Modifier.fillMaxSize()
        ) {
            // Enhanced Header
            EnhancedChatHeader(
                uiState = uiState,
                onNewOrder = {
                    viewModel.clearMessages()
                    messageText = ""
                }
            )
            
            // Messages area with enhanced design
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
            ) {
                if (messages.isEmpty()) {
                    EnhancedWelcomeScreen()
                } else {
                    LazyColumn(
                        state = listState,
                        modifier = Modifier.fillMaxSize(),
                        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        items(messages) { message ->
                            EnhancedMessageItem(message = message)
                        }
                        
                        // Add some bottom padding for better UX
                        item {
                            Spacer(modifier = Modifier.height(16.dp))
                        }
                    }
                }
                
                // Enhanced typing indicator
                androidx.compose.animation.AnimatedVisibility(
                    visible = uiState is ChatUiState.Typing,
                    enter = slideInVertically() + fadeIn(),
                    exit = slideOutVertically() + fadeOut(),
                    modifier = Modifier.align(Alignment.BottomStart)
                ) {
                    TypingIndicator()
                }
            }
            
            // Enhanced status messages
            androidx.compose.animation.AnimatedVisibility(
                visible = uiState is ChatUiState.Error,
                enter = slideInVertically() + fadeIn(),
                exit = slideOutVertically() + fadeOut()
            ) {
                val currentState = uiState
                if (currentState is ChatUiState.Error) {
                    ErrorMessage(currentState.message)
                }
            }
            
            // Enhanced Input area
            EnhancedChatInput(
                messageText = messageText,
                onMessageTextChange = { messageText = it },
                onSendMessage = {
                    if (messageText.isNotBlank()) {
                        viewModel.sendMessage(messageText.trim())
                        messageText = ""
                    }
                },
                uiState = uiState,
                onRetry = { viewModel.retryLastMessage() },
                onCancel = { viewModel.cancelCurrentRequest() }
            )
        }
    }
}

@Composable
private fun EnhancedChatHeader(
    uiState: ChatUiState,
    onNewOrder: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1E1E1E)
        ),
        shape = RoundedCornerShape(bottomStart = 16.dp, bottomEnd = 16.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.weight(1f)
            ) {
                // Restaurant logo/icon
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .background(
                            Brush.radialGradient(
                                colors = listOf(Color(0xFFFF6B35), Color(0xFFE55100))
                            ),
                            shape = CircleShape
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.Restaurant,
                        contentDescription = "Restaurant",
                        tint = Color.White,
                        modifier = Modifier.size(24.dp)
                    )
                }
                
                Spacer(modifier = Modifier.width(12.dp))
                
                Column {
                    Text(
                        text = "Indian Grill",
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White
                    )
                    
                    Row(
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Status indicator dot
                        Box(
                            modifier = Modifier
                                .size(8.dp)
                                .background(
                                    when (uiState) {
                                        is ChatUiState.Loading, is ChatUiState.Typing -> Color(0xFF4CAF50)
                                        is ChatUiState.Error -> Color(0xFFFF5722)
                                        else -> Color(0xFF4CAF50)
                                    },
                                    CircleShape
                                )
                        )
                        
                        Spacer(modifier = Modifier.width(6.dp))
                        
                        Text(
                            text = when (uiState) {
                                is ChatUiState.Loading -> "Processing your order..."
                                is ChatUiState.Typing -> "Chef is preparing response..."
                                is ChatUiState.Error -> "Connection issue"
                                is ChatUiState.SessionExpired -> "Session expired"
                                else -> "Online • Ready to serve"
                            },
                            fontSize = 12.sp,
                            color = Color(0xFFB0B0B0)
                        )
                    }
                }
            }
            
            // Action buttons
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // New Order button with enhanced design
                Button(
                    onClick = onNewOrder,
                    colors = ButtonDefaults.buttonColors(
                        containerColor = Color(0xFFFF6B35)
                    ),
                    shape = RoundedCornerShape(20.dp),
                    modifier = Modifier.height(36.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Add,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(
                        text = "New Order",
                        fontSize = 12.sp,
                        fontWeight = FontWeight.Medium
                    )
                }
                
                // Loading indicator
                AnimatedVisibility(
                    visible = uiState is ChatUiState.Loading,
                    enter = scaleIn() + fadeIn(),
                    exit = scaleOut() + fadeOut()
                ) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color(0xFFFF6B35),
                        strokeWidth = 2.dp
                    )
                }
            }
        }
    }
}

@Composable
private fun EnhancedWelcomeScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        // Welcome card - always visible
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .shadow(16.dp, RoundedCornerShape(24.dp)),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF1E1E1E)
                ),
                shape = RoundedCornerShape(24.dp)
            ) {
                Column(
                    modifier = Modifier.padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Animated chef icon
                    Box(
                        modifier = Modifier
                            .size(80.dp)
                            .background(
                                Brush.radialGradient(
                                    colors = listOf(Color(0xFFFF6B35), Color(0xFFE55100))
                                ),
                                shape = CircleShape
                            ),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = Icons.Default.Restaurant,
                            contentDescription = "Chef",
                            tint = Color.White,
                            modifier = Modifier.size(40.dp)
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    Text(
                        text = "Welcome to Indian Grill! 🍛",
                        fontSize = 28.sp,
                        fontWeight = FontWeight.Bold,
                        color = Color.White,
                        textAlign = TextAlign.Center
                    )
                    
                    Spacer(modifier = Modifier.height(12.dp))
                    
                    Text(
                        text = "Your personal AI chef is ready to help you discover amazing Indian flavors",
                        fontSize = 16.sp,
                        color = Color(0xFFB0B0B0),
                        textAlign = TextAlign.Center,
                        lineHeight = 22.sp
                    )
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Quick action buttons
                    Row(
                        horizontalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        SuggestionChip(
                            onClick = { /* Handle suggestion */ },
                            label = { Text("🍛 Popular Dishes", fontSize = 12.sp) },
                            colors = SuggestionChipDefaults.suggestionChipColors(
                                containerColor = Color(0xFF2A2A2A),
                                labelColor = Color.White
                            )
                        )
                        
                        SuggestionChip(
                            onClick = { /* Handle suggestion */ },
                            label = { Text("🌶️ Spicy Menu", fontSize = 12.sp) },
                            colors = SuggestionChipDefaults.suggestionChipColors(
                                containerColor = Color(0xFF2A2A2A),
                                labelColor = Color.White
                            )
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    Text(
                        text = "Type your message below to get started! 👇",
                        fontSize = 14.sp,
                        color = Color(0xFF888888),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }

@Composable
private fun EnhancedMessageItem(message: Message) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = if (message.isFromUser) Arrangement.End else Arrangement.Start
    ) {
        if (message.isFromUser) {
            EnhancedUserMessageItem(message = message)
        } else {
            EnhancedAgentMessageItem(message = message)
        }
    }
}

@Composable
private fun EnhancedUserMessageItem(message: Message) {
    Row(
        modifier = Modifier.padding(start = 64.dp),
        horizontalArrangement = Arrangement.End
    ) {
        Card(
            modifier = Modifier
                .widthIn(max = 280.dp)
                .shadow(4.dp, RoundedCornerShape(20.dp)),
            colors = CardDefaults.cardColors(
                containerColor = Color(0xFFFF6B35)
            ),
            shape = RoundedCornerShape(
                topStart = 20.dp,
                topEnd = 20.dp,
                bottomStart = 20.dp,
                bottomEnd = 6.dp
            )
        ) {
            Text(
                text = message.content,
                modifier = Modifier.padding(16.dp),
                color = Color.White,
                fontSize = 15.sp,
                lineHeight = 20.sp
            )
        }
        
        Spacer(modifier = Modifier.width(8.dp))
        
        // User avatar
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(
                    Color(0xFF4CAF50),
                    CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Person,
                contentDescription = "User",
                tint = Color.White,
                modifier = Modifier.size(18.dp)
            )
        }
    }
}

@Composable
private fun EnhancedAgentMessageItem(message: Message) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.Start
    ) {
        // Chef avatar
        Box(
            modifier = Modifier
                .size(32.dp)
                .background(
                    Brush.radialGradient(
                        colors = listOf(Color(0xFFFF6B35), Color(0xFFE55100))
                    ),
                    CircleShape
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Restaurant,
                contentDescription = "Chef",
                tint = Color.White,
                modifier = Modifier.size(18.dp)
            )
        }
        
        Spacer(modifier = Modifier.width(8.dp))
        
        Column(
            modifier = Modifier.weight(1f) // This makes the column take remaining space
        ) {
            // Agent name with enhanced styling
            Text(
                text = message.agentName ?: "Chef Assistant",
                fontSize = 11.sp,
                fontWeight = FontWeight.Medium,
                color = Color(0xFFFF6B35),
                modifier = Modifier.padding(start = 4.dp, bottom = 4.dp)
            )
            
            Card(
                modifier = Modifier
                    .fillMaxWidth() // Full width instead of widthIn
                    .shadow(4.dp, RoundedCornerShape(20.dp)),
                colors = CardDefaults.cardColors(
                    containerColor = Color(0xFF2A2A2A)
                ),
                shape = RoundedCornerShape(
                    topStart = 6.dp,
                    topEnd = 20.dp,
                    bottomStart = 20.dp,
                    bottomEnd = 20.dp
                )
            ) {
                Text(
                    text = message.content,
                    modifier = Modifier.padding(16.dp),
                    color = Color.White,
                    fontSize = 15.sp,
                    lineHeight = 20.sp
                )
            }
        }
    }
}

@Composable
private fun EnhancedChatInput(
    messageText: String,
    onMessageTextChange: (String) -> Unit,
    onSendMessage: () -> Unit,
    uiState: ChatUiState,
    onRetry: () -> Unit,
    onCancel: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shadow(8.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF1E1E1E)
        ),
        shape = RoundedCornerShape(topStart = 16.dp, topEnd = 16.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(20.dp)
        ) {
            // Action buttons for different states
            AnimatedVisibility(
                visible = uiState is ChatUiState.Loading || (uiState is ChatUiState.Error && uiState.isRetryable),
                enter = slideInVertically() + fadeIn(),
                exit = slideOutVertically() + fadeOut()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(bottom = 12.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    when (uiState) {
                        is ChatUiState.Loading -> {
                            OutlinedButton(
                                onClick = onCancel,
                                colors = ButtonDefaults.outlinedButtonColors(
                                    contentColor = Color(0xFFFF5722)
                                ),
                                shape = RoundedCornerShape(20.dp)
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Close,
                                    contentDescription = null,
                                    modifier = Modifier.size(16.dp)
                                )
                                Spacer(modifier = Modifier.width(4.dp))
                                Text("Cancel")
                            }
                        }
                        is ChatUiState.Error -> {
                            if (uiState.isRetryable) {
                                Button(
                                    onClick = onRetry,
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFFF9800)
                                    ),
                                    shape = RoundedCornerShape(20.dp)
                                ) {
                                    Icon(
                                        imageVector = Icons.Default.Refresh,
                                        contentDescription = null,
                                        modifier = Modifier.size(16.dp)
                                    )
                                    Spacer(modifier = Modifier.width(4.dp))
                                    Text("Retry")
                                }
                            }
                        }
                        else -> {}
                    }
                }
            }
            
            // Enhanced input field
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.Bottom
            ) {
                OutlinedTextField(
                    value = messageText,
                    onValueChange = onMessageTextChange,
                    modifier = Modifier
                        .weight(1f)
                        .padding(end = 12.dp),
                    placeholder = { 
                        Text(
                            "Ask about our menu, specials, or place an order...",
                            color = Color(0xFF888888)
                        ) 
                    },
                    enabled = uiState !is ChatUiState.Loading && uiState !is ChatUiState.Typing,
                    keyboardOptions = KeyboardOptions(imeAction = ImeAction.Send),
                    keyboardActions = KeyboardActions(
                        onSend = { onSendMessage() }
                    ),
                    colors = OutlinedTextFieldDefaults.colors(
                        focusedBorderColor = Color(0xFFFF6B35),
                        unfocusedBorderColor = Color(0xFF444444),
                        focusedTextColor = Color.White,
                        unfocusedTextColor = Color.White,
                        cursorColor = Color(0xFFFF6B35)
                    ),
                    shape = RoundedCornerShape(24.dp),
                    maxLines = 3
                )
                
                // Enhanced send button
                FloatingActionButton(
                    onClick = onSendMessage,
                    modifier = Modifier.size(48.dp),
                    containerColor = if (messageText.isNotBlank()) Color(0xFFFF6B35) else Color(0xFF444444),
                    contentColor = Color.White,
                    elevation = FloatingActionButtonDefaults.elevation(
                        defaultElevation = if (messageText.isNotBlank()) 6.dp else 2.dp
                    )
                ) {
                    AnimatedContent(
                        targetState = messageText.isNotBlank(),
                        transitionSpec = {
                            scaleIn() + fadeIn() togetherWith scaleOut() + fadeOut()
                        }
                    ) { hasText ->
                        Icon(
                            imageVector = if (hasText) Icons.Default.Send else Icons.Default.Mic,
                            contentDescription = if (hasText) "Send message" else "Voice input",
                            modifier = Modifier.size(20.dp)
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun TypingIndicator() {
    Card(
        modifier = Modifier
            .padding(horizontal = 16.dp, vertical = 8.dp)
            .shadow(4.dp, RoundedCornerShape(20.dp)),
        colors = CardDefaults.cardColors(
            containerColor = Color(0xFF2A2A2A)
        ),
        shape = RoundedCornerShape(20.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Chef avatar
            Box(
                modifier = Modifier
                    .size(24.dp)
                    .background(
                        Brush.radialGradient(
                            colors = listOf(Color(0xFFFF6B35), Color(0xFFE55100))
                        ),
                        CircleShape
                    ),
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = Icons.Default.Restaurant,
                    contentDescription = "Chef",
                    tint = Color.White,
                    modifier = Modifier.size(12.dp)
                )
            }
            
            Spacer(modifier = Modifier.width(8.dp))
            
            Text(
                text = "Chef is preparing your response",
                color = Color(0xFFB0B0B0),
                fontSize = 14.sp
            )
            
            Spacer(modifier = Modifier.width(8.dp))
            
            // Animated dots
            Row {
                repeat(3) { index ->
                    val infiniteTransition = rememberInfiniteTransition()
                    val alpha by infiniteTransition.animateFloat(
                        initialValue = 0.3f,
                        targetValue = 1f,
                        animationSpec = infiniteRepeatable(
                            animation = tween(600),
                            repeatMode = RepeatMode.Reverse
                        )
                    )
                    
                    Box(
                        modifier = Modifier
                            .size(6.dp)
                            .background(
                                Color(0xFFFF6B35).copy(alpha = alpha),
                                CircleShape
                            )
                    )
                    
                    if (index < 2) Spacer(modifier = Modifier.width(4.dp))
                }
            }
        }
    }
}

@Composable
private fun ErrorMessage(message: String) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        colors = CardDefaults.cardColors(
            containerColor = Color(0x33FF5722)
        ),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = Icons.Default.Warning,
                contentDescription = "Error",
                tint = Color(0xFFFF5722),
                modifier = Modifier.size(20.dp)
            )
            
            Spacer(modifier = Modifier.width(8.dp))
            
            Text(
                text = message,
                color = Color(0xFFFF8A80),
                fontSize = 14.sp
            )
        }
    }
}

private fun loadSessionData(
    context: Context,
    viewModel: ChatViewModel,
    onNavigateToUserId: () -> Unit
) {
    val sharedPreferences = context.getSharedPreferences("restaurant_chat_prefs", Context.MODE_PRIVATE)
    
    val userId = sharedPreferences.getString("user_id", null)
    val sessionId = sharedPreferences.getString("session_id", null)
    val appName = sharedPreferences.getString("app_name", "app")
    
    if (userId != null && sessionId != null) {
        val sessionData = SessionData(
            userId = userId,
            sessionId = sessionId,
            appName = appName ?: "app"
        )
        
        viewModel.setSessionData(sessionData)
        viewModel.validateSession()
    } else {
        onNavigateToUserId()
    }
}

private fun clearSessionData(context: Context) {
    val sharedPreferences = context.getSharedPreferences("restaurant_chat_prefs", Context.MODE_PRIVATE)
    sharedPreferences.edit().clear().apply()
}