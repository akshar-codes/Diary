package com.notes.diaryapp.data.remote

import android.content.Context
import com.notes.diaryapp.BuildConfig
import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit

object ApiClient {

    private lateinit var apiService: ApiService
    private lateinit var unauthApiService: ApiService

    fun init(context: Context) {
        val baseUrl = BuildConfig.API_BASE_URL

        val loggingInterceptor = HttpLoggingInterceptor().apply {
            level = if (BuildConfig.DEBUG) {
                HttpLoggingInterceptor.Level.BODY
            } else {
                HttpLoggingInterceptor.Level.NONE
            }
        }

        // Unauthenticated client (used for refresh calls to prevent recursion)
        val unauthClient = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(loggingInterceptor)
            .build()

        unauthApiService = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(unauthClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)

        // Main authenticated client
        val authClient = OkHttpClient.Builder()
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .addInterceptor(AuthInterceptor())
            .authenticator(TokenAuthenticator())
            .addInterceptor(loggingInterceptor)
            .build()

        apiService = Retrofit.Builder()
            .baseUrl(baseUrl)
            .client(authClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
            .create(ApiService::class.java)
    }

    fun getService(): ApiService = apiService

    fun getUnauthenticatedService(): ApiService = unauthApiService
}
