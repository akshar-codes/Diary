package com.notes.diaryapp

import com.notes.diaryapp.auth.OAuthResult
import com.notes.diaryapp.data.model.User
import com.notes.diaryapp.data.model.ResendVerificationRequest
import com.notes.diaryapp.data.model.VerifyEmailRequest
import org.junit.Assert.*
import org.junit.Test

class AuthLogicTest {

    @Test
    fun testUserInstantiationWithOAuthFields() {
        val user = User(
            id = "user_456",
            name = "Test User",
            email = "test@example.com",
            provider = "google",
            avatarUrl = "https://lh3.googleusercontent.com/avatar",
            emailVerified = true
        )

        assertEquals("user_456", user.id)
        assertEquals("google", user.provider)
        assertEquals("https://lh3.googleusercontent.com/avatar", user.avatarUrl)
        assertTrue(user.emailVerified)
    }

    @Test
    fun testOAuthResultSuccess() {
        val success = OAuthResult.Success(
            accessToken = "access_123",
            refreshToken = "refresh_456"
        )
        assertEquals("access_123", success.accessToken)
        assertEquals("refresh_456", success.refreshToken)
    }

    @Test
    fun testOAuthResultError() {
        val error = OAuthResult.Error("oauth_failed")
        assertEquals("oauth_failed", error.message)
    }

    @Test
    fun testVerificationRequests() {
        val resendReq = ResendVerificationRequest("user@example.com")
        assertEquals("user@example.com", resendReq.email)

        val verifyReq = VerifyEmailRequest("token_xyz_789")
        assertEquals("token_xyz_789", verifyReq.token)
    }
}
