package uz.kometa.sample

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.window.ComposeViewport
import kotlinx.browser.document
import kotlinx.browser.window
import uz.kometa.ui.Kometa
import uz.kometa.ui.KometaTheme
import kotlin.math.roundToInt

@OptIn(ExperimentalComposeUiApi::class)
fun main() {
    // compose/index.html is the full showcase; the docs site loads this same script for its previews.
    if (document.body?.hasAttribute("data-showcase") != true) return expose(::mount, { previewDark.value = it }, { live.remove(it)?.value = false })
    // The docs site embeds this page and passes its theme as ?theme=dark|light.
    val asked = window.location.search.substringAfter("theme=", "").take(5)
    ComposeViewport(document.body!!) {
        val system = isSystemInDarkTheme()
        var dark by remember { mutableStateOf(if (asked.isEmpty()) system else asked == "dark") }
        KometaTheme(dark = dark) { Showcase(dark) { dark = it } }
    }
}

private val previewDark = mutableStateOf(false)
/** Mounted previews by container id; false stops drawing one whose container is gone. */
private val live = mutableMapOf<String, MutableState<Boolean>>()

/** Draws the docs example [key] into the element [id]; its height in CSS px comes back as a `compose-size` event. */
@OptIn(ExperimentalComposeUiApi::class)
private fun mount(id: String, key: String, dark: Boolean) {
    val example = DOC_EXAMPLES[key] ?: return
    val container = document.getElementById(id) ?: return
    previewDark.value = dark
    val on = mutableStateOf(true).also { live[id] = it }
    // shortcut: ComposeViewport has no dispose here, so an unmounted preview stays as an empty composition; fine for a docs session
    ComposeViewport(container) {
        if (on.value) KometaTheme(dark = previewDark.value) {
            val density = LocalDensity.current.density
            Box(
                // The canvas is opaque, so it paints the docs' code box colour around the example.
                Modifier.fillMaxSize().background(Kometa.colors.card).wrapContentHeight(Alignment.Top, unbounded = true)
                    .onSizeChanged { emitHeight(id, (it.height / density).roundToInt() + example.room) },
            ) { Column { example.content() } }
        }
    }
}

private fun emitHeight(id: String, px: Int): Unit =
    js("void document.getElementById(id)?.dispatchEvent(new CustomEvent('compose-size', { detail: px }))")

private fun expose(mount: (String, String, Boolean) -> Unit, theme: (Boolean) -> Unit, unmount: (String) -> Unit): Unit =
    js("void (globalThis.kometaCompose = { mount: mount, theme: theme, unmount: unmount }, dispatchEvent(new Event('kometa-compose')))")
