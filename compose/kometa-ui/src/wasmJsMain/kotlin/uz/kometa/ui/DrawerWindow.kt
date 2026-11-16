package uz.kometa.ui

import androidx.compose.runtime.Composable

@Composable
internal actual fun DrawerWindow(onDismiss: () -> Unit, content: @Composable () -> Unit) = PopupDrawerWindow(onDismiss, content)
