package com.notes.diaryapp.ui.screens.main

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Label
import androidx.compose.material.icons.automirrored.filled.Notes
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.lifecycle.viewmodel.compose.viewModel
import com.notes.diaryapp.ui.components.UpdateDialog
import com.notes.diaryapp.ui.navigation.BottomTab
import com.notes.diaryapp.ui.screens.diary.DiaryScreen
import com.notes.diaryapp.ui.screens.diary.TopicsScreen
import com.notes.diaryapp.ui.screens.notes.NotesScreen
import com.notes.diaryapp.ui.screens.settings.SettingsScreen
import com.notes.diaryapp.update.ApkInstaller
import com.notes.diaryapp.viewmodel.MainViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onNavigateToNoteEditor: (String?) -> Unit,
    onNavigateToTopicDetail: (String) -> Unit,
    onLogout: () -> Unit,
    viewModel: MainViewModel = viewModel(),
) {
    val context = LocalContext.current
    val state by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        when (state.activeTab) {
                            BottomTab.Diary -> "Daily Journal"
                            BottomTab.Topics -> "Topics & Tags"
                            BottomTab.Notes -> "My Notes"
                            BottomTab.Settings -> "Settings"
                        },
                    )
                },
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = state.activeTab == BottomTab.Diary,
                    onClick = { viewModel.selectTab(BottomTab.Diary) },
                    icon = { Icon(Icons.Default.Book, contentDescription = "Diary") },
                    label = { Text("Diary") },
                )
                NavigationBarItem(
                    selected = state.activeTab == BottomTab.Topics,
                    onClick = { viewModel.selectTab(BottomTab.Topics) },
                    icon = { Icon(Icons.AutoMirrored.Filled.Label, contentDescription = "Topics") },
                    label = { Text("Topics") },
                )
                NavigationBarItem(
                    selected = state.activeTab == BottomTab.Notes,
                    onClick = { viewModel.selectTab(BottomTab.Notes) },
                    icon = { Icon(Icons.AutoMirrored.Filled.Notes, contentDescription = "Notes") },
                    label = { Text("Notes") },
                )
                NavigationBarItem(
                    selected = state.activeTab == BottomTab.Settings,
                    onClick = { viewModel.selectTab(BottomTab.Settings) },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") },
                )
            }
        },
    ) { padding ->
        Box(
            modifier =
                Modifier
                    .fillMaxSize()
                    .padding(padding),
        ) {
            when (state.activeTab) {
                BottomTab.Diary -> DiaryScreen()
                BottomTab.Topics -> TopicsScreen(onTopicClick = onNavigateToTopicDetail)
                BottomTab.Notes -> NotesScreen(onNoteClick = onNavigateToNoteEditor)
                BottomTab.Settings -> SettingsScreen(onLogoutSuccess = onLogout)
            }
        }
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
}
