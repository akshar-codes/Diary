package com.notes.diaryapp.data.remote

import com.notes.diaryapp.auth.TokenManager
import com.notes.diaryapp.data.model.RefreshTokenRequest
import okhttp3.Authenticator
import okhttp3.Request
import okhttp3.Response
import okhttp3.Route

class TokenAuthenticator : Authenticator {

    @Synchronized
    override fun authenticate(route: Route?, response: Response): Request? {
        // Do not attempt refresh on auth endpoints to prevent infinite retry loops
        val path = response.request.url.encodedPath
        if (path.contains("/auth/login") ||
            path.contains("/auth/register") ||
            path.contains("/auth/refresh") ||
            path.contains("/releases/")
        ) {
            return null
        }

        // Check if the token was already refreshed by another concurrent thread
        val currentToken = TokenManager.getAccessToken()
        val requestToken = response.request.header("Authorization")?.removePrefix("Bearer ")

        if (currentToken != null && currentToken != requestToken) {
            // Token has already been refreshed by a previous call, retry with new token
            return response.request.newBuilder()
                .header("Authorization", "Bearer $currentToken")
                .build()
        }

        // Retrieve stored refresh token
        val refreshToken = TokenManager.getRefreshToken() ?: return null

        try {
            // Perform synchronous refresh using isolated unauthenticated service
            val refreshCall = ApiClient.getUnauthenticatedService()
                .refreshTokenSync(RefreshTokenRequest(refreshToken))
            val refreshResponse = refreshCall.execute()

            if (refreshResponse.isSuccessful && refreshResponse.body()?.success == true) {
                val newTokens = refreshResponse.body()?.data
                if (newTokens != null) {
                    TokenManager.saveTokens(newTokens.accessToken, newTokens.refreshToken)

                    // Retry the failed request with the new access token
                    return response.request.newBuilder()
                        .header("Authorization", "Bearer ${newTokens.accessToken}")
                        .build()
                }
            }

            // Refresh failed (e.g. refresh token expired or revoked)
            TokenManager.clearSession()
            return null
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
}
