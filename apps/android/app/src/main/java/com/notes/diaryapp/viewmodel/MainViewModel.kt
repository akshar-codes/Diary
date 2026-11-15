package com.notes.diaryapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notes.diaryapp.data.model.ReleaseInfo
import com.notes.diaryapp.data.repository.UpdateRepository
import com.notes.diaryapp.ui.navigation.BottomTab
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MainUiState(
    val activeTab: BottomTab = BottomTab.Diary,
    val availableRelease: ReleaseInfo? = null,
    val isUpdateMandatory: Boolean = false,
)

class MainViewModel(
    private val updateRepository: UpdateRepository = UpdateRepository(),
) : ViewModel() {
    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    init {
        checkStartupUpdate()
    }

    fun selectTab(tab: BottomTab) {
        _uiState.update { it.copy(activeTab = tab) }
    }

    fun checkStartupUpdate() {
        viewModelScope.launch {
            val result = updateRepository.checkForUpdate(force = false)
            if (result.updateAvailable && result.release != null) {
                _uiState.update {
                    it.copy(
                        availableRelease = result.release,
                        isUpdateMandatory = result.isMandatory,
                    )
                }
            }
        }
    }

    fun dismissUpdateDialog() {
        _uiState.update { it.copy(availableRelease = null) }
    }
}
