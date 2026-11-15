package com.notes.diaryapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notes.diaryapp.data.model.NoteFolder
import com.notes.diaryapp.data.repository.NotesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NoteEditorUiState(
    val noteId: String? = null,
    val title: String = "",
    val content: String = "",
    val tagsInput: String = "",
    val isPinned: Boolean = false,
    val folderId: String? = null,
    val folders: List<NoteFolder> = emptyList(),
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val isOffline: Boolean = false,
    val showDeleteConfirm: Boolean = false,
    val isSaved: Boolean = false,
)

class NoteEditorViewModel(
    private val notesRepository: NotesRepository = NotesRepository(),
) : ViewModel() {
    private val _uiState = MutableStateFlow(NoteEditorUiState())
    val uiState: StateFlow<NoteEditorUiState> = _uiState.asStateFlow()

    fun initNote(id: String?) {
        _uiState.update { it.copy(noteId = id, isLoading = !id.isNullOrBlank()) }
        loadFolders()

        if (!id.isNullOrBlank()) {
            loadNote(id)
        }
    }

    private fun loadFolders() {
        viewModelScope.launch {
            val res = notesRepository.getFolders()
            res.onSuccess { folders ->
                _uiState.update { it.copy(folders = folders) }
            }
        }
    }

    private fun loadNote(id: String) {
        viewModelScope.launch {
            val res = notesRepository.getNoteById(id)
            res.fold(
                onSuccess = { note ->
                    _uiState.update {
                        it.copy(
                            title = note.title,
                            content = note.content,
                            tagsInput = note.tags.joinToString(", "),
                            isPinned = note.isPinned,
                            folderId = note.folderId,
                            isLoading = false,
                        )
                    }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false, isOffline = true) }
                },
            )
        }
    }

    fun onTitleChange(title: String) {
        _uiState.update { it.copy(title = title) }
    }

    fun onContentChange(content: String) {
        _uiState.update { it.copy(content = content) }
    }

    fun onTagsChange(tags: String) {
        _uiState.update { it.copy(tagsInput = tags) }
    }

    fun togglePin() {
        _uiState.update { it.copy(isPinned = !it.isPinned) }
    }

    fun onFolderSelect(folderId: String?) {
        _uiState.update { it.copy(folderId = folderId) }
    }

    fun openDeleteConfirm() {
        _uiState.update { it.copy(showDeleteConfirm = true) }
    }

    fun closeDeleteConfirm() {
        _uiState.update { it.copy(showDeleteConfirm = false) }
    }

    private fun parseTags(): List<String> =
        _uiState.value.tagsInput
            .split(",")
            .map { it.trim().removePrefix("#") }
            .filter { it.isNotBlank() }

    fun saveNote(onDone: () -> Unit) {
        val state = _uiState.value
        if (state.title.isBlank() && state.content.isBlank()) {
            onDone()
            return
        }

        _uiState.update { it.copy(isSaving = true) }
        viewModelScope.launch {
            val res =
                if (state.noteId.isNullOrBlank()) {
                    notesRepository.createNote(
                        title = state.title,
                        content = state.content,
                        folderId = state.folderId,
                        tags = parseTags(),
                        isPinned = state.isPinned,
                    )
                } else {
                    notesRepository.updateNote(
                        id = state.noteId,
                        title = state.title,
                        content = state.content,
                        folderId = state.folderId,
                        tags = parseTags(),
                        isPinned = state.isPinned,
                    )
                }

            res.fold(
                onSuccess = {
                    _uiState.update { it.copy(isSaving = false, isSaved = true) }
                    onDone()
                },
                onFailure = {
                    _uiState.update { it.copy(isSaving = false, isOffline = true) }
                },
            )
        }
    }

    fun deleteNote(onDone: () -> Unit) {
        val id =
            _uiState.value.noteId ?: run {
                onDone()
                return
            }

        viewModelScope.launch {
            val res = notesRepository.deleteNote(id)
            if (res.isSuccess) {
                onDone()
            }
        }
    }
}
