package com.notes.diaryapp.ui.screens.notes

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.PushPin
import androidx.compose.material.icons.outlined.PushPin
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.notes.diaryapp.data.model.CreateNoteRequest
import com.notes.diaryapp.data.model.NoteFolder
import com.notes.diaryapp.data.model.UpdateNoteRequest
import com.notes.diaryapp.data.remote.ApiClient
import com.notes.diaryapp.ui.components.ConfirmDialog
import com.notes.diaryapp.ui.components.LoadingOverlay
import com.notes.diaryapp.ui.components.OfflineBanner
import kotlinx.coroutines.launch

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NoteEditorScreen(
    noteId: String?,
    onBack: () -> Unit
) {
    val coroutineScope = rememberCoroutineScope()
    var title by remember { mutableStateOf("") }
    var content by remember { mutableStateOf("") }
    var tagsInput by remember { mutableStateOf("") }
    var isPinned by remember { mutableStateOf(false) }
    var folderId by remember { mutableStateOf<String?>(null) }
    var folders by remember { mutableStateOf<List<NoteFolder>>(emptyList()) }

    var isLoading by remember { mutableStateOf(noteId != null) }
    var isSaving by remember { mutableStateOf(false) }
    var isOffline by remember { mutableStateOf(false) }
    var showDeleteConfirm by remember { mutableStateOf(false) }

    // Load initial data
    LaunchedEffect(noteId) {
        coroutineScope.launch {
            try {
                val fRes = ApiClient.getService().getFolders()
                if (fRes.success && fRes.data != null) {
                    folders = fRes.data
                }

                if (!noteId.isNullOrBlank()) {
                    val nRes = ApiClient.getService().getNoteById(noteId)
                    if (nRes.success && nRes.data != null) {
                        val note = nRes.data
                        title = note.title
                        content = note.content
                        tagsInput = note.tags.joinToString(", ")
                        isPinned = note.isPinned
                        folderId = note.folderId
                    }
                }
            } catch (e: Exception) {
                isOffline = true
            } finally {
                isLoading = false
            }
        }
    }

    fun parseTags(): List<String> {
        return tagsInput.split(",")
            .map { it.trim().removePrefix("#") }
            .filter { it.isNotBlank() }
    }

    fun saveNote() {
        if (title.isBlank() && content.isBlank()) {
            onBack()
            return
        }
        isSaving = true

        coroutineScope.launch {
            try {
                if (noteId.isNullOrBlank()) {
                    val createReq = CreateNoteRequest(
                        title = title.trim(),
                        content = content,
                        folderId = folderId,
                        tags = parseTags(),
                        isPinned = isPinned
                    )
                    val res = ApiClient.getService().createNote(createReq)
                    if (res.success) onBack()
                } else {
                    val updateReq = UpdateNoteRequest(
                        title = title.trim(),
                        content = content,
                        folderId = folderId,
                        tags = parseTags(),
                        isPinned = isPinned
                    )
                    val res = ApiClient.getService().updateNote(noteId, updateReq)
                    if (res.success) onBack()
                }
            } catch (e: Exception) {
                isOffline = true
            } finally {
                isSaving = false
            }
        }
    }

    fun deleteNote() {
        if (noteId.isNullOrBlank()) {
            onBack()
            return
        }
        coroutineScope.launch {
            try {
                val res = ApiClient.getService().deleteNote(noteId)
                if (res.success) onBack()
            } catch (e: Exception) {
                isOffline = true
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (noteId.isNullOrBlank()) "New Note" else "Edit Note") },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { isPinned = !isPinned }) {
                        Icon(
                            imageVector = if (isPinned) Icons.Default.PushPin else Icons.Outlined.PushPin,
                            contentDescription = "Pin Note",
                            tint = if (isPinned) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                        )
                    }

                    if (!noteId.isNullOrBlank()) {
                        IconButton(onClick = { showDeleteConfirm = true }) {
                            Icon(Icons.Default.Delete, contentDescription = "Delete Note", tint = MaterialTheme.colorScheme.error)
                        }
                    }

                    IconButton(
                        onClick = { saveNote() },
                        enabled = !isSaving
                    ) {
                        Icon(Icons.Default.Check, contentDescription = "Save Note", tint = MaterialTheme.colorScheme.primary)
                    }
                }
            )
        }
    ) { padding ->
        if (isLoading) {
            LoadingOverlay()
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .padding(16.dp)
            ) {
                if (isOffline) {
                    OfflineBanner(modifier = Modifier.padding(bottom = 12.dp))
                }

                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    placeholder = { Text("Note Title", style = MaterialTheme.typography.titleLarge) },
                    textStyle = MaterialTheme.typography.titleLarge,
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(8.dp))

                OutlinedTextField(
                    value = tagsInput,
                    onValueChange = { tagsInput = it },
                    placeholder = { Text("Tags (comma separated, e.g. work, ideas)") },
                    textStyle = MaterialTheme.typography.bodySmall,
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth()
                )

                Spacer(modifier = Modifier.height(12.dp))

                OutlinedTextField(
                    value = content,
                    onValueChange = { content = it },
                    placeholder = { Text("Write your note here...") },
                    textStyle = MaterialTheme.typography.bodyLarge,
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(1f)
                )
            }
        }
    }

    if (showDeleteConfirm) {
        ConfirmDialog(
            title = "Delete Note",
            message = "Move this note to trash?",
            confirmText = "Delete",
            onConfirm = {
                showDeleteConfirm = false
                deleteNote()
            },
            onDismiss = { showDeleteConfirm = false }
        )
    }
}
