package com.notes.diaryapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notes.diaryapp.data.model.TopicPage
import com.notes.diaryapp.data.repository.DiaryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class TopicsUiState(
    val topics: List<TopicPage> = emptyList(),
    val searchQuery: String = "",
    val isLoading: Boolean = false,
    val isOffline: Boolean = false,
    val showCreateDialog: Boolean = false,
    val newTopicTitle: String = "",
)

class TopicsViewModel(
    private val diaryRepository: DiaryRepository = DiaryRepository(),
) : ViewModel() {
    private val _uiState = MutableStateFlow(TopicsUiState())
    val uiState: StateFlow<TopicsUiState> = _uiState.asStateFlow()

    init {
        loadTopics()
    }

    fun onSearchQueryChange(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
    }

    fun openCreateDialog() {
        _uiState.update { it.copy(showCreateDialog = true, newTopicTitle = "") }
    }

    fun closeCreateDialog() {
        _uiState.update { it.copy(showCreateDialog = false, newTopicTitle = "") }
    }

    fun onNewTopicTitleChange(title: String) {
        _uiState.update { it.copy(newTopicTitle = title) }
    }

    fun loadTopics() {
        _uiState.update { it.copy(isLoading = true, isOffline = false) }
        viewModelScope.launch {
            val result = diaryRepository.getTopics()
            result.fold(
                onSuccess = { list ->
                    _uiState.update { it.copy(isLoading = false, topics = list, isOffline = false) }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false, isOffline = true) }
                },
            )
        }
    }

    fun createTopic() {
        val title = _uiState.value.newTopicTitle.trim()
        if (title.isBlank()) return

        viewModelScope.launch {
            val result = diaryRepository.createTopic(title)
            result.fold(
                onSuccess = {
                    _uiState.update { it.copy(showCreateDialog = false, newTopicTitle = "") }
                    loadTopics()
                },
                onFailure = {
                    // Dialog remains open or error handled
                },
            )
        }
    }
}
