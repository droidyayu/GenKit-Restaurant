package com.genkit.restaurant.data.api

import com.genkit.restaurant.data.model.CreateSessionResponse
import com.genkit.restaurant.data.model.SendMessageRequest
import okhttp3.ResponseBody
import retrofit2.Response
import retrofit2.http.*

interface ApiService {

    @GET(ApiConfig.Endpoints.HEALTH_CHECK)
    suspend fun checkBackendHealth(): Response<ResponseBody>

    @POST(ApiConfig.Endpoints.CREATE_SESSION)
    suspend fun createSession(
        @Path("userId") userId: String,
        @Path("sessionId") sessionId: String
    ): Response<CreateSessionResponse>

    @POST(ApiConfig.Endpoints.SEND_MESSAGE)
    suspend fun sendMessage(
        @Body request: SendMessageRequest
    ): Response<ResponseBody>
}