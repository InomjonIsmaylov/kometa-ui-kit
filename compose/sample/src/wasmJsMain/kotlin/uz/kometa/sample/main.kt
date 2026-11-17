package uz.kometa.sample

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.wrapContentHeight
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.platform.LocalFontFamilyResolver
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.platform.Font
import kotlinx.coroutines.await
import kotlinx.coroutines.sync.Mutex
import kotlinx.coroutines.sync.withLock
import org.khronos.webgl.ArrayBuffer
import org.khronos.webgl.Int8Array
import org.khronos.webgl.get
import org.w3c.fetch.Response
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
import org.w3c.dom.events.Event
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
        if (!symbolsReady()) return@ComposeViewport
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
    // Compose 1.7 refits its canvas only on a window resize; send one when this slot's width differs from the canvas's.
    val canvas = host.el.querySelector("canvas") as HTMLElement?
    if (canvas?.style?.width != "${host.el.clientWidth}px") refitSoon()
}

private var refitPending = false

/** One window resize for all mounts in this task, sent outside a frame so the redraw lands before the next paint. */
private fun refitSoon() {
    if (refitPending) return
    refitPending = true
    window.setTimeout({ refitPending = false; window.dispatchEvent(Event("resize")); null }, 0)
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
    // Fixed height, clipped by the slot: a canvas resize clears every preview, so the height of an example must not cause one.
    // shortcut: an example taller than the screen is cut off; none is.
    el.style.height = "${maxOf(window.screen.height, 1080)}px"
    val host = Host(el, mutableStateOf(null))
    // ComposeViewport sizes its canvas from the container, so it must be in the page when created.
    document.body!!.appendChild(el)
    ComposeViewport(el) {
        val current = host.key.value ?: return@ComposeViewport
        if (!symbolsReady()) return@ComposeViewport
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

// The browser build has no system font fallback, so → ✓ ⋯ and friends drew as boxes: preload a symbol font as the fallback.
// KometaSymbols.ttf is Noto Sans Symbols 2 + Noto Sans Math cut to the glyphs the kit and sample use (scripts/symbols-font.py);
// one merged file, since only the first font of a preloaded family served as fallback.
// The bytes load once; each viewport builds its own Font from them, as a shared one mixes up their GL contexts.
private var symbolBytes: ByteArray? = null
private val symbolLock = Mutex()

private suspend fun symbolFont(): ByteArray = symbolLock.withLock {
    symbolBytes ?: fetchBytes("KometaSymbols.ttf").also { symbolBytes = it }
}

private suspend fun fetchBytes(file: String): ByteArray {
    val response = window.fetch(besideScript(file)).await<Response>()
    val bytes = Int8Array(response.arrayBuffer().await<ArrayBuffer>())
    return ByteArray(bytes.length) { bytes[it] }
}

/** False until the symbol font is in this composition's font resolver. */
@Composable
private fun symbolsReady(): Boolean {
    val resolver = LocalFontFamilyResolver.current
    var ready by remember { mutableStateOf(false) }
    LaunchedEffect(resolver) {
        // A failed fetch only costs the fallback glyphs, so draw anyway.
        runCatching { resolver.preload(FontFamily(Font("KometaSymbols", symbolFont()))) }
        ready = true
    }
    return ready
}

/** [file] next to sample.js, wherever the page that loaded it lives. */
private fun besideScript(file: String): String =
    js("new URL(file, document.querySelector('script[src$=\"sample.js\"]').src).href")

private fun emitHeight(id: String, px: Int): Unit =
    js("void document.getElementById(id)?.dispatchEvent(new CustomEvent('compose-size', { detail: px }))")

private fun expose(mount: (String, String, Boolean) -> Unit, theme: (Boolean) -> Unit, unmount: (String) -> Unit): Unit =
    js("void (globalThis.kometaCompose = { mount: mount, theme: theme, unmount: unmount }, dispatchEvent(new Event('kometa-compose')))")
