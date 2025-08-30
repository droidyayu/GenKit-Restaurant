package com.genkit.restaurant.ui.compose

import android.content.Context
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.lifecycleScope
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.genkit.restaurant.ui.theme.RestaurantChatTheme
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {
    
    companion object {
        private const val PREFS_NAME = "restaurant_chat_prefs"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_SESSION_ID = "session_id"
        private const val KEY_APP_NAME = "app_name"
        private const val SPLASH_DELAY = 1000L
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        setContent {
            RestaurantChatTheme {
                MainApp()
            }
        }
    }
    
    @Composable
    private fun MainApp() {
        val navController = rememberNavController()
        val context = LocalContext.current
        var isLoading by remember { mutableStateOf(true) }
        var startDestination by remember { mutableStateOf("splash") }
        
        // Check session data on startup
        LaunchedEffect(Unit) {
            delay(SPLASH_DELAY)
            
            val sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val userId = sharedPreferences.getString(KEY_USER_ID, null)
            val sessionId = sharedPreferences.getString(KEY_SESSION_ID, null)
            val appName = sharedPreferences.getString(KEY_APP_NAME, null)
            
            startDestination = if (isSessionValid(userId, sessionId, appName)) {
                "chat"
            } else {
                "user_id"
            }
            
            isLoading = false
        }
        
        if (isLoading) {
            SplashScreen()
        } else {
            NavHost(
                navController = navController,
                startDestination = startDestination
            ) {
                composable("user_id") {
                    UserIdScreen(
                        onNavigateToChat = {
                            navController.navigate("chat") {
                                popUpTo("user_id") { inclusive = true }
                            }
                        }
                    )
                }
                composable("chat") {
                    ChatScreen(
                        onNavigateToUserId = {
                            navController.navigate("user_id") {
                                popUpTo("chat") { inclusive = true }
                            }
                        }
                    )
                }
            }
        }
    }
    
    @Composable
    private fun SplashScreen() {
        Surface(
            modifier = Modifier.fillMaxSize(),
            color = MaterialTheme.colorScheme.background
        ) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(32.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text(
                    text = "Restaurant Chat App",
                    fontSize = 28.sp,
                    fontWeight = FontWeight.Bold,
                    color = MaterialTheme.colorScheme.onBackground,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(24.dp))
                
                CircularProgressIndicator(
                    color = MaterialTheme.colorScheme.primary
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Loading...",
                    fontSize = 16.sp,
                    color = MaterialTheme.colorScheme.onBackground,
                    textAlign = TextAlign.Center
                )
            }
        }
    }
    
    private fun isSessionValid(userId: String?, sessionId: String?, appName: String?): Boolean {
        return !userId.isNullOrBlank() && 
               !sessionId.isNullOrBlank() && 
               !appName.isNullOrBlank()
    }
}