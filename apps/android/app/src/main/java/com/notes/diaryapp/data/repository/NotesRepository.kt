package com.notes.diaryapp.data.repository

import com.notes.diaryapp.data.model.*
import com.notes.diaryapp.data.remote.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class NotesRepository {
    suspend fun getNotes(
        folderId: String? = null,
        status: String = "active",
        search: String? = null,
        sort: String = "updated_desc",
    ): Result<List<Note>> =
        withContext(Dispatchers.IO) {
            try {
                val response =
                    ApiClient.getService().getNotes(
                        folderId = folderId,
                        status = status,
                        search = search?.ifBlank { null },
                        sort = sort,
                    )
                if (response.success && response.data != null) {
                    Result.success(response.data.items)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to load notes"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error loading notes"))
            }
        }

    suspend fun getNoteById(id: String): Result<Note> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().getNoteById(id)
                if (response.success && response.data != null) {
                    Result.success(response.data)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Note not found"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error loading note"))
            }
        }

    suspend fun createNote(
        title: String,
        content: String,
        folderId: String? = null,
        tags: List<String> = emptyList(),
        isPinned: Boolean = false,
    ): Result<Note> =
        withContext(Dispatchers.IO) {
            try {
                val response =
                    ApiClient.getService().createNote(
                        CreateNoteRequest(
                            title = title.trim(),
                            content = content,
                            folderId = folderId,
                            tags = tags,
                            isPinned = isPinned,
                        ),
                    )
                if (response.success && response.data != null) {
                    Result.success(response.data)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to create note"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error creating note"))
            }
        }

    suspend fun updateNote(
        id: String,
        title: String? = null,
        content: String? = null,
        folderId: String? = null,
        tags: List<String>? = null,
        isPinned: Boolean? = null,
    ): Result<Note> =
        withContext(Dispatchers.IO) {
            try {
                val response =
                    ApiClient.getService().updateNote(
                        id = id,
                        request =
                            UpdateNoteRequest(
                                title = title?.trim(),
                                content = content,
                                folderId = folderId,
                                tags = tags,
                                isPinned = isPinned,
                            ),
                    )
                if (response.success && response.data != null) {
                    Result.success(response.data)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to update note"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error updating note"))
            }
        }

    suspend fun deleteNote(id: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().deleteNote(id)
                if (response.success) {
                    Result.success(Unit)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to delete note"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error deleting note"))
            }
        }

    suspend fun togglePin(id: String): Result<Note> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().togglePin(id)
                if (response.success && response.data != null) {
                    Result.success(response.data)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to toggle pin"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error toggling pin"))
            }
        }

    suspend fun getFolders(): Result<List<NoteFolder>> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().getFolders()
                if (response.success && response.data != null) {
                    Result.success(response.data)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to load folders"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error loading folders"))
            }
        }

    suspend fun createFolder(name: String): Result<NoteFolder> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().createFolder(CreateFolderRequest(name.trim()))
                if (response.success && response.data != null) {
                    Result.success(response.data)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to create folder"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error creating folder"))
            }
        }

    suspend fun deleteFolder(id: String): Result<Unit> =
        withContext(Dispatchers.IO) {
            try {
                val response = ApiClient.getService().deleteFolder(id)
                if (response.success) {
                    Result.success(Unit)
                } else {
                    Result.failure(Exception(response.error ?: response.message ?: "Failed to delete folder"))
                }
            } catch (e: Exception) {
                Result.failure(Exception(e.localizedMessage ?: "Network error deleting folder"))
            }
        }
}
