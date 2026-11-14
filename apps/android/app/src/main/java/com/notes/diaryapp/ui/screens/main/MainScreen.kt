package com.notes.diaryapp.ui.screens.main

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Book
import androidx.compose.material.icons.filled.Label
import androidx.compose.material.icons.filled.Notes
import androidx.compose.material.icons.filled.Settings
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import com.notes.diaryapp.data.model.ReleaseInfo
import com.notes.diaryapp.ui.components.UpdateDialog
import com.notes.diaryapp.ui.navigation.BottomTab
import com.notes.diaryapp.ui.screens.diary.DiaryScreen
import com.notes.diaryapp.ui.screens.diary.TopicsScreen
import com.notes.diaryapp.ui.screens.notes.NotesScreen
import com.notes.diaryapp.ui.screens.settings.SettingsScreen
import com.notes.diaryapp.update.ApkInstaller
import com.notes.diaryapp.update.UpdateChecker
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(
    onNavigateToNoteEditor: (String?) -> Unit,
    onNavigateToTopicDetail: (String) -> Unit,
    onLogout: () -> Unit
) {
    val context = LocalContext.current
    val coroutineScope = rememberCoroutineScope()
    var selectedTab by remember { mutableStateOf<BottomTab>(BottomTab.Diary) }

    // Automatic update check on launch
    var availableRelease by remember { mutableStateOf<ReleaseInfo?>(null) }
    var isUpdateMandatory by remember { mutableStateOf(false) }

    LaunchedEffect(Unit) {
        coroutineScope.launch {
            val result = UpdateChecker.check()
            if (result.updateAvailable && result.release != null) {
                availableRelease = result.release
                isUpdateMandatory = result.isMandatory
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        when (selectedTab) {
                            BottomTab.Diary -> "Daily Journal"
                            BottomTab.Topics -> "Topics & Tags"
                            BottomTab.Notes -> "My Notes"
                            BottomTab.Settings -> "Settings"
                        }
                    )
                }
            )
        },
        bottomBar = {
            NavigationBar {
                NavigationBarItem(
                    selected = selectedTab == BottomTab.Diary,
                    onClick = { selectedTab = BottomTab.Diary },
                    icon = { Icon(Icons.Default.Book, contentDescription = "Diary") },
                    label = { Text("Diary") }
                )
                NavigationBarItem(
                    selected = selectedTab == BottomTab.Topics,
                    onClick = { selectedTab = BottomTab.Topics },
                    icon = { Icon(Icons.Default.Label, contentDescription = "Topics") },
                    label = { Text("Topics") }
                )
                NavigationBarItem(
                    selected = selectedTab == BottomTab.Notes,
                    onClick = { selectedTab = BottomTab.Notes },
                    icon = { Icon(Icons.Default.Notes, contentDescription = "Notes") },
                    label = { Text("Notes") }
                )
                NavigationBarItem(
                    selected = selectedTab == BottomTab.Settings,
                    onClick = { selectedTab = BottomTab.Settings },
                    icon = { Icon(Icons.Default.Settings, contentDescription = "Settings") },
                    label = { Text("Settings") }
                )
            }
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when (selectedTab) {
                BottomTab.Diary -> DiaryScreen()
                BottomTab.Topics -> TopicsScreen(onTopicClick = onNavigateToTopicDetail)
                BottomTab.Notes -> NotesScreen(onNoteClick = onNavigateToNoteEditor)
                BottomTab.Settings -> SettingsScreen(onLogoutSuccess = onLogout)
            }
        }
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
}
