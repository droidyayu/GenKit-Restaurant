package com.genkit.restaurant.data.network

import com.genkit.restaurant.data.api.ApiConfig
import com.genkit.restaurant.data.api.ApiService
import com.genkit.restaurant.util.Logger
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object NetworkModule {
    
    private fun createLoggingInterceptor(): HttpLoggingInterceptor {
        return HttpLoggingInterceptor { message ->
            Logger.v(Logger.Tags.NETWORK, message)
        }.apply {
            // Always use BODY level for comprehensive logging
            level = HttpLoggingInterceptor.Level.BODY
        }
    }
    
    private fun createCustomLoggingInterceptor(): Interceptor {
        return Interceptor { chain ->
            val request = chain.request()
            val startTime = System.currentTimeMillis()
            
            // Log request details
            Logger.logApiRequest(
                endpoint = request.url.encodedPath,
                method = request.method,
                params = request.url.queryParameterNames.associateWith { 
                    request.url.queryParameter(it) ?: ""
                }.takeIf { it.isNotEmpty() }
            )
            
            try {
                val response = chain.proceed(request)
                val endTime = System.currentTimeMillis()
                val duration = endTime - startTime
                
                // Read response body for logging (but preserve it for actual use)
                val responseBody = response.body
                val responseBodyString = responseBody?.let { body ->
                    val source = body.source()
                    source.request(Long.MAX_VALUE)
                    source.buffer.clone().readUtf8()
                }
                
                // Log response details
                Logger.logApiResponse(
                    endpoint = request.url.encodedPath,
                    statusCode = response.code,
                    responseBody = responseBodyString,
                    duration = duration
                )
                
                response
            } catch (e: Exception) {
                val endTime = System.currentTimeMillis()
                val duration = endTime - startTime
                
                Logger.logApiError(
                    endpoint = request.url.encodedPath,
                    error = e,
                    context = "Request failed after ${duration}ms"
                )
                throw e
            }
        }
    }
    
    private fun createHeaderInterceptor(): Interceptor {
        return Interceptor { chain ->
            val originalRequest = chain.request()
            val requestBuilder = originalRequest.newBuilder()
                .addHeader(ApiConfig.Headers.CONTENT_TYPE, ApiConfig.Headers.APPLICATION_JSON)

            // Only add API key for non-Firebase requests (Firebase Functions handle auth internally)
            if (!originalRequest.url.toString().contains("firestore.googleapis.com") &&
                !originalRequest.url.toString().contains("firebasedatabase.app")) {
                requestBuilder.addHeader(ApiConfig.Headers.API_KEY, ApiConfig.API_KEY_VALUE)
                Logger.d(Logger.Tags.NETWORK, "Added API Key for non-Firebase request")
            } else {
                Logger.d(Logger.Tags.NETWORK, "Skipped API Key for Firebase request")
            }

            Logger.d(Logger.Tags.NETWORK, "Request URL: ${originalRequest.url}")
            Logger.d(Logger.Tags.NETWORK, "Request method: ${originalRequest.method}")

            chain.proceed(requestBuilder.build())
        }
    }
    
    private fun createOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(createHeaderInterceptor())
            .addInterceptor(createCustomLoggingInterceptor())
            .addInterceptor(createLoggingInterceptor())
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS) // Keep normal timeout
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }
    
    private fun createSSEOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(createHeaderInterceptor())
            .addInterceptor(createCustomLoggingInterceptor())
            .addInterceptor(createLoggingInterceptor())
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.MINUTES) // Extended timeout for SSE
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()
    }
    
    private fun createRetrofit(): Retrofit {
        return Retrofit.Builder()
            .baseUrl(ApiConfig.BASE_URL)
            .client(createOkHttpClient())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    private fun createSSERetrofit(): Retrofit {
        return Retrofit.Builder()
            .baseUrl(ApiConfig.BASE_URL)
            .client(createSSEOkHttpClient())
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    val apiService: ApiService by lazy {
        createRetrofit().create(ApiService::class.java)
    }
    
    val sseApiService: ApiService by lazy {
        createSSERetrofit().create(ApiService::class.java)
    }
}