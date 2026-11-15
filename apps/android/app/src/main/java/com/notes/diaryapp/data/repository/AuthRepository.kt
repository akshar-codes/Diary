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
                    Result.failure(Exception(response.error ?: response.message ?: "Invalid email or password"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Unable to connect to server"))
            }
        }

    suspend fun register(
        name: String,
        email: String,
        password: String,
    ): Result<User> =
        withContext(Dispatchers.IO) {
            try {
                val response =
                    ApiClient.getService().register(
                        RegisterRequest(name = name.trim(), email = email.trim(), password = password),
                    )
                if (response.success && response.data != null) {
                    val authData = response.data
                    TokenManager.saveTokens(authData.tokens.accessToken, authData.tokens.refreshToken)
                    TokenManager.saveUserInfo(authData.user.id, authData.user.name, authData.user.email)
                    Result.success(authData.user)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Registration failed"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Unable to connect to server"))
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
