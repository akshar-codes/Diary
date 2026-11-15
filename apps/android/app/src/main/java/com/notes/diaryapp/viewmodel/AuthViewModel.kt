package com.notes.diaryapp.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.notes.diaryapp.data.repository.AuthRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class LoginUiState(
    val email: String = "",
    val password: String = "",
    val isPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false,
)

data class RegisterUiState(
    val name: String = "",
    val email: String = "",
    val password: String = "",
    val isPasswordVisible: Boolean = false,
    val isLoading: Boolean = false,
    val errorMessage: String? = null,
    val isSuccess: Boolean = false,
)

data class PinLockUiState(
    val enteredPin: String = "",
    val errorMessage: String? = null,
    val isUnlocked: Boolean = false,
)

class AuthViewModel(
    private val authRepository: AuthRepository = AuthRepository(),
) : ViewModel() {
    private val _loginState = MutableStateFlow(LoginUiState())
    val loginState: StateFlow<LoginUiState> = _loginState.asStateFlow()

    private val _registerState = MutableStateFlow(RegisterUiState())
    val registerState: StateFlow<RegisterUiState> = _registerState.asStateFlow()

    private val _pinState = MutableStateFlow(PinLockUiState())
    val pinState: StateFlow<PinLockUiState> = _pinState.asStateFlow()

    // --- Login Actions ---
    fun onEmailChange(newEmail: String) {
        _loginState.update { it.copy(email = newEmail, errorMessage = null) }
    }

    fun onPasswordChange(newPassword: String) {
        _loginState.update { it.copy(password = newPassword, errorMessage = null) }
    }

    fun togglePasswordVisibility() {
        _loginState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun login(onSuccess: () -> Unit) {
        val state = _loginState.value
        if (state.email.isBlank() || state.password.isBlank()) {
            _loginState.update { it.copy(errorMessage = "Please enter both email and password.") }
            return
        }

        _loginState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            val result = authRepository.login(state.email, state.password)
            result.fold(
                onSuccess = {
                    _loginState.update { it.copy(isLoading = false, isSuccess = true) }
                    onSuccess()
                },
                onFailure = { error ->
                    _loginState.update { it.copy(isLoading = false, errorMessage = error.message) }
                },
            )
        }
    }

    // --- Register Actions ---
    fun onRegisterNameChange(newName: String) {
        _registerState.update { it.copy(name = newName, errorMessage = null) }
    }

    fun onRegisterEmailChange(newEmail: String) {
        _registerState.update { it.copy(email = newEmail, errorMessage = null) }
    }

    fun onRegisterPasswordChange(newPassword: String) {
        _registerState.update { it.copy(password = newPassword, errorMessage = null) }
    }

    fun toggleRegisterPasswordVisibility() {
        _registerState.update { it.copy(isPasswordVisible = !it.isPasswordVisible) }
    }

    fun register(onSuccess: () -> Unit) {
        val state = _registerState.value
        if (state.name.isBlank() || state.email.isBlank() || state.password.isBlank()) {
            _registerState.update { it.copy(errorMessage = "Please fill in all fields.") }
            return
        }
        if (state.password.length < 8) {
            _registerState.update { it.copy(errorMessage = "Password must be at least 8 characters long.") }
            return
        }

        _registerState.update { it.copy(isLoading = true, errorMessage = null) }
        viewModelScope.launch {
            val result = authRepository.register(state.name, state.email, state.password)
            result.fold(
                onSuccess = {
                    _registerState.update { it.copy(isLoading = false, isSuccess = true) }
                    onSuccess()
                },
                onFailure = { error ->
                    _registerState.update { it.copy(isLoading = false, errorMessage = error.message) }
                },
            )
        }
    }

    // --- PIN Lock Actions ---
    fun onPinDigit(
        digit: String,
        onUnlock: () -> Unit,
    ) {
        val currentPin = _pinState.value.enteredPin
        if (currentPin.length < 4) {
            val newPin = currentPin + digit
            _pinState.update { it.copy(enteredPin = newPin, errorMessage = null) }

            if (newPin.length == 4) {
                if (authRepository.verifyPin(newPin)) {
                    _pinState.update { it.copy(isUnlocked = true) }
                    onUnlock()
                } else {
                    _pinState.update { it.copy(enteredPin = "", errorMessage = "Incorrect PIN. Please try again.") }
                }
            }
        }
    }

    fun onPinBackspace() {
        val currentPin = _pinState.value.enteredPin
        if (currentPin.isNotEmpty()) {
            _pinState.update { it.copy(enteredPin = currentPin.dropLast(1), errorMessage = null) }
        }
    }

    fun logoutFromPinLock(onLogout: () -> Unit) {
        authRepository.clearSession()
        onLogout()
    }
}
