package com.notes.diaryapp.update

import com.notes.diaryapp.BuildConfig
import com.notes.diaryapp.data.model.ReleaseInfo
import com.notes.diaryapp.data.remote.ApiClient
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class UpdateCheckResult(
    val updateAvailable: Boolean = false,
    val isMandatory: Boolean = false,
    val release: ReleaseInfo? = null,
    val error: String? = null
)

object UpdateChecker {

    suspend fun check(): UpdateCheckResult = withContext(Dispatchers.IO) {
        try {
            val response = ApiClient.getService().getAndroidRelease()
            if (response.success && response.data != null) {
                val release = response.data
                val currentVersionCode = BuildConfig.VERSION_CODE
                val updateAvailable = release.latestVersionCode > currentVersionCode

                // Lockout safety guard: Only treat as mandatory if update is available, downloadUrl is non-empty,
                // and either mandatoryUpdate is true or current version is below minimum supported version.
                val isMandatory = updateAvailable &&
                        release.downloadUrl.isNotBlank() &&
                        (release.mandatoryUpdate || currentVersionCode < release.minSupportedVersionCode)

                UpdateCheckResult(
                    updateAvailable = updateAvailable,
                    isMandatory = isMandatory,
                    release = release
                )
            } else {
                UpdateCheckResult(error = response.message ?: "Failed to retrieve release metadata")
            }
        } catch (e: Exception) {
            // Graceful offline/error degradation: network issues should never lock user out
            UpdateCheckResult(error = e.localizedMessage ?: "Network error checking for updates")
        }
    }
}
