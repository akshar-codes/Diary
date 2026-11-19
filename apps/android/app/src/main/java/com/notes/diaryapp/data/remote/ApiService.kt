package com.notes.diaryapp.data.remote

import com.notes.diaryapp.data.model.*
import retrofit2.Call
import retrofit2.http.*

interface ApiService {

    // --- Authentication ---
    @POST("auth/login")
    suspend fun login(@Body request: LoginRequest): ApiResponse<AuthResponse>

    @POST("auth/register")
    suspend fun register(@Body request: RegisterRequest): ApiResponse<AuthResponse>

    @POST("auth/resend-verification")
    suspend fun resendVerification(@Body request: ResendVerificationRequest): ApiResponse<Unit>

    @GET("auth/verify-email")
    suspend fun verifyEmail(@Query("token") token: String): ApiResponse<AuthResponse>

    @POST("auth/refresh")
    suspend fun refreshToken(@Body request: RefreshTokenRequest): ApiResponse<AuthTokens>

    @POST("auth/refresh")
    fun refreshTokenSync(@Body request: RefreshTokenRequest): Call<ApiResponse<AuthTokens>>

    @POST("auth/logout")
    suspend fun logout(@Body request: RefreshTokenRequest): ApiResponse<Unit>

    @GET("auth/me")
    suspend fun getMe(): ApiResponse<User>

    // --- Releases ---
    @GET("releases/android")
    suspend fun getAndroidRelease(): ApiResponse<ReleaseInfo>

    // --- Diary ---
    @GET("diary/entries")
    suspend fun getDiaryEntries(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): ApiResponse<PaginatedResult<DiaryEntry>>

    @GET("diary/entries/by-date/{date}")
    suspend fun getDiaryEntryByDate(@Path("date") date: String): ApiResponse<DiaryEntry>

    @POST("diary/entries")
    suspend fun saveDiaryEntry(@Body request: CreateDiaryEntryRequest): ApiResponse<DiaryEntry>

    @DELETE("diary/entries/{id}")
    suspend fun deleteDiaryEntry(@Path("id") id: String): ApiResponse<Unit>

    @GET("diary/entries/summary")
    suspend fun getDatesSummary(
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): ApiResponse<List<DiaryDateSummary>>

    // --- Topics ---
    @GET("diary/topics")
    suspend fun getTopics(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 50
    ): ApiResponse<PaginatedResult<TopicPage>>

    @GET("diary/topics/{id}")
    suspend fun getTopicById(@Path("id") id: String): ApiResponse<TopicPage>

    @POST("diary/topics")
    suspend fun createTopic(@Body request: CreateTopicRequest): ApiResponse<TopicPage>

    @DELETE("diary/topics/{id}")
    suspend fun deleteTopic(@Path("id") id: String): ApiResponse<Unit>

    // --- Notes ---
    @GET("notes")
    suspend fun getNotes(
        @Query("folderId") folderId: String? = null,
        @Query("status") status: String? = "active",
        @Query("search") search: String? = null,
        @Query("sort") sort: String? = "updated_desc"
    ): ApiResponse<PaginatedResult<Note>>

    @GET("notes/{id}")
    suspend fun getNoteById(@Path("id") id: String): ApiResponse<Note>

    @POST("notes")
    suspend fun createNote(@Body request: CreateNoteRequest): ApiResponse<Note>

    @PATCH("notes/{id}")
    suspend fun updateNote(
        @Path("id") id: String,
        @Body request: UpdateNoteRequest
    ): ApiResponse<Note>

    @DELETE("notes/{id}")
    suspend fun deleteNote(@Path("id") id: String): ApiResponse<Unit>

    @PATCH("notes/{id}/pin")
    suspend fun togglePin(@Path("id") id: String): ApiResponse<Note>

    @PATCH("notes/{id}/archive")
    suspend fun toggleArchive(@Path("id") id: String): ApiResponse<Note>

    // --- Folders ---
    @GET("folders")
    suspend fun getFolders(): ApiResponse<List<NoteFolder>>

    @POST("folders")
    suspend fun createFolder(@Body request: CreateFolderRequest): ApiResponse<NoteFolder>

    @DELETE("folders/{id}")
    suspend fun deleteFolder(@Path("id") id: String): ApiResponse<Unit>
}
