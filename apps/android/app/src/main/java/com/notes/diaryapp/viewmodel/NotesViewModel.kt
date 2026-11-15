package com.notes.diaryapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notes.diaryapp.data.model.Note
import com.notes.diaryapp.data.model.NoteFolder
import com.notes.diaryapp.data.repository.NotesRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class NotesUiState(
    val notes: List<Note> = emptyList(),
    val folders: List<NoteFolder> = emptyList(),
    val selectedFolderId: String? = null,
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val isOffline: Boolean = false,
    val showCreateFolderDialog: Boolean = false,
    val newFolderName: String = "",
    val noteToDelete: Note? = null,
)

class NotesViewModel(
    private val notesRepository: NotesRepository = NotesRepository(),
) : ViewModel() {
    private val _uiState = MutableStateFlow(NotesUiState())
    val uiState: StateFlow<NotesUiState> = _uiState.asStateFlow()

    init {
        loadData()
    }

    fun onSearchQueryChange(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        loadNotesOnly()
    }

    fun onSelectFolder(folderId: String?) {
        _uiState.update { it.copy(selectedFolderId = folderId) }
        loadNotesOnly()
    }

    fun openCreateFolderDialog() {
        _uiState.update { it.copy(showCreateFolderDialog = true, newFolderName = "") }
    }

    fun closeCreateFolderDialog() {
        _uiState.update { it.copy(showCreateFolderDialog = false, newFolderName = "") }
    }

    fun onNewFolderNameChange(name: String) {
        _uiState.update { it.copy(newFolderName = name) }
    }

    fun setNoteToDelete(note: Note?) {
        _uiState.update { it.copy(noteToDelete = note) }
    }

    fun loadData() {
        _uiState.update { it.copy(isLoading = true, isOffline = false) }
        viewModelScope.launch {
            val foldersRes = notesRepository.getFolders()
            foldersRes.onSuccess { list ->
                _uiState.update { it.copy(folders = list) }
            }

            val notesRes =
                notesRepository.getNotes(
                    folderId = _uiState.value.selectedFolderId,
                    status = "active",
                    search = _uiState.value.searchQuery.ifBlank { null },
                )
            notesRes.fold(
                onSuccess = { notes ->
                    _uiState.update { it.copy(isLoading = false, notes = notes, isOffline = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false, isOffline = true) }
                },
            )
        }
    }

    private fun loadNotesOnly() {
        viewModelScope.launch {
            val notesRes =
                notesRepository.getNotes(
                    folderId = _uiState.value.selectedFolderId,
                    status = "active",
                    search = _uiState.value.searchQuery.ifBlank { null },
                )
            notesRes.fold(
                onSuccess = { notes ->
                    _uiState.update { it.copy(notes = notes, isOffline = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isOffline = true) }
                },
            )
        }
    }

    fun togglePin(note: Note) {
        viewModelScope.launch {
            val res = notesRepository.togglePin(note.id)
            if (res.isSuccess) {
                loadNotesOnly()
            }
        }
    }

    fun deleteConfirmed() {
        val note = _uiState.value.noteToDelete ?: return
        viewModelScope.launch {
            val res = notesRepository.deleteNote(note.id)
            if (res.isSuccess) {
                _uiState.update { it.copy(noteToDelete = null) }
                loadNotesOnly()
            }
        }
    }

    fun createFolder() {
        val name = _uiState.value.newFolderName.trim()
        if (name.isBlank()) return

        viewModelScope.launch {
            val res = notesRepository.createFolder(name)
            if (res.isSuccess) {
                _uiState.update { it.copy(showCreateFolderDialog = false, newFolderName = "") }
                loadData()
            }
        }
    }
}
