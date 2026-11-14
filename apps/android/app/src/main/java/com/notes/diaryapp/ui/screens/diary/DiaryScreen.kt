package com.notes.diaryapp.ui.screens.diary

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Today
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.notes.diaryapp.data.model.CreateDiaryEntryRequest
import com.notes.diaryapp.data.model.DiaryEntry
import com.notes.diaryapp.data.remote.ApiClient
import com.notes.diaryapp.ui.components.OfflineBanner
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun DiaryScreen(
    modifier: Modifier = Modifier
) {
    val coroutineScope = rememberCoroutineScope()
    val calendar = remember { Calendar.getInstance() }
    val dateFormat = remember { SimpleDateFormat("yyyy-MM-dd", Locale.US) }
    val displayFormat = remember { SimpleDateFormat("EEEE, MMMM d, yyyy", Locale.US) }

    var currentDateStr by remember { mutableStateOf(dateFormat.format(calendar.time)) }
    var currentDisplayDate by remember { mutableStateOf(displayFormat.format(calendar.time)) }
    var contentText by remember { mutableStateOf("") }
    var currentEntry by remember { mutableStateOf<DiaryEntry?>(null) }
    var isLoading by remember { mutableStateOf(false) }
    var isSaving by remember { mutableStateOf(false) }
    var saveStatus by remember { mutableStateOf<String?>(null) }
    var isOffline by remember { mutableStateOf(false) }

    fun loadEntryForDate(dateKey: String) {
        isLoading = true
        saveStatus = null
        isOffline = false

        coroutineScope.launch {
            try {
                val response = ApiClient.getService().getDiaryEntryByDate(dateKey)
                if (response.success && response.data != null) {
                    currentEntry = response.data
                    contentText = response.data.content
                } else {
                    currentEntry = null
                    contentText = ""
                }
            } catch (e: Exception) {
                isOffline = true
            } finally {
                isLoading = false
            }
        }
    }

    LaunchedEffect(currentDateStr) {
        loadEntryForDate(currentDateStr)
    }

    fun changeDate(daysOffset: Int) {
        calendar.add(Calendar.DAY_OF_YEAR, daysOffset)
        currentDateStr = dateFormat.format(calendar.time)
        currentDisplayDate = displayFormat.format(calendar.time)
    }

    fun goToToday() {
        calendar.time = Date()
        currentDateStr = dateFormat.format(calendar.time)
        currentDisplayDate = displayFormat.format(calendar.time)
    }

    fun saveCurrentEntry() {
        if (contentText.isBlank()) return
        isSaving = true
        saveStatus = null

        coroutineScope.launch {
            try {
                val tz = TimeZone.getDefault().id
                val response = ApiClient.getService().saveDiaryEntry(
                    CreateDiaryEntryRequest(
                        dateKey = currentDateStr,
                        content = contentText,
                        timezone = tz
                    )
                )
                if (response.success && response.data != null) {
                    currentEntry = response.data
                    saveStatus = "Saved successfully"
                    isOffline = false
                } else {
                    saveStatus = response.error ?: response.message ?: "Failed to save"
                }
            } catch (e: Exception) {
                saveStatus = "Error: ${e.localizedMessage}"
                isOffline = true
            } finally {
                isSaving = false
            }
        }
    }

    Column(
        modifier = modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        if (isOffline) {
            OfflineBanner(modifier = Modifier.padding(bottom = 12.dp))
        }

        // Date bar
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            modifier = Modifier.fillMaxWidth()
        ) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                IconButton(onClick = { changeDate(-1) }) {
                    Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Day")
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = currentDisplayDate,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    Text(
                        text = currentDateStr,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }

                Row {
                    IconButton(onClick = { goToToday() }) {
                        Icon(Icons.Default.Today, contentDescription = "Today")
                    }
                    IconButton(onClick = { changeDate(1) }) {
                        Icon(Icons.Default.ChevronRight, contentDescription = "Next Day")
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Topic chips if present
        val topics = currentEntry?.topics
        if (!topics.isNullOrEmpty()) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                topics.forEach { topic ->
                    SuggestionChip(
                        onClick = {},
                        label = { Text("#${topic.title}", style = MaterialTheme.typography.labelMedium) }
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        // Diary content editor
        OutlinedTextField(
            value = contentText,
            onValueChange = {
                contentText = it
                saveStatus = null
            },
            placeholder = {
                Text("Write about your day, reflections, thoughts... Use #topic to link pages automatically.")
            },
            modifier = Modifier
                .fillMaxWidth()
                .weight(1f),
            textStyle = MaterialTheme.typography.bodyLarge
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Bottom action bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (saveStatus != null) {
                Text(
                    text = saveStatus ?: "",
                    style = MaterialTheme.typography.bodyMedium,
                    color = if (saveStatus?.startsWith("Error") == true) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.primary
                )
            } else {
                Spacer(modifier = Modifier.width(8.dp))
            }

            Button(
                onClick = { saveCurrentEntry() },
                enabled = !isSaving && contentText.isNotBlank()
            ) {
                if (isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Saving...")
                } else {
                    Icon(Icons.Default.Save, contentDescription = null, modifier = Modifier.size(18.dp))
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Save")
                }
            }
        }
    }
}
