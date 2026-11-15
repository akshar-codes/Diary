package com.notes.diaryapp

import com.notes.diaryapp.data.model.Note
import org.junit.Assert.*
import org.junit.Test

class NoteModelTest {
    @Test
    fun testNoteInstantiationAndDefaults() {
        val note =
            Note(
                id = "note_123",
                title = "My Thoughts",
                content = "Reflections on Compose migration",
                tags = listOf("android", "kotlin"),
            )

        assertEquals("note_123", note.id)
        assertEquals("My Thoughts", note.title)
        assertFalse(note.isPinned)
        assertNull(note.folderId)
        assertEquals(2, note.tags.size)
        assertTrue(note.tags.contains("kotlin"))
    }

    @Test
    fun testTagParsingLogic() {
        val rawInput = "#android, kotlin, #compose,  notes "
        val parsed =
            rawInput
                .split(",")
                .map { it.trim().removePrefix("#") }
                .filter { it.isNotBlank() }

        assertEquals(listOf("android", "kotlin", "compose", "notes"), parsed)
    }
}
