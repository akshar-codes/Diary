package com.notes.diaryapp.ui.screens.notes

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.outlined.PushPin
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.notes.diaryapp.ui.components.ConfirmDialog
import com.notes.diaryapp.ui.components.LoadingOverlay
import com.notes.diaryapp.ui.components.OfflineBanner
import com.notes.diaryapp.viewmodel.NoteEditorViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteEditorScreen(
    noteId: String?,
    onBack: () -> Unit,
    viewModel: NoteEditorViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    LaunchedEffect(noteId) {
        viewModel.initNote(noteId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (noteId.isNullOrBlank()) "New Note" else "Edit Note") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { viewModel.togglePin() }) {
                        Icon(
                            imageVector = if (state.isPinned) Icons.Default.PushPin else Icons.Outlined.PushPin,
                            contentDescription = "Pin Note",
                            tint = if (state.isPinned) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface,
                        )
                    }

                    if (!noteId.isNullOrBlank()) {
                        IconButton(onClick = { viewModel.openDeleteConfirm() }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete Note", tint = MaterialTheme.colorScheme.error)
                        }
                    }

                    IconButton(
                        onClick = { viewModel.saveNote(onBack) },
                        enabled = !state.isSaving,
                    ) {
                        Icon(Icons.Default.Check, contentDescription = "Save Note", tint = MaterialTheme.colorScheme.primary)
                    }
                },
            )
        },
    ) { padding ->
        if (state.isLoading) {
            LoadingOverlay()
        } else {
            Column(
                modifier =
                    Modifier
                        .fillMaxSize()
                        .padding(padding)
                        .padding(16.dp),
            ) {
                if (state.isOffline) {
                    OfflineBanner(modifier = Modifier.padding(bottom = 12.dp))
                }

                OutlinedTextField(
                    value = state.title,
                    onValueChange = { viewModel.onTitleChange(it) },
                    placeholder = { Text("Note Title", style = MaterialTheme.typography.titleLarge) },
                    textStyle = MaterialTheme.typography.titleLarge,
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = state.tagsInput,
                    onValueChange = { viewModel.onTagsChange(it) },
                    placeholder = { Text("Tags (comma separated, e.g. work, ideas)") },
                    textStyle = MaterialTheme.typography.bodySmall,
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = state.content,
                    onValueChange = { viewModel.onContentChange(it) },
                    placeholder = { Text("Write your note here...") },
                    textStyle = MaterialTheme.typography.bodyLarge,
                    modifier =
                        Modifier
                            .fillMaxWidth()
                            .weight(1f),
                )
            }
        }
    }

    if (state.showDeleteConfirm) {
        ConfirmDialog(
            title = "Delete Note",
            message = "Move this note to trash?",
            confirmText = "Delete",
            onConfirm = {
                viewModel.closeDeleteConfirm()
                viewModel.deleteNote(onBack)
            },
            onDismiss = { viewModel.closeDeleteConfirm() },
        )
    }
}
