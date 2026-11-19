package com.notes.diaryapp.data.model

import com.google.gson.annotations.SerializedName

data class ApiResponse<T>(
    @SerializedName("success") val success: Boolean = false,
    @SerializedName("data") val data: T? = null,
    @SerializedName("message") val message: String? = null,
    @SerializedName("error") val error: String? = null
)

data class PaginatedResult<T>(
    @SerializedName("items") val items: List<T> = emptyList(),
    @SerializedName("total") val total: Int = 0,
    @SerializedName("page") val page: Int = 1,
    @SerializedName("limit") val limit: Int = 20,
    @SerializedName("totalPages") val totalPages: Int = 1
)

data class User(
    @SerializedName("id") val id: String = "",
    @SerializedName("name") val name: String = "",
    @SerializedName("email") val email: String = "",
    @SerializedName("provider") val provider: String = "email",
    @SerializedName("avatarUrl") val avatarUrl: String? = null,
    @SerializedName("emailVerified") val emailVerified: Boolean = false,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class AuthTokens(
    @SerializedName("accessToken") val accessToken: String = "",
    @SerializedName("refreshToken") val refreshToken: String = ""
)

data class AuthResponse(
    @SerializedName("user") val user: User = User(),
    @SerializedName("tokens") val tokens: AuthTokens = AuthTokens(),
    @SerializedName("emailSent") val emailSent: Boolean = false,
    @SerializedName("email") val email: String? = null,
    @SerializedName("message") val message: String? = null
)

data class LoginRequest(
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class RegisterRequest(
    @SerializedName("name") val name: String,
    @SerializedName("email") val email: String,
    @SerializedName("password") val password: String
)

data class ResendVerificationRequest(
    @SerializedName("email") val email: String
)

data class VerifyEmailRequest(
    @SerializedName("token") val token: String
)

data class RefreshTokenRequest(
    @SerializedName("refreshToken") val refreshToken: String
)

data class TopicDatedLine(
    @SerializedName("dateKey") val dateKey: String = "",
    @SerializedName("line") val line: String = "",
    @SerializedName("cleanLine") val cleanLine: String = ""
)

data class TopicUpdateLine(
    @SerializedName("topicId") val topicId: String = "",
    @SerializedName("topicTitle") val topicTitle: String = "",
    @SerializedName("lines") val lines: List<String> = emptyList()
)

data class TopicPageSummary(
    @SerializedName("id") val id: String = "",
    @SerializedName("title") val title: String = "",
    @SerializedName("preview") val preview: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class DiaryEntry(
    @SerializedName("id") val id: String? = null,
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("dateKey") val dateKey: String = "",
    @SerializedName("timezone") val timezone: String = "UTC",
    @SerializedName("content") val content: String = "",
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null,
    @SerializedName("topics") val topics: List<TopicPageSummary>? = null,
    @SerializedName("topicUpdates") val topicUpdates: List<TopicUpdateLine>? = null
)

data class TopicPage(
    @SerializedName("id") val id: String = "",
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("title") val title: String = "",
    @SerializedName("content") val content: String = "",
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null,
    @SerializedName("diaryDates") val diaryDates: List<String>? = null,
    @SerializedName("diaryEntryCount") val diaryEntryCount: Int = 0,
    @SerializedName("datedLines") val datedLines: List<TopicDatedLine>? = null
)

data class DiaryDateSummary(
    @SerializedName("dateKey") val dateKey: String = "",
    @SerializedName("hasEntry") val hasEntry: Boolean = false,
    @SerializedName("topicCount") val topicCount: Int = 0
)

data class NoteFolder(
    @SerializedName("id") val id: String = "",
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("name") val name: String = "",
    @SerializedName("noteCount") val noteCount: Int = 0,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null
)

data class NoteAttachment(
    @SerializedName("id") val id: String = "",
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("noteId") val noteId: String? = null,
    @SerializedName("fileName") val fileName: String = "",
    @SerializedName("fileType") val fileType: String = "",
    @SerializedName("fileSize") val fileSize: Long = 0,
    @SerializedName("storageKey") val storageKey: String = "",
    @SerializedName("url") val url: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null
)

data class Note(
    @SerializedName("id") val id: String = "",
    @SerializedName("userId") val userId: String? = null,
    @SerializedName("title") val title: String = "",
    @SerializedName("content") val content: String = "",
    @SerializedName("folderId") val folderId: String? = null,
    @SerializedName("folder") val folder: NoteFolder? = null,
    @SerializedName("tags") val tags: List<String> = emptyList(),
    @SerializedName("isPinned") val isPinned: Boolean = false,
    @SerializedName("archivedAt") val archivedAt: String? = null,
    @SerializedName("deletedAt") val deletedAt: String? = null,
    @SerializedName("createdAt") val createdAt: String? = null,
    @SerializedName("updatedAt") val updatedAt: String? = null,
    @SerializedName("attachments") val attachments: List<NoteAttachment>? = null
)

data class ReleaseInfo(
    @SerializedName("platform") val platform: String = "android",
    @SerializedName("latestVersion") val latestVersion: String = "",
    @SerializedName("latestVersionCode") val latestVersionCode: Int = 0,
    @SerializedName("minSupportedVersionCode") val minSupportedVersionCode: Int = 0,
    @SerializedName("mandatoryUpdate") val mandatoryUpdate: Boolean = false,
    @SerializedName("downloadUrl") val downloadUrl: String = "",
    @SerializedName("releaseNotes") val releaseNotes: String = "",
    @SerializedName("publishedAt") val publishedAt: String? = null
)

// Request payloads
data class CreateDiaryEntryRequest(
    @SerializedName("dateKey") val dateKey: String,
    @SerializedName("content") val content: String,
    @SerializedName("timezone") val timezone: String = "UTC"
)

data class CreateTopicRequest(
    @SerializedName("title") val title: String,
    @SerializedName("content") val content: String = ""
)

data class CreateNoteRequest(
    @SerializedName("title") val title: String,
    @SerializedName("content") val content: String,
    @SerializedName("folderId") val folderId: String? = null,
    @SerializedName("tags") val tags: List<String> = emptyList(),
    @SerializedName("isPinned") val isPinned: Boolean = false
)

data class UpdateNoteRequest(
    @SerializedName("title") val title: String? = null,
    @SerializedName("content") val content: String? = null,
    @SerializedName("folderId") val folderId: String? = null,
    @SerializedName("tags") val tags: List<String>? = null,
    @SerializedName("isPinned") val isPinned: Boolean? = null
)

data class CreateFolderRequest(
    @SerializedName("name") val name: String
)
