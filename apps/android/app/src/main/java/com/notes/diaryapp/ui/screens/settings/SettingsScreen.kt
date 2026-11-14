package com.notes.diaryapp.ui.screens.settings

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import com.notes.diaryapp.BuildConfig
import com.notes.diaryapp.auth.TokenManager
import com.notes.diaryapp.data.model.RefreshTokenRequest
import com.notes.diaryapp.data.model.ReleaseInfo
import com.notes.diaryapp.data.remote.ApiClient
import com.notes.diaryapp.ui.components.ConfirmDialog
import com.notes.diaryapp.ui.components.UpdateDialog
import com.notes.diaryapp.update.ApkInstaller
import com.notes.diaryapp.update.UpdateChecker
import kotlinx.coroutines.launch

@Composable
fun SettingsScreen(
    onLogoutSuccess: () -> Unit,
    modifier: Modifier = Modifier
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()

    var userName by remember { mutableStateOf(TokenManager.getUserName() ?: "User") }
    var userEmail by remember { mutableStateOf(TokenManager.getUserEmail() ?: "") }
    var isPinEnabled by remember { mutableStateOf(TokenManager.isPinEnabled()) }

    var showPinDialog by remember { mutableStateOf(false) }
    var pinInput by remember { mutableStateOf("") }
    var pinError by remember { mutableStateOf<String?>(null) }

    var showLogoutConfirm by remember { mutableStateOf(false) }
    var isCheckingUpdate by remember { mutableStateOf(false) }
    var availableRelease by remember { mutableStateOf<ReleaseInfo?>(null) }
    var isUpdateMandatory by remember { mutableStateOf(false) }

    fun checkUpdates() {
        isCheckingUpdate = true
        coroutineScope.launch {
            val result = UpdateChecker.check()
            isCheckingUpdate = false
            if (result.updateAvailable && result.release != null) {
                availableRelease = result.release
                isUpdateMandatory = result.isMandatory
            } else if (result.error != null) {
                Toast.makeText(context, result.error, Toast.LENGTH_SHORT).show()
            } else {
                Toast.makeText(context, "App is up to date (v${BuildConfig.VERSION_NAME})", Toast.LENGTH_SHORT).show()
            }
        }
    }

    fun handleLogout() {
        coroutineScope.launch {
            try {
                val refreshToken = TokenManager.getRefreshToken()
                if (refreshToken != null) {
                    ApiClient.getService().logout(RefreshTokenRequest(refreshToken))
                }
            } catch (e: Exception) {
                // Ignore network error on logout
            } finally {
                TokenManager.clearSession()
                onLogoutSuccess()
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Profile Card
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Default.AccountCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(48.dp)
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(text = userName, style = MaterialTheme.typography.titleMedium)
                    if (userEmail.isNotBlank()) {
                        Text(
                            text = userEmail,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                }
            }
        }

        // Security Section
        Text(
            text = "SECURITY",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("App PIN Lock", style = MaterialTheme.typography.titleMedium)
                        Text(
                            "Require 4-digit PIN when opening app",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    Switch(
                        checked = isPinEnabled,
                        onCheckedChange = { checked ->
                            if (checked) {
                                pinInput = ""
                                pinError = null
                                showPinDialog = true
                            } else {
                                TokenManager.setPin(null)
                                isPinEnabled = false
                            }
                        }
                    )
                }

                if (isPinEnabled) {
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedButton(
                        onClick = {
                            pinInput = ""
                            pinError = null
                            showPinDialog = true
                        }
                    ) {
                        Text("Change PIN")
                    }
                }
            }
        }

        // System & Updates Section
        Text(
            text = "APPLICATION & UPDATES",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Installed Version", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        "${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text("Backend Server", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        if (BuildConfig.API_BASE_URL.contains("10.0.2.2")) "Local Emulator (10.0.2.2)" else "Production (Render)",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = { checkUpdates() },
                    enabled = !isCheckingUpdate,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    if (isCheckingUpdate) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Checking for updates...")
                    } else {
                        Icon(Icons.Default.Refresh, contentDescription = null, modifier = Modifier.size(18.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Check for Updates")
                    }
                }
            }
        }

        // Logout Section
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedButton(
            onClick = { showLogoutConfirm = true },
            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
            modifier = Modifier.fillMaxWidth()
        ) {
            Icon(Icons.Default.ExitToApp, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Log Out")
        }
    }

    if (showPinDialog) {
        AlertDialog(
            onDismissRequest = { showPinDialog = false },
            title = { Text("Set 4-Digit PIN") },
            text = {
                Column {
                    OutlinedTextField(
                        value = pinInput,
                        onValueChange = {
                            if (it.length <= 4 && it.all { char -> char.isDigit() }) {
                                pinInput = it
                                pinError = null
                            }
                        },
                        label = { Text("Enter 4 digits") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                    if (pinError != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(pinError ?: "", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        if (pinInput.length == 4) {
                            TokenManager.setPin(pinInput)
                            isPinEnabled = true
                            showPinDialog = false
                            Toast.makeText(context, "PIN code set successfully", Toast.LENGTH_SHORT).show()
                        } else {
                            pinError = "PIN must be exactly 4 digits."
                        }
                    }
                ) {
                    Text("Save PIN")
                }
            },
            dismissButton = {
                TextButton(onClick = { showPinDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (availableRelease != null) {
        UpdateDialog(
            release = availableRelease!!,
            isMandatory = isUpdateMandatory,
            onUpdateClick = {
                ApkInstaller.downloadAndInstall(context, availableRelease!!.downloadUrl)
                if (!isUpdateMandatory) {
                    availableRelease = null
                }
            },
            onDismissClick = {
                availableRelease = null
            }
        )
    }

    if (showLogoutConfirm) {
        ConfirmDialog(
            title = "Log Out",
            message = "Are you sure you want to log out of Personal Diary & Notes?",
            confirmText = "Log Out",
            onConfirm = {
                showLogoutConfirm = false
                handleLogout()
            },
            onDismiss = { showLogoutConfirm = false }
        )
    }
}
