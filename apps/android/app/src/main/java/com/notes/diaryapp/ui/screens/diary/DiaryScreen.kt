package com.notes.diaryapp.ui.screens.diary

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ChevronLeft
import androidx.compose.material.icons.filled.ChevronRight
import androidx.compose.material.icons.filled.Save
import androidx.compose.material.icons.filled.Today
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.notes.diaryapp.ui.components.OfflineBanner
import com.notes.diaryapp.viewmodel.DiaryViewModel

@Composable
fun DiaryScreen(
    modifier: Modifier = Modifier,
    viewModel: DiaryViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    Column(
        modifier =
            modifier
                .fillMaxSize()
                .padding(16.dp),
    ) {
        if (state.isOffline) {
            OfflineBanner(modifier = Modifier.padding(bottom = 12.dp))
        }

        // Date selector bar
        Card(
            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surfaceVariant),
            modifier = Modifier.fillMaxWidth(),
        ) {
            Row(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 6.dp),
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.SpaceBetween,
            ) {
                IconButton(onClick = { viewModel.changeDate(-1) }) {
                    Icon(Icons.Default.ChevronLeft, contentDescription = "Previous Day")
                }

                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(
                        text = state.currentDisplayDate,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                    )
                    Text(
                        text = state.currentDateStr,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }

                Row {
                    IconButton(onClick = { viewModel.goToToday() }) {
                        Icon(Icons.Default.Today, contentDescription = "Today")
                    }
                    IconButton(onClick = { viewModel.changeDate(1) }) {
                        Icon(Icons.Default.ChevronRight, contentDescription = "Next Day")
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(12.dp))

        // Topic chips if present
        val topics = state.currentEntry?.topics
        if (!topics.isNullOrEmpty()) {
            Row(
                modifier =
                    Modifier
                        .fillMaxWidth()
                        .padding(vertical = 4.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                topics.forEach { topic ->
                    SuggestionChip(
                        onClick = {},
                        label = { Text("#${topic.title}", style = MaterialTheme.typography.labelMedium) },
                    )
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
        }

        // Diary content editor
        OutlinedTextField(
            value = state.content,
            onValueChange = { viewModel.onContentChange(it) },
            placeholder = {
                Text("Write about your day, reflections, thoughts... Use #topic to link pages automatically.")
            },
            modifier =
                Modifier
                    .fillMaxWidth()
                    .weight(1f),
            textStyle = MaterialTheme.typography.bodyLarge,
        )

        Spacer(modifier = Modifier.height(12.dp))

        // Bottom action bar
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (state.saveStatus != null) {
                Text(
                    text = state.saveStatus ?: "",
                    style = MaterialTheme.typography.bodyMedium,
                    color =
                        if (state.saveStatus?.startsWith("Error") ==
                            true
                        ) {
                            MaterialTheme.colorScheme.error
                        } else {
                            MaterialTheme.colorScheme.primary
                        },
                )
            } else {
                Spacer(modifier = Modifier.width(8.dp))
            }

            Button(
                onClick = { viewModel.saveEntry() },
                enabled = !state.isSaving && state.content.isNotBlank(),
            ) {
                if (state.isSaving) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(16.dp),
                        strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary,
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
