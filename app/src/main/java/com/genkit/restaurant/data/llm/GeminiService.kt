package com.genkit.restaurant.data.llm

import android.util.Log
import com.genkit.restaurant.BuildConfig
import com.google.gson.Gson
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import java.util.concurrent.TimeUnit

data class GeminiRequest(
    val contents: List<Content>,
    val generationConfig: GenerationConfig = GenerationConfig()
)

data class Content(
    val parts: List<Part>
)

data class Part(
    val text: String
)

data class GenerationConfig(
    val temperature: Double = 0.7,
    val topK: Int = 40,
    val topP: Double = 0.95,
    val maxOutputTokens: Int = 2048
)

data class GeminiResponse(
    val candidates: List<Candidate>
)

data class Candidate(
    val content: Content,
    val finishReason: String? = null
)

class GeminiService {
    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()
    
    private val gson = Gson()
    
    // Gemini API key - should be set via BuildConfig or environment variables
    // Get it from: https://makersuite.google.com/app/apikey
    private val apiKey = BuildConfig.GEMINI_API_KEY.takeIf { it.isNotEmpty() }
        ?: System.getenv("GEMINI_API_KEY")
        ?: "your-gemini-api-key-here" // Default placeholder
    
    private val baseUrl = "https://generativelanguage.googleapis.com/v1beta/models"
    
    suspend fun generateResponse(
        userMessage: String,
        conversationHistory: List<Pair<String, String>> = emptyList()
    ): Result<String> = withContext(Dispatchers.IO) {
        try {
            val systemPrompt = getRestaurantSystemPrompt()
            val messages = buildConversationContext(systemPrompt, conversationHistory, userMessage)
            
            val request = GeminiRequest(
                contents = messages,
                generationConfig = GenerationConfig(
                    temperature = 0.8,
                    maxOutputTokens = 1024
                )
            )
            
            val requestBody = gson.toJson(request)
                .toRequestBody("application/json".toMediaType())
            
            val httpRequest = Request.Builder()
                .url("$baseUrl/gemini-1.5-flash:generateContent?key=$apiKey")
                .post(requestBody)
                .addHeader("Content-Type", "application/json")
                .build()
            
            val response = client.newCall(httpRequest).execute()
            
            if (!response.isSuccessful) {
                Log.e("GeminiService", "API call failed: ${response.code} - ${response.message}")
                return@withContext Result.failure(Exception("API call failed: ${response.code}"))
            }
            
            val responseBody = response.body?.string()
            if (responseBody.isNullOrEmpty()) {
                return@withContext Result.failure(Exception("Empty response from API"))
            }
            
            val geminiResponse = gson.fromJson(responseBody, GeminiResponse::class.java)
            val generatedText = geminiResponse.candidates.firstOrNull()?.content?.parts?.firstOrNull()?.text
            
            if (generatedText.isNullOrEmpty()) {
                return@withContext Result.failure(Exception("No content generated"))
            }
            
            Result.success(generatedText.trim())
            
        } catch (e: Exception) {
            Log.e("GeminiService", "Error generating response", e)
            Result.failure(e)
        }
    }
    
    private fun buildConversationContext(
        systemPrompt: String,
        history: List<Pair<String, String>>,
        currentMessage: String
    ): List<Content> {
        val messages = mutableListOf<Content>()
        
        // Add system prompt
        messages.add(Content(listOf(Part(systemPrompt))))
        
        // Add conversation history
        history.forEach { (user, assistant) ->
            messages.add(Content(listOf(Part("User: $user"))))
            messages.add(Content(listOf(Part("Assistant: $assistant"))))
        }
        
        // Add current user message
        messages.add(Content(listOf(Part("User: $currentMessage"))))
        
        return messages
    }
    
    private fun getRestaurantSystemPrompt(): String = """
        Welcome to **Indian Grill**! You are the AI Chef Assistant for this premium Indian restaurant.
        
        **Your Role:**
        - Friendly, knowledgeable Indian cuisine expert
        - Help customers discover amazing Indian flavors
        - Provide menu recommendations based on preferences
        - Answer questions about ingredients, spice levels, and dietary restrictions
        - Take orders and suggest complementary items
        
        **Menu Highlights:**
        🍛 **Main Dishes:**
        - Butter Chicken - Creamy tomato-based curry with tender chicken
        - Palak Paneer - Fresh spinach curry with cottage cheese cubes
        - Biryani - Fragrant basmati rice with spiced meat/vegetables
        - Dal Makhani - Rich black lentils in creamy sauce
        - Tandoori Chicken - Clay oven-roasted marinated chicken
        - Lamb Vindaloo - Spicy Goan curry with tender lamb
        
        🍞 **Breads & Sides:**
        - Garlic Naan - Fresh baked bread with garlic and herbs
        - Basmati Rice - Aromatic long-grain rice
        - Raita - Cool yogurt with cucumber and spices
        - Papadum - Crispy lentil wafers
        
        🍮 **Desserts:**
        - Gulab Jamun - Sweet milk dumplings in rose syrup
        - Rasmalai - Soft cheese patties in sweetened milk
        - Kulfi - Traditional cardamom ice cream
        
        **Communication Style:**
        - Be warm and welcoming
        - Ask about spice preferences (mild, medium, hot)
        - Suggest complete meals with sides
        - Mention cooking times (15-25 minutes typically)
        - Use food emojis to make responses engaging
        - Keep responses concise but helpful
        
        **Order Process:**
        1. Greet and ask what they're craving
        2. Make recommendations based on their preferences
        3. Confirm spice level and any dietary restrictions
        4. Suggest complementary sides and drinks
        5. Provide order summary and estimated time
        
        Always be helpful, enthusiastic about the food, and make customers feel welcome!
    """.trimIndent()
}