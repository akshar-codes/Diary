package com.notes.diaryapp.ui.navigation

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Register : Screen("register")
    object PinLock : Screen("pin_lock")
    object Main : Screen("main")
    object NoteEditor : Screen("note_editor?noteId={noteId}") {
        fun createRoute(noteId: String? = null): String {
            return if (!noteId.isNullOrBlank()) "note_editor?noteId=$noteId" else "note_editor"
        }
    }
    object TopicDetail : Screen("topic_detail/{topicId}") {
        fun createRoute(topicId: String): String = "topic_detail/$topicId"
    }
}

sealed class BottomTab(val route: String, val title: String) {
    object Diary : BottomTab("tab_diary", "Diary")
    object Topics : BottomTab("tab_topics", "Topics")
    object Notes : BottomTab("tab_notes", "Notes")
    object Settings : BottomTab("tab_settings", "Settings")
}
