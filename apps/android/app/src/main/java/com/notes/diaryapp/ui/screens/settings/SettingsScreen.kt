package com.notes.diaryapp.ui.screens.settings

import android.widget.Toast
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.notes.diaryapp.BuildConfig
import com.notes.diaryapp.ui.components.ConfirmDialog
import com.notes.diaryapp.ui.components.UpdateDialog
import com.notes.diaryapp.update.ApkInstaller
import com.notes.diaryapp.viewmodel.SettingsViewModel

@Composable
fun SettingsScreen(
    onLogoutSuccess: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: SettingsViewModel = viewModel(),
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(state.updateMessage) {
        state.updateMessage?.let {
            Toast.makeText(context, it, Toast.LENGTH_SHORT).show()
        }
    }

    Column(
        modifier =
            modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp),
    ) {
        // Profile Card
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier = Modifier.padding(16.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Icon(
                    imageVector = Icons.Default.AccountCircle,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(48.dp),
                )
                Spacer(modifier = Modifier.width(16.dp))
                Column {
                    Text(text = state.userName, style = MaterialTheme.typography.titleMedium)
                    if (state.userEmail.isNotBlank()) {
                        Text(
                            text = state.userEmail,
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }
        }

        // Security Section
        Text(
            text = "SECURITY",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary,
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Column(modifier = Modifier.weight(1f)) {
                        Text("App PIN Lock", style = MaterialTheme.typography.titleMedium)
                        Text(
                            "Require 4-digit PIN when opening app",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                    Switch(
                        checked = state.isPinEnabled,
                        onCheckedChange = { checked ->
                            if (checked) {
                                viewModel.openPinDialog()
                            } else {
                                viewModel.disablePin()
                            }
                        },
                    )
                }

                if (state.isPinEnabled) {
                    Spacer(modifier = Modifier.height(12.dp))
                    OutlinedButton(onClick = { viewModel.openPinDialog() }) {
                        Text("Change PIN")
                    }
                }
            }
        }

        // System & Updates Section
        Text(
            text = "APPLICATION & UPDATES",
            style = MaterialTheme.typography.labelMedium,
            color = MaterialTheme.colorScheme.primary,
        )

        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("Installed Version", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        "${BuildConfig.VERSION_NAME} (${BuildConfig.VERSION_CODE})",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                ) {
                    Text("Backend Server", style = MaterialTheme.typography.bodyMedium)
                    Text(
                        if (BuildConfig.API_BASE_URL.contains("10.0.2.2")) "Local Emulator (10.0.2.2)" else "Production (Render)",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                Spacer(modifier = Modifier.height(4.dp))

                Button(
                    onClick = { viewModel.checkForUpdates() },
                    enabled = !state.isCheckingUpdate,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    if (state.isCheckingUpdate) {
                        CircularProgressIndicator(
                            modifier = Modifier.size(16.dp),
                            strokeWidth = 2.dp,
                            color = MaterialTheme.colorScheme.onPrimary,
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
            onClick = { viewModel.openLogoutConfirm() },
            colors = ButtonDefaults.outlinedButtonColors(contentColor = MaterialTheme.colorScheme.error),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Icon(Icons.AutoMirrored.Filled.ExitToApp, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Log Out")
        }
    }

    if (state.showPinDialog) {
        AlertDialog(
            onDismissRequest = { viewModel.closePinDialog() },
            title = { Text("Set 4-Digit PIN") },
            text = {
                Column {
                    OutlinedTextField(
                        value = state.pinInput,
                        onValueChange = { viewModel.onPinInputChange(it) },
                        label = { Text("Enter 4 digits") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                    )
                    if (state.pinError != null) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(state.pinError ?: "", color = MaterialTheme.colorScheme.error, style = MaterialTheme.typography.bodySmall)
                    }
                }
            },
            confirmButton = {
                Button(onClick = { viewModel.savePin() }) {
                    Text("Save PIN")
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.closePinDialog() }) {
                    Text("Cancel")
                }
            },
        )
    }

    if (state.availableRelease != null) {
        UpdateDialog(
            release = state.availableRelease!!,
            isMandatory = state.isUpdateMandatory,
            onUpdateClick = {
                ApkInstaller.downloadAndInstall(context, state.availableRelease!!.downloadUrl)
                if (!state.isUpdateMandatory) {
                    viewModel.dismissUpdateDialog()
                }
            },
            onDismissClick = {
                viewModel.dismissUpdateDialog()
            },
        )
    }

    if (state.showLogoutConfirm) {
        ConfirmDialog(
            title = "Log Out",
            message = "Are you sure you want to log out of Personal Diary & Notes?",
            confirmText = "Log Out",
            onConfirm = {
                viewModel.logout(onLogoutSuccess)
            },
            onDismiss = { viewModel.closeLogoutConfirm() },
        )
    }
}
