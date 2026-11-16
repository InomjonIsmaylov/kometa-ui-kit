package uz.kometa.sample

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.runtime.MutableState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
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
import org.w3c.dom.HTMLElement
import uz.kometa.ui.Kometa
import uz.kometa.ui.KometaTheme
import kotlin.math.roundToInt

@OptIn(ExperimentalComposeUiApi::class)
fun main() {
    // compose/index.html is the full showcase; the docs site loads this same script for its previews.
    if (document.body?.hasAttribute("data-showcase") != true) return expose(::mount, { previewDark.value = it }, ::unmount)
    // The docs site embeds this page and passes its theme as ?theme=dark|light.
    val asked = window.location.search.substringAfter("theme=", "").take(5)
    ComposeViewport(document.body!!) {
        val system = isSystemInDarkTheme()
        var dark by remember { mutableStateOf(if (asked.isEmpty()) system else asked == "dark") }
        KometaTheme(dark = dark) { Showcase(dark) { dark = it } }
    }
}

private val previewDark = mutableStateOf(false)

/** One ComposeViewport in its own div, moved into whichever preview slot uses it. */
private class Host(val el: HTMLElement, val key: MutableState<String?>, var slot: String? = null)

// Pooled because ComposeViewport (1.7) cannot be disposed: one per mount leaked a canvas each time and crashed skiko
// after a few dozen. The pool only grows to the most previews one page shows at once.
private val hosts = mutableListOf<Host>()

/** Draws the docs example [key] into the element [id]; its height in CSS px comes back as a `compose-size` event. */
private fun mount(id: String, key: String, dark: Boolean) {
    if (key !in DOC_EXAMPLES) return
    val slot = document.getElementById(id) ?: return
    previewDark.value = dark
    val host = hosts.firstOrNull { it.slot == null } ?: newHost().also { hosts += it }
    host.slot = id
    slot.appendChild(host.el)
    host.key.value = key
}

private fun unmount(id: String) {
    val host = hosts.firstOrNull { it.slot == id } ?: return
    host.key.value = null
    host.slot = null
    host.el.remove()
}

@OptIn(ExperimentalComposeUiApi::class)
private fun newHost(): Host {
    val el = document.createElement("div") as HTMLElement
    el.style.width = "100%"
    el.style.height = "100%"
    val host = Host(el, mutableStateOf(null))
    // ComposeViewport sizes its canvas from the container, so it must be in the page when created.
    document.body!!.appendChild(el)
    ComposeViewport(el) {
        val current = host.key.value ?: return@ComposeViewport
        val example = DOC_EXAMPLES.getValue(current)
        key(current) {
            KometaTheme(dark = previewDark.value) {
                val density = LocalDensity.current.density
                Box(
                    // The canvas is opaque, so it paints the docs' code box colour around the example.
                    Modifier.fillMaxSize().background(Kometa.colors.card).wrapContentHeight(Alignment.Top, unbounded = true)
                        .onSizeChanged { size -> host.slot?.let { emitHeight(it, (size.height / density).roundToInt() + example.room) } },
                ) { Column { example.content() } }
            }
        }
    }
    return host
}

private fun emitHeight(id: String, px: Int): Unit =
    js("void document.getElementById(id)?.dispatchEvent(new CustomEvent('compose-size', { detail: px }))")

private fun expose(mount: (String, String, Boolean) -> Unit, theme: (Boolean) -> Unit, unmount: (String) -> Unit): Unit =
    js("void (globalThis.kometaCompose = { mount: mount, theme: theme, unmount: unmount }, dispatchEvent(new Event('kometa-compose')))")
