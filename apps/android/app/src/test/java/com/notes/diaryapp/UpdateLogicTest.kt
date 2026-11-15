package com.notes.diaryapp

import com.notes.diaryapp.data.model.ReleaseInfo
import org.junit.Assert.*
import org.junit.Test

class UpdateLogicTest {
    private fun evaluateUpdate(
        currentVersionCode: Int,
        release: ReleaseInfo,
    ): Pair<Boolean, Boolean> {
        val updateAvailable = release.latestVersionCode > currentVersionCode
        val isMandatory =
            updateAvailable &&
                release.downloadUrl.isNotBlank() &&
                (release.mandatoryUpdate || currentVersionCode < release.minSupportedVersionCode)
        return Pair(updateAvailable, isMandatory)
    }

    @Test
    fun testNoUpdateWhenCurrentIsSameOrHigher() {
        val currentVersionCode = 2
        val release =
            ReleaseInfo(
                latestVersion = "1.0.1",
                latestVersionCode = 2,
                minSupportedVersionCode = 1,
                mandatoryUpdate = false,
                downloadUrl = "https://example.com/app.apk",
            )

        val (available, mandatory) = evaluateUpdate(currentVersionCode, release)
        assertFalse(available)
        assertFalse(mandatory)
    }

    @Test
    fun testOptionalUpdateAvailable() {
        val currentVersionCode = 1
        val release =
            ReleaseInfo(
                latestVersion = "1.1.0",
                latestVersionCode = 2,
                minSupportedVersionCode = 1,
                mandatoryUpdate = false,
                downloadUrl = "https://example.com/app.apk",
            )

        val (available, mandatory) = evaluateUpdate(currentVersionCode, release)
        assertTrue(available)
        assertFalse(mandatory)
    }

    @Test
    fun testMandatoryUpdateWhenFlagIsTrue() {
        val currentVersionCode = 1
        val release =
            ReleaseInfo(
                latestVersion = "2.0.0",
                latestVersionCode = 2,
                minSupportedVersionCode = 1,
                mandatoryUpdate = true,
                downloadUrl = "https://example.com/app.apk",
            )

        val (available, mandatory) = evaluateUpdate(currentVersionCode, release)
        assertTrue(available)
        assertTrue(mandatory)
    }

    @Test
    fun testMandatoryUpdateWhenBelowMinSupported() {
        val currentVersionCode = 1
        val release =
            ReleaseInfo(
                latestVersion = "3.0.0",
                latestVersionCode = 3,
                minSupportedVersionCode = 2,
                mandatoryUpdate = false,
                downloadUrl = "https://example.com/app.apk",
            )

        val (available, mandatory) = evaluateUpdate(currentVersionCode, release)
        assertTrue(available)
        assertTrue(mandatory)
    }

    @Test
    fun testLockoutGuardWhenDownloadUrlMissing() {
        val currentVersionCode = 1
        val release =
            ReleaseInfo(
                latestVersion = "2.0.0",
                latestVersionCode = 2,
                minSupportedVersionCode = 2,
                mandatoryUpdate = true,
                downloadUrl = "", // Blank URL must not trigger a lockout
            )

        val (available, mandatory) = evaluateUpdate(currentVersionCode, release)
        assertTrue(available)
        assertFalse("Missing download URL must not cause lockout", mandatory)
    }
}
