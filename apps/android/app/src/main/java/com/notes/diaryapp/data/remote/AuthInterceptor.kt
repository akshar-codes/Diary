package com.notes.diaryapp.data.remote

import com.notes.diaryapp.auth.TokenManager
import okhttp3.Interceptor
import okhttp3.Response

class AuthInterceptor : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val originalRequest = chain.request()

        // Skip adding Authorization header if already present
        if (originalRequest.header("Authorization") != null) {
            return chain.proceed(originalRequest)
        }

        val token = TokenManager.getAccessToken()
        return if (!token.isNullOrBlank()) {
            val authenticatedRequest = originalRequest.newBuilder()
                .header("Authorization", "Bearer $token")
                .build()
            chain.proceed(authenticatedRequest)
        } else {
            chain.proceed(originalRequest)
        }
    }
}
