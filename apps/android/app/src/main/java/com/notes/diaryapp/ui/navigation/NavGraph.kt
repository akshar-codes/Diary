package com.notes.diaryapp.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import com.notes.diaryapp.auth.TokenManager
import com.notes.diaryapp.ui.screens.auth.LoginScreen
import com.notes.diaryapp.ui.screens.auth.PinLockScreen
import com.notes.diaryapp.ui.screens.auth.RegisterScreen
import com.notes.diaryapp.ui.screens.auth.VerifyEmailScreen
import com.notes.diaryapp.ui.screens.diary.TopicDetailScreen
import com.notes.diaryapp.ui.screens.main.MainScreen
import com.notes.diaryapp.ui.screens.notes.NoteEditorScreen

@Composable
fun AppNavHost(
    navController: NavHostController,
    startDestination: String = getInitialRoute()
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    val nextRoute = if (TokenManager.isPinEnabled()) Screen.PinLock.route else Screen.Main.route
                    navController.navigate(nextRoute) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToRegister = {
                    navController.navigate(Screen.Register.route)
                },
                onNavigateToVerifyEmail = { email ->
                    navController.navigate(Screen.VerifyEmail.createRoute(email))
                }
            )
        }

        composable(Screen.Register.route) {
            RegisterScreen(
                onRegisterSuccess = {
                    navController.navigate(Screen.Main.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack()
                },
                onNavigateToVerifyEmail = { email ->
                    navController.navigate(Screen.VerifyEmail.createRoute(email))
                }
            )
        }

        composable(
            route = Screen.VerifyEmail.route,
            arguments = listOf(
                navArgument("email") {
                    type = NavType.StringType
                    defaultValue = ""
                }
            )
        ) { backStackEntry ->
            val email = backStackEntry.arguments?.getString("email") ?: ""
            VerifyEmailScreen(
                email = email,
                onVerificationSuccess = {
                    val nextRoute = if (TokenManager.isPinEnabled()) Screen.PinLock.route else Screen.Main.route
                    navController.navigate(nextRoute) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                },
                onNavigateToLogin = {
                    navController.popBackStack(Screen.Login.route, false)
                }
            )
        }

        composable(Screen.PinLock.route) {
            PinLockScreen(
                onUnlockSuccess = {
                    navController.navigate(Screen.Main.route) {
                        popUpTo(Screen.PinLock.route) { inclusive = true }
                    }
                },
                onLogout = {
                    TokenManager.clearSession()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(Screen.Main.route) {
            MainScreen(
                onNavigateToNoteEditor = { noteId ->
                    navController.navigate(Screen.NoteEditor.createRoute(noteId))
                },
                onNavigateToTopicDetail = { topicId ->
                    navController.navigate(Screen.TopicDetail.createRoute(topicId))
                },
                onLogout = {
                    TokenManager.clearSession()
                    navController.navigate(Screen.Login.route) {
                        popUpTo(0) { inclusive = true }
                    }
                }
            )
        }

        composable(
            route = Screen.NoteEditor.route,
            arguments = listOf(
                navArgument("noteId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) { backStackEntry ->
            val noteId = backStackEntry.arguments?.getString("noteId")
            NoteEditorScreen(
                noteId = noteId,
                onBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.TopicDetail.route,
            arguments = listOf(
                navArgument("topicId") {
                    type = NavType.StringType
                }
            )
        ) { backStackEntry ->
            val topicId = backStackEntry.arguments?.getString("topicId") ?: ""
            TopicDetailScreen(
                topicId = topicId,
                onBack = { navController.popBackStack() }
            )
        }
    }
}

fun getInitialRoute(): String {
    return when {
        !TokenManager.isLoggedIn() -> Screen.Login.route
        TokenManager.isPinEnabled() -> Screen.PinLock.route
        else -> Screen.Main.route
    }
}
