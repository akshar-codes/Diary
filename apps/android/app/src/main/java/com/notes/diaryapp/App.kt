package com.notes.diaryapp

import android.app.Application
import com.notes.diaryapp.auth.TokenManager
import com.notes.diaryapp.data.remote.ApiClient

class App : Application() {
    override fun onCreate() {
        super.onCreate()
        instance = this
        TokenManager.init(this)
        ApiClient.init(this)
    }

    companion object {
        lateinit var instance: App
            private set
    }
}
