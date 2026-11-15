package com.notes.diaryapp.data.repository

import com.notes.diaryapp.update.UpdateCheckResult
import com.notes.diaryapp.update.UpdateChecker
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

class UpdateRepository {
    private var lastCheckTimestamp: Long = 0
    private val throttleIntervalMs: Long = 60_000 // 60 seconds

    suspend fun checkForUpdate(force: Boolean = false): UpdateCheckResult =
        withContext(Dispatchers.IO) {
            val now = System.currentTimeMillis()
            if (!force && (now - lastCheckTimestamp) < throttleIntervalMs) {
                return@withContext UpdateCheckResult(updateAvailable = false)
            }
            lastCheckTimestamp = now
            UpdateChecker.check()
        }
}
