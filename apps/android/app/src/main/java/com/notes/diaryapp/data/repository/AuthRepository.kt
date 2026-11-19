package com.notes.diaryapp.data.repository

import com.notes.diaryapp.auth.TokenManager
import com.notes.diaryapp.data.model.*
import com.notes.diaryapp.data.remote.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class AuthRepository {
    suspend fun login(
        email: String,
        password: String,
    ): Result<User> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().login(LoginRequest(email.trim(), password))
                if (response.success && response.data != null) {
                    val authData = response.data
                    TokenManager.saveTokens(authData.tokens.accessToken, authData.tokens.refreshToken)
                    TokenManager.saveUserInfo(authData.user.id, authData.user.name, authData.user.email)
                    Result.success(authData.user)
                } else {
                    val errorMsg = response.error ?: response.message ?: "Invalid email or password"
                    Result.failure(Exception(errorMsg))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Unable to connect to server"))
            }
        }

    suspend fun register(
        name: String,
        email: String,
        password: String,
    ): Result<AuthResponse> =
        withContext(Dispatchers.IO) {
            try {
                val response =
                    ApiClient.getService().register(
                        RegisterRequest(name = name.trim(), email = email.trim(), password = password),
                    )
                if (response.success && response.data != null) {
                    val authData = response.data
                    // If server already returned tokens (e.g. OAuth or pre-verified)
                    if (authData.tokens.accessToken.isNotBlank()) {
                        TokenManager.saveTokens(authData.tokens.accessToken, authData.tokens.refreshToken)
                        TokenManager.saveUserInfo(authData.user.id, authData.user.name, authData.user.email)
                    }
                    Result.success(authData)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Registration failed"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Unable to connect to server"))
            }
        }

    suspend fun handleOAuthTokens(
        accessToken: String,
        refreshToken: String,
    ): Result<User> =
        withContext(Dispatchers.IO) {
            try {
                TokenManager.saveTokens(accessToken, refreshToken)
                val response = ApiClient.getService().getMe()
                if (response.success && response.data != null) {
                    val user = response.data
                    TokenManager.saveUserInfo(user.id, user.name, user.email)
                    Result.success(user)
                } else {
                    TokenManager.clearSession()
                    Result.failure(Exception(response.error ?: "Failed to retrieve user profile"))
                }
            } catch (e: Exception) {
                TokenManager.clearSession()
                Result.failure(Exception(e.localizedMessage ?: "Failed to complete social login"))
            }
        }

    suspend fun resendVerification(email: String): Result<String> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().resendVerification(ResendVerificationRequest(email.trim()))
                if (response.success) {
                    Result.success(response.message ?: "Verification email sent successfully.")
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to resend email"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Unable to reach server"))
            }
        }

    suspend fun verifyEmail(token: String): Result<User> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().verifyEmail(token.trim())
                if (response.success && response.data != null) {
                    val authData = response.data
                    TokenManager.saveTokens(authData.tokens.accessToken, authData.tokens.refreshToken)
                    TokenManager.saveUserInfo(authData.user.id, authData.user.name, authData.user.email)
                    Result.success(authData.user)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Invalid or expired token"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Unable to verify email"))
            }
        }

    suspend fun logout(): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val refreshToken = TokenManager.getRefreshToken()
                if (!refreshToken.isNullOrBlank()) {
                    ApiClient.getService().logout(RefreshTokenRequest(refreshToken))
                }
            } catch (_: Exception) {
                // Ignore server-side logout errors; clear local credentials regardless
            } finally {
                TokenManager.clearSession()
            }
            Result.success(Unit)
        }

    fun isLoggedIn(): Boolean = TokenManager.isLoggedIn()

    fun isPinEnabled(): Boolean = TokenManager.isPinEnabled()

    fun verifyPin(pin: String): Boolean = TokenManager.verifyPin(pin)

    fun setPin(pin: String?) = TokenManager.setPin(pin)

    fun getUserName(): String? = TokenManager.getUserName()

    fun getUserEmail(): String? = TokenManager.getUserEmail()

    fun clearSession() = TokenManager.clearSession()
}
