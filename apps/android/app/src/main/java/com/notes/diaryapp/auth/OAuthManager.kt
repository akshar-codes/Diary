package com.notes.diaryapp.auth

import android.content.Context
import android.content.Intent
import android.net.Uri
import androidx.browser.customtabs.CustomTabsIntent
import com.notes.diaryapp.BuildConfig

sealed class OAuthResult {
    data class Success(val accessToken: String, val refreshToken: String) : OAuthResult()
    data class Error(val message: String) : OAuthResult()
}

object OAuthManager {

    private fun getOAuthUrl(provider: String): Uri {
        val baseUrl = BuildConfig.API_BASE_URL.removeSuffix("/")
        return Uri.parse("$baseUrl/auth/$provider?platform=android")
    }

    fun openOAuth(context: Context, provider: String) {
        val uri = getOAuthUrl(provider)
        try {
            val customTabsIntent = CustomTabsIntent.Builder()
                .setShowTitle(true)
                .build()
            customTabsIntent.launchUrl(context, uri)
        } catch (_: Exception) {
            // Fallback to standard browser intent
            val fallbackIntent = Intent(Intent.ACTION_VIEW, uri)
            context.startActivity(fallbackIntent)
        }
    }

    fun openGoogleLogin(context: Context) {
        openOAuth(context, "google")
    }

    fun openGithubLogin(context: Context) {
        openOAuth(context, "github")
    }

    fun parseCallback(intent: Intent?): OAuthResult? {
        val data = intent?.data ?: return null
        if (data.scheme != "diaryapp" || data.host != "oauth") return null

        val error = data.getQueryParameter("error")
        if (!error.isNullOrBlank()) {
            return OAuthResult.Error(error)
        }

        val accessToken = data.getQueryParameter("accessToken")
        val refreshToken = data.getQueryParameter("refreshToken")

        if (!accessToken.isNullOrBlank() && !refreshToken.isNullOrBlank()) {
            return OAuthResult.Success(accessToken, refreshToken)
        }

        return OAuthResult.Error("Missing access or refresh token from callback")
    }
}
