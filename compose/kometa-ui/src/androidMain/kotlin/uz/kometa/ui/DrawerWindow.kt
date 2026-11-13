package uz.kometa.ui

import android.annotation.SuppressLint
import android.content.Context
import android.graphics.PixelFormat
import android.os.Build
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.window.OnBackInvokedCallback
import android.window.OnBackInvokedDispatcher
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.rememberCompositionContext
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.platform.AbstractComposeView
import androidx.compose.ui.platform.LocalView
import androidx.lifecycle.findViewTreeLifecycleOwner
import androidx.lifecycle.setViewTreeLifecycleOwner
import androidx.savedstate.findViewTreeSavedStateRegistryOwner
import androidx.savedstate.setViewTreeSavedStateRegistryOwner

/**
 * A full-screen panel window over the activity, as Material 3's ModalBottomSheet uses. A Compose
 * Dialog would not do: it caps its content at the configuration screen size, which leaves out the
 * system bars, so the scrim stopped at them. The panel lays out under the bars and the keyboard and
 * the drawer pads itself with their insets.
 */
@Composable
internal actual fun DrawerWindow(onDismiss: () -> Unit, content: @Composable () -> Unit) {
    val view = LocalView.current
    val parent = rememberCompositionContext()
    val body by rememberUpdatedState(content)
    val dismiss by rememberUpdatedState(onDismiss)
    DisposableEffect(view) {
        val window = DrawerPanel(view) { dismiss() }
        window.setParentCompositionContext(parent)
        window.body = { body() }
        window.show()
        onDispose { window.close() }
    }
}

@SuppressLint("ViewConstructor")
private class DrawerPanel(private val owner: View, private val onBack: () -> Unit) : AbstractComposeView(owner.context) {
    private val windowManager = owner.context.getSystemService(Context.WINDOW_SERVICE) as WindowManager
    var body: @Composable () -> Unit by mutableStateOf({})
    private var backCallback: Any? = null

    init {
        setViewTreeLifecycleOwner(owner.findViewTreeLifecycleOwner())
        setViewTreeSavedStateRegistryOwner(owner.findViewTreeSavedStateRegistryOwner())
    }

    @Composable
    override fun Content() = body()

    fun show() = windowManager.addView(this, WindowManager.LayoutParams().apply {
        type = WindowManager.LayoutParams.TYPE_APPLICATION_PANEL
        token = owner.applicationWindowToken
        width = WindowManager.LayoutParams.MATCH_PARENT
        height = WindowManager.LayoutParams.MATCH_PARENT
        gravity = Gravity.START or Gravity.TOP
        format = PixelFormat.TRANSLUCENT
        title = "KometaDrawer"
        flags = WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        // shortcut: below Android 11 the window resizes for the keyboard instead of passing its inset; checked on API 34 only.
        @Suppress("DEPRECATION")
        softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE
        if (Build.VERSION.SDK_INT >= 30) fitInsetsTypes = 0
        if (Build.VERSION.SDK_INT >= 28) layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES
    })

    fun close() {
        disposeComposition()
        windowManager.removeViewImmediate(this)
    }

    // Back reaches the panel as a key event, or, in an app opted in to predictive back, as a callback.
    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK && keyDispatcherState != null) {
            if (event.action == KeyEvent.ACTION_DOWN && event.repeatCount == 0) {
                keyDispatcherState?.startTracking(event, this)
                return true
            }
            if (event.action == KeyEvent.ACTION_UP && keyDispatcherState?.isTracking(event) == true && !event.isCanceled) {
                onBack()
                return true
            }
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        if (Build.VERSION.SDK_INT >= 33) {
            val callback = OnBackInvokedCallback { onBack() }
            findOnBackInvokedDispatcher()?.registerOnBackInvokedCallback(OnBackInvokedDispatcher.PRIORITY_OVERLAY, callback)
            backCallback = callback
        }
    }

    override fun onDetachedFromWindow() {
        super.onDetachedFromWindow()
        if (Build.VERSION.SDK_INT >= 33) (backCallback as? OnBackInvokedCallback)?.let { findOnBackInvokedDispatcher()?.unregisterOnBackInvokedCallback(it) }
        backCallback = null
    }
}
