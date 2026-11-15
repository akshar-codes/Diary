package com.notes.diaryapp.data.repository

import com.notes.diaryapp.data.model.*
import com.notes.diaryapp.data.remote.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class DiaryRepository {
    suspend fun getEntryByDate(dateKey: String): Result<DiaryEntry?> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().getDiaryEntryByDate(dateKey)
                if (response.success) {
                    Result.success(response.data)
                } else {
                    Result.success(null)
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Failed to load diary entry"))
            }
        }

    suspend fun saveEntry(
        dateKey: String,
        content: String,
        timezone: String = "UTC",
    ): Result<DiaryEntry> =
        withContext(Dispatchers.IO) {
            try {
                val response =
                    ApiClient.getService().saveDiaryEntry(
                        CreateDiaryEntryRequest(dateKey = dateKey, content = content, timezone = timezone),
                    )
                if (response.success && response.data != null) {
                    Result.success(response.data)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to save diary entry"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error saving entry"))
            }
        }

    suspend fun deleteEntry(id: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().deleteDiaryEntry(id)
                if (response.success) {
                    Result.success(Unit)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to delete entry"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error deleting entry"))
            }
        }

    suspend fun getTopics(
        page: Int = 1,
        limit: Int = 100,
    ): Result<List<TopicPage>> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().getTopics(page = page, limit = limit)
                if (response.success && response.data != null) {
                    Result.success(response.data.items)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to load topics"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error loading topics"))
            }
        }

    suspend fun getTopicById(id: String): Result<TopicPage> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().getTopicById(id)
                if (response.success && response.data != null) {
                    Result.success(response.data)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Topic not found"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error loading topic details"))
            }
        }

    suspend fun createTopic(
        title: String,
        content: String = "",
    ): Result<TopicPage> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().createTopic(CreateTopicRequest(title = title.trim(), content = content))
                if (response.success && response.data != null) {
                    Result.success(response.data)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to create topic"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error creating topic"))
            }
        }

    suspend fun deleteTopic(id: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().deleteTopic(id)
                if (response.success) {
                    Result.success(Unit)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to delete topic"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error deleting topic"))
            }
        }
}
