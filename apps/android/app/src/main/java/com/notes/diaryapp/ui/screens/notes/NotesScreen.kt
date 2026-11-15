package com.notes.diaryapp.ui.screens.notes

import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.notes.diaryapp.data.model.Note
import com.notes.diaryapp.ui.components.ConfirmDialog
import com.notes.diaryapp.ui.components.OfflineBanner
import com.notes.diaryapp.viewmodel.NotesViewModel

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun NotesScreen(
    onNoteClick: (String?) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: NotesViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    val pinnedNotes = remember(state.notes) { state.notes.filter { it.isPinned } }
    val otherNotes = remember(state.notes) { state.notes.filter { !it.isPinned } }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { onNoteClick(null) }) {
                Icon(Icons.Default.Add, contentDescription = "New Note")
            }
        },
        modifier = modifier,
    ) { padding ->
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
                value = state.searchQuery,
                onValueChange = { viewModel.onSearchQueryChange(it) },
                placeholder = { Text("Search notes...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(12.dp))

            // Folder Filter Chips
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.fillMaxWidth(),
            ) {
                item {
                    FilterChip(
                        selected = state.selectedFolderId == null,
                        onClick = { viewModel.onSelectFolder(null) },
                        label = { Text("All Notes") },
                    )
                }
                items(state.folders, key = { it.id }) { folder ->
                    FilterChip(
                        selected = state.selectedFolderId == folder.id,
                        onClick = { viewModel.onSelectFolder(folder.id) },
                        label = { Text(folder.name) },
                    )
                }
                item {
                    AssistChip(
                        onClick = { viewModel.openCreateFolderDialog() },
                        label = { Text("+ Folder") },
                    )
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            if (state.isLoading && state.notes.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (state.notes.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = if (state.searchQuery.isBlank()) "No notes yet. Tap + to create one." else "No notes found matching your search.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    if (pinnedNotes.isNotEmpty()) {
                        item {
                            Text(
                                text = "PINNED",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.primary,
                            )
                        }
                        items(pinnedNotes, key = { it.id }) { note ->
                            NoteCard(
                                note = note,
                                onClick = { onNoteClick(note.id) },
                                onTogglePin = { viewModel.togglePin(note) },
                                onDelete = { viewModel.setNoteToDelete(note) },
                            )
                        }
                        item {
                            Spacer(modifier = Modifier.height(8.dp))
                            Text(
                                text = "OTHERS",
                                style = MaterialTheme.typography.labelMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }

                    items(otherNotes, key = { it.id }) { note ->
                        NoteCard(
                            note = note,
                            onClick = { onNoteClick(note.id) },
                            onTogglePin = { viewModel.togglePin(note) },
                            onDelete = { viewModel.setNoteToDelete(note) },
                        )
                    }
                }
            }
        }
    }

    if (state.showCreateFolderDialog) {
        AlertDialog(
            onDismissRequest = { viewModel.closeCreateFolderDialog() },
            title = { Text("New Folder") },
            text = {
                OutlinedTextField(
                    value = state.newFolderName,
                    onValueChange = { viewModel.onNewFolderNameChange(it) },
                    label = { Text("Folder Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            },
            confirmButton = {
                Button(onClick = { viewModel.createFolder() }) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.closeCreateFolderDialog() }) {
                    Text("Cancel")
                }
            },
        )
    }

    if (state.noteToDelete != null) {
        ConfirmDialog(
            title = "Delete Note",
            message = "Are you sure you want to move \"${state.noteToDelete?.title}\" to trash?",
            confirmText = "Delete",
            onConfirm = { viewModel.deleteConfirmed() },
            onDismiss = { viewModel.setNoteToDelete(null) },
        )
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
fun NoteCard(
    note: Note,
    onClick: () -> Unit,
    onTogglePin: () -> Unit,
    onDelete: () -> Unit,
) {
    var expandedMenu by remember { mutableStateOf(false) }

    Card(
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
        modifier =
            Modifier
                .fillMaxWidth()
                .combinedClickable(
                    onClick = onClick,
                    onLongClick = { expandedMenu = true },
                ),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                Text(
                    text = note.title.ifBlank { "Untitled Note" },
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis,
                    modifier = Modifier.weight(1f),
                )

                Row {
                    if (note.isPinned) {
                        Icon(
                            imageVector = Icons.Default.PushPin,
                            contentDescription = "Pinned",
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(18.dp),
                        )
                    }
                    Box {
                        IconButton(
                            onClick = { expandedMenu = true },
                            modifier = Modifier.size(24.dp),
                        ) {
                            Icon(Icons.Default.MoreVert, contentDescription = "Menu", modifier = Modifier.size(18.dp))
                        }
                        DropdownMenu(
                            expanded = expandedMenu,
                            onDismissRequest = { expandedMenu = false },
                        ) {
                            DropdownMenuItem(
                                text = { Text(if (note.isPinned) "Unpin" else "Pin to top") },
                                onClick = {
                                    expandedMenu = false
                                    onTogglePin()
                                },
                            )
                            DropdownMenuItem(
                                text = { Text("Delete", color = MaterialTheme.colorScheme.error) },
                                onClick = {
                                    expandedMenu = false
                                    onDelete()
                                },
                            )
                        }
                    }
                }
            }

            if (note.content.isNotBlank()) {
                Spacer(modifier = Modifier.height(6.dp))
                Text(
                    text = note.content,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 3,
                    overflow = TextOverflow.Ellipsis,
                )
            }

            if (note.tags.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
                    note.tags.take(3).forEach { tag ->
                        Text(
                            text = "#$tag",
                            style = MaterialTheme.typography.labelMedium,
                            color = MaterialTheme.colorScheme.primary,
                        )
                    }
                }
            }
        }
    }
}
