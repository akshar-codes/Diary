package com.notes.diaryapp.ui.screens.diary

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Label
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.notes.diaryapp.ui.components.OfflineBanner
import com.notes.diaryapp.viewmodel.TopicsViewModel

@Composable
fun TopicsScreen(
    onTopicClick: (String) -> Unit,
    modifier: Modifier = Modifier,
    viewModel: TopicsViewModel = viewModel(),
) {
    val state by viewModel.uiState.collectAsState()

    val filteredTopics =
        remember(state.topics, state.searchQuery) {
            if (state.searchQuery.isBlank()) {
                state.topics
            } else {
                state.topics.filter { it.title.contains(state.searchQuery, ignoreCase = true) }
            }
        }

    Scaffold(
        floatingActionButton = {
            FloatingActionButton(onClick = { viewModel.openCreateDialog() }) {
                Icon(Icons.Default.Add, contentDescription = "Add Topic")
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
                placeholder = { Text("Search topics...") },
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Spacer(modifier = Modifier.height(16.dp))

            if (state.isLoading && state.topics.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
            } else if (filteredTopics.isEmpty()) {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(
                        text = if (state.searchQuery.isBlank()) "No topics created yet." else "No matching topics.",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(10.dp),
                    modifier = Modifier.fillMaxSize(),
                ) {
                    items(filteredTopics, key = { it.id }) { topic ->
                        Card(
                            colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
                            elevation = CardDefaults.cardElevation(defaultElevation = 1.dp),
                            modifier =
                                Modifier
                                    .fillMaxWidth()
                                    .clickable { onTopicClick(topic.id) },
                        ) {
                            Row(
                                modifier =
                                    Modifier
                                        .fillMaxWidth()
                                        .padding(16.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    imageVector = Icons.AutoMirrored.Filled.Label,
                                    contentDescription = null,
                                    tint = MaterialTheme.colorScheme.primary,
                                )
                                Spacer(modifier = Modifier.width(16.dp))
                                Column(modifier = Modifier.weight(1f)) {
                                    Text(
                                        text = "#${topic.title}",
                                        style = MaterialTheme.typography.titleMedium,
                                    )
                                    Text(
                                        text = "${topic.diaryEntryCount} linked entries",
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    if (state.showCreateDialog) {
        AlertDialog(
            onDismissRequest = { viewModel.closeCreateDialog() },
            title = { Text("Create Topic") },
            text = {
                OutlinedTextField(
                    value = state.newTopicTitle,
                    onValueChange = { viewModel.onNewTopicTitleChange(it) },
                    label = { Text("Topic Name") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                )
            },
            confirmButton = {
                Button(onClick = { viewModel.createTopic() }) {
                    Text("Create")
                }
            },
            dismissButton = {
                TextButton(onClick = { viewModel.closeCreateDialog() }) {
                    Text("Cancel")
                }
            },
        )
    }
}
