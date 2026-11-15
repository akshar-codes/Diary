package com.notes.diaryapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notes.diaryapp.data.model.DiaryEntry
import com.notes.diaryapp.data.repository.DiaryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

data class DiaryUiState(
    val currentDateStr: String = "",
    val currentDisplayDate: String = "",
    val content: String = "",
    val currentEntry: DiaryEntry? = null,
    val isLoading: Boolean = false,
    val isSaving: Boolean = false,
    val saveStatus: String? = null,
    val isOffline: Boolean = false,
)

class DiaryViewModel(
    private val diaryRepository: DiaryRepository = DiaryRepository(),
) : ViewModel() {
    private val calendar = Calendar.getInstance()
    private val dateFormat = SimpleDateFormat("yyyy-MM-dd", Locale.US)
    private val displayFormat = SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.US)

    private val _uiState =
        MutableStateFlow(
            DiaryUiState(
                currentDateStr = dateFormat.format(calendar.time),
                currentDisplayDate = displayFormat.format(calendar.time),
            ),
        )
    val uiState: StateFlow<DiaryUiState> = _uiState.asStateFlow()

    init {
        loadEntryForDate(_uiState.value.currentDateStr)
    }

    fun onContentChange(newContent: String) {
        _uiState.update { it.copy(content = newContent, saveStatus = null) }
    }

    fun changeDate(offsetDays: Int) {
        calendar.add(Calendar.DAY_OF_YEAR, offsetDays)
        updateDateAndLoad()
    }

    fun goToToday() {
        calendar.time = Date()
        updateDateAndLoad()
    }

    private fun updateDateAndLoad() {
        val dateStr = dateFormat.format(calendar.time)
        val displayStr = displayFormat.format(calendar.time)
        _uiState.update {
            it.copy(
                currentDateStr = dateStr,
                currentDisplayDate = displayStr,
                saveStatus = null,
            )
        }
        loadEntryForDate(dateStr)
    }

    fun loadEntryForDate(dateKey: String) {
        _uiState.update { it.copy(isLoading = true, isOffline = false, saveStatus = null) }
        viewModelScope.launch {
            val result = diaryRepository.getEntryByDate(dateKey)
            result.fold(
                onSuccess = { entry ->
                    _uiState.update {
                        it.copy(
                            isLoading = false,
                            currentEntry = entry,
                            content = entry?.content ?: "",
                            isOffline = false,
                        )
                    }
                },
                onFailure = {
                    _uiState.update { it.copy(isLoading = false, isOffline = true) }
                },
            )
        }
    }

    fun saveEntry() {
        val state = _uiState.value
        if (state.content.isBlank()) return

        _uiState.update { it.copy(isSaving = true, saveStatus = null) }
        viewModelScope.launch {
            val tz = TimeZone.getDefault().id
            val result =
                diaryRepository.saveEntry(
                    dateKey = state.currentDateStr,
                    content = state.content,
                    timezone = tz,
                )
            result.fold(
                onSuccess = { entry ->
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            currentEntry = entry,
                            saveStatus = "Saved successfully",
                            isOffline = false,
                        )
                    }
                },
                onFailure = { error ->
                    _uiState.update {
                        it.copy(
                            isSaving = false,
                            saveStatus = "Error: ${error.message}",
                            isOffline = true,
                        )
                    }
                },
            )
        }
    }
}
