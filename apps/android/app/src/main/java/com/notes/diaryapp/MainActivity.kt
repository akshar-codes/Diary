package com.notes.diaryapp

import android.content.Intent
import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.ui.Modifier
import androidx.navigation.NavHostController
import androidx.navigation.compose.rememberNavController
import com.notes.diaryapp.auth.OAuthManager
import com.notes.diaryapp.auth.TokenManager
import com.notes.diaryapp.ui.navigation.AppNavHost
import com.notes.diaryapp.ui.navigation.Screen
import com.notes.diaryapp.ui.theme.DiaryNotesTheme
import com.notes.diaryapp.viewmodel.AuthViewModel

class MainActivity : ComponentActivity() {

    private val authViewModel: AuthViewModel by viewModels()
    private var navController: NavHostController? = null

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        handleOAuthIntent(intent)

        setContent {
            DiaryNotesTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    val controller = rememberNavController().also { navController = it }
                    AppNavHost(navController = controller)
                }
            }
        }
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        handleOAuthIntent(intent)
    }

    private fun handleOAuthIntent(intent: Intent?) {
        val result = OAuthManager.parseCallback(intent) ?: return
        authViewModel.handleOAuthResult(result) {
            val nextRoute = if (TokenManager.isPinEnabled()) Screen.PinLock.route else Screen.Main.route
            navController?.navigate(nextRoute) {
                popUpTo(0) { inclusive = true }
            }
        }
    }
}
