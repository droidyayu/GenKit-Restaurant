package com.genkit.restaurant.ui.compose

import android.content.Context
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.genkit.restaurant.domain.viewmodel.UserIdViewModel
import com.genkit.restaurant.domain.viewmodel.UserIdUiState

@Composable
fun UserIdScreen(
    onNavigateToChat: () -> Unit,
    viewModel: UserIdViewModel = viewModel()
) {
    val context = LocalContext.current
    val uiState by viewModel.uiState.collectAsState()
    var userId by remember { mutableStateOf("") }
    
    // Handle navigation on success
    LaunchedEffect(uiState) {
        val currentState = uiState
        if (currentState is UserIdUiState.Success) {
            saveSessionData(
                context = context,
                userId = currentState.sessionData.userId,
                sessionId = currentState.sessionData.sessionId,
                appName = currentState.sessionData.appName
            )
            onNavigateToChat()
        }
    }
    
    Surface(
        modifier = Modifier.fillMaxSize(),
        color = MaterialTheme.colorScheme.background
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(24.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "Welcome to Restaurant Chat",
                fontSize = 24.sp,
                fontWeight = FontWeight.Bold,
                color = MaterialTheme.colorScheme.onBackground,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Text(
                text = "Enter your User ID to start chatting",
                fontSize = 16.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            OutlinedTextField(
                value = userId,
                onValueChange = { userId = it },
                label = { Text("User ID") },
                modifier = Modifier.fillMaxWidth(),
                enabled = uiState !is UserIdUiState.Loading,
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(
                    onDone = {
                        if (userId.isNotBlank()) {
                            viewModel.createSession(userId.trim())
                        }
                    }
                ),
                colors = OutlinedTextFieldDefaults.colors(
                    focusedBorderColor = MaterialTheme.colorScheme.primary,
                    unfocusedBorderColor = MaterialTheme.colorScheme.outline
                )
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Error message
            val currentState = uiState
            if (currentState is UserIdUiState.Error) {
                Text(
                    text = currentState.message,
                    color = MaterialTheme.colorScheme.error,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth()
                )
                
                Spacer(modifier = Modifier.height(16.dp))
            }
            
            // Buttons
            when (uiState) {
                is UserIdUiState.Loading -> {
                    CircularProgressIndicator(
                        color = MaterialTheme.colorScheme.primary
                    )
                }
                is UserIdUiState.Error -> {
                    Button(
                        onClick = {
                            if (userId.isNotBlank()) {
                                viewModel.createSession(userId.trim())
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.error
                        )
                    ) {
                        Text("Retry")
                    }
                }
                else -> {
                    Button(
                        onClick = {
                            if (userId.isNotBlank()) {
                                viewModel.createSession(userId.trim())
                            }
                        },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = userId.isNotBlank()
                    ) {
                        Text("Start Chat")
                    }
                }
            }
        }
    }
}

private fun saveSessionData(
    context: Context,
    userId: String,
    sessionId: String,
    appName: String
) {
    val sharedPreferences = context.getSharedPreferences("restaurant_chat_prefs", Context.MODE_PRIVATE)
    sharedPreferences.edit().apply {
        putString("user_id", userId)
        putString("session_id", sessionId)
        putString("app_name", appName)
        apply()
    }
}