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

data class TopicDetailUiState(
    val topic: TopicPage? = null,
    val isLoading: Boolean = true,
    val isOffline: Boolean = false,
    val errorMessage: String? = null,
)

class TopicDetailViewModel(
    private val diaryRepository: DiaryRepository = DiaryRepository(),
) : ViewModel() {
    private val _uiState = MutableStateFlow(TopicDetailUiState())
    val uiState: StateFlow<TopicDetailUiState> = _uiState.asStateFlow()

    fun loadTopic(topicId: String) {
        _uiState.update { it.copy(isLoading = true, isOffline = false, errorMessage = null) }
        viewModelScope.launch {
            val result = diaryRepository.getTopicById(topicId)
            result.fold(
                onSuccess = { topic ->
                    _uiState.update { it.copy(isLoading = false, topic = topic, isOffline = false) }
                },
                onFailure = { error ->
                    _uiState.update { it.copy(isLoading = false, isOffline = true, errorMessage = error.message) }
                },
            )
        }
    }
}
