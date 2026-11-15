package com.notes.diaryapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notes.diaryapp.data.model.ReleaseInfo
import com.notes.diaryapp.data.repository.AuthRepository
import com.notes.diaryapp.data.repository.UpdateRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class SettingsUiState(
    val userName: String = "User",
    val userEmail: String = "",
    val isPinEnabled: Boolean = false,
    val showPinDialog: Boolean = false,
    val pinInput: String = "",
    val pinError: String? = null,
    val showLogoutConfirm: Boolean = false,
    val isCheckingUpdate: Boolean = false,
    val availableRelease: ReleaseInfo? = null,
    val isUpdateMandatory: Boolean = false,
    val updateMessage: String? = null,
)

class SettingsViewModel(
    private val authRepository: AuthRepository = AuthRepository(),
) : ViewModel() {
    private val updateRepository = UpdateRepository()

    private val _uiState =
        MutableStateFlow(
            SettingsUiState(
                userName = authRepository.getUserName() ?: "User",
                userEmail = authRepository.getUserEmail() ?: "",
                isPinEnabled = authRepository.isPinEnabled(),
            ),
        )
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    fun openPinDialog() {
        _uiState.update { it.copy(showPinDialog = true, pinInput = "", pinError = null) }
    }

    fun closePinDialog() {
        _uiState.update { it.copy(showPinDialog = false, pinInput = "", pinError = null) }
    }

    fun onPinInputChange(input: String) {
        if (input.length <= 4 && input.all { it.isDigit() }) {
            _uiState.update { it.copy(pinInput = input, pinError = null) }
        }
    }

    fun savePin() {
        val pin = _uiState.value.pinInput
        if (pin.length == 4) {
            authRepository.setPin(pin)
            _uiState.update {
                it.copy(
                    isPinEnabled = true,
                    showPinDialog = false,
                    pinInput = "",
                    pinError = null,
                )
            }
        } else {
            _uiState.update { it.copy(pinError = "PIN must be exactly 4 digits.") }
        }
    }

    fun disablePin() {
        authRepository.setPin(null)
        _uiState.update { it.copy(isPinEnabled = false) }
    }

    fun openLogoutConfirm() {
        _uiState.update { it.copy(showLogoutConfirm = true) }
    }

    fun closeLogoutConfirm() {
        _uiState.update { it.copy(showLogoutConfirm = false) }
    }

    fun logout(onLogoutSuccess: () -> Unit) {
        viewModelScope.launch {
            authRepository.logout()
            _uiState.update { it.copy(showLogoutConfirm = false) }
            onLogoutSuccess()
        }
    }

    fun checkForUpdates() {
        _uiState.update { it.copy(isCheckingUpdate = true, updateMessage = null) }
        viewModelScope.launch {
            val result = updateRepository.checkForUpdate(force = true)
            _uiState.update {
                it.copy(
                    isCheckingUpdate = false,
                    availableRelease = if (result.updateAvailable) result.release else null,
                    isUpdateMandatory = result.isMandatory,
                    updateMessage = if (!result.updateAvailable && result.error == null) "You're on the latest version." else result.error,
                )
            }
        }
    }

    fun dismissUpdateDialog() {
        _uiState.update { it.copy(availableRelease = null) }
    }
}
