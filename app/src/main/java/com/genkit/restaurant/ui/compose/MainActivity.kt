package com.genkit.restaurant.ui.compose

import android.content.Context
import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
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
import com.firebase.ui.auth.AuthUI
import com.firebase.ui.auth.FirebaseAuthUIActivityResultContract
import com.firebase.ui.auth.data.model.FirebaseAuthUIAuthenticationResult
import com.google.firebase.auth.FirebaseAuth
import com.genkit.restaurant.ui.theme.RestaurantChatTheme
import com.genkit.restaurant.domain.viewmodel.AuthViewModel
import com.genkit.restaurant.domain.viewmodel.AuthUiState
import com.genkit.restaurant.data.repository.ChatRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    private lateinit var authViewModel: AuthViewModel
    private lateinit var firebaseAuth: FirebaseAuth

    companion object {
        private const val PREFS_NAME = "restaurant_chat_prefs"
        private const val KEY_USER_ID = "user_id"
        private const val KEY_SESSION_ID = "session_id"
        private const val KEY_APP_NAME = "app_name"
        private const val SPLASH_DELAY = 1000L
    }

    // Firebase UI Auth launcher
    private val signInLauncher = registerForActivityResult(
        FirebaseAuthUIActivityResultContract()
    ) { result ->
        onSignInResult(result)
    }
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Initialize Firebase Auth and ViewModel
        firebaseAuth = FirebaseAuth.getInstance()
        authViewModel = AuthViewModel(application)

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
        var currentUser by remember { mutableStateOf(firebaseAuth.currentUser) }

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
                "auth"
            }

            isLoading = false
        }

        // Listen for auth state changes
        LaunchedEffect(firebaseAuth.currentUser) {
            val user = firebaseAuth.currentUser
            currentUser = user
            if (user != null && startDestination == "auth") {
                // User is authenticated, create session and go to chat
                authViewModel.createSession(user.uid)
            }
        }

        // Listen for auth view model state changes
        val authState by authViewModel.uiState.collectAsState()
        LaunchedEffect(authState) {
            if (authState is AuthUiState.Success && startDestination == "auth") {
                navController.navigate("chat") {
                    popUpTo("auth") { inclusive = true }
                }
            }
        }

        if (isLoading) {
            SplashScreen()
        } else {
            NavHost(
                navController = navController,
                startDestination = startDestination
            ) {
                composable("auth") {
                    AuthScreen(
                        onSignInClick = { launchSignInFlow() },
                        onSignOutClick = {
                            AuthUI.getInstance().signOut(context).addOnCompleteListener {
                                // Clear session data
                                clearSessionData(context)
                                navController.navigate("auth") {
                                    popUpTo("chat") { inclusive = true }
                                }
                            }
                        }
                    )
                }
                composable("chat") {
                    // Navigate to ChatActivity for full chat functionality
                    LaunchedEffect(Unit) {
                        val intent = Intent(context, com.genkit.restaurant.ui.ChatActivity::class.java)
                        context.startActivity(intent)
                        // Finish MainActivity to prevent going back
                        (context as? android.app.Activity)?.finish()
                    }
                }
            }
        }
    }
    
    @Composable
    private fun AuthScreen(
        onSignInClick: () -> Unit,
        onSignOutClick: () -> Unit
    ) {
        val currentUser = firebaseAuth.currentUser

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

                if (currentUser != null) {
                    Text(
                        text = "Welcome back, ${currentUser.displayName ?: currentUser.email ?: "User"}!",
                        fontSize = 16.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    OutlinedButton(
                        onClick = onSignOutClick,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Sign Out")
                    }
                } else {
                    Text(
                        text = "Please sign in to continue",
                        fontSize = 16.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        textAlign = TextAlign.Center
                    )

                    Spacer(modifier = Modifier.height(32.dp))

                    Button(
                        onClick = onSignInClick,
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Text("Sign in with Google")
                    }
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

    private fun clearSessionData(context: Context) {
        val sharedPreferences = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
        sharedPreferences.edit().apply {
            remove(KEY_USER_ID)
            remove(KEY_SESSION_ID)
            remove(KEY_APP_NAME)
            apply()
        }
    }

    private fun onSignInResult(result: FirebaseAuthUIAuthenticationResult) {
        if (result.resultCode == RESULT_OK) {
            val user = FirebaseAuth.getInstance().currentUser
            if (user != null) {
                // Create session for authenticated user
                lifecycleScope.launch {
                    authViewModel.createSession(user.uid)
                }
            }
        } else {
            val response = result.idpResponse
            android.util.Log.w("MainActivity", "Sign-in failed: ${response?.error?.message}")
        }
    }

    private fun launchSignInFlow() {
        val providers = arrayListOf(
            AuthUI.IdpConfig.GoogleBuilder().build()
        )

        val signInIntent = AuthUI.getInstance()
            .createSignInIntentBuilder()
            .setAvailableProviders(providers)
            .setIsSmartLockEnabled(false)
            .build()

        signInLauncher.launch(signInIntent)
    }
}