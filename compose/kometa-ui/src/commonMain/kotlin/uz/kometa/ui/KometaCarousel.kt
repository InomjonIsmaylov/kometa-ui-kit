package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.focusable
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEvent
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.roundToInt

/** [i] kept within the slides, 0 to count - 1 (0 when there are none). */
internal fun carouselClamp(i: Int, count: Int): Int = i.coerceIn(0, maxOf(0, count - 1))

/** Which third a point [x] across [width] is in: -1 back, 1 forward, 0 the middle or where there is nothing to go to. */
internal fun carouselSide(x: Float, width: Float, index: Int, count: Int): Int {
    if (width <= 0f) return 0
    val p = x / width
    return when {
        p < 1f / 3 && index > 0 -> -1
        p > 2f / 3 && index < count - 1 -> 1
        else -> 0
    }
}

/**
 * Slides in a row, one in view (`k-carousel`, its slides `[kSlide]`), with a row of ticks under them as
 * the pager: the current tick stands tall and cream, like [KometaMeter]. [slide] draws slide `i` of
 * [count]; the row is as tall as the tallest. With [edges] a tap on the left or right third goes back
 * or forward, and a thin chevron shows on that side while the pointer is there; taps on a control inside
 * a slide are left to it. Focused, the arrow keys move too. Off-screen slides are hidden from screen
 * readers; each tick is named "[slideLabel] 2".
 */
@Composable
public fun KometaCarousel(
    count: Int,
    index: Int,
    onIndexChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    edges: Boolean = true,
    label: String = "",
    slideLabel: String = Kometa.strings.slide,
    slide: @Composable (Int) -> Unit,
) {
    val c = Kometa.colors
    val at by rememberUpdatedState(index)
    val change by rememberUpdatedState(onIndexChange)
    fun go(i: Int) { val n = carouselClamp(i, count); if (n != at) change(n) }
    fun key(e: KeyEvent): Boolean {
        if (e.type != KeyEventType.KeyDown) return false
        when (e.key) {
            Key.DirectionLeft -> go(at - 1)
            Key.DirectionRight -> go(at + 1)
            else -> return false
        }
        return true
    }
    var self by remember { mutableStateOf(false) }
    var side by remember { mutableIntStateOf(0) }
    val pos by animateFloatAsState(index.toFloat(), tween(500, easing = SpringEase))

    Column(
        modifier
            .semantics { if (label.isNotEmpty()) contentDescription = label }
            // Only when the carousel itself is focused (or a tick, below): arrows inside a slide stay the slide's.
            .onKeyEvent { self && key(it) }
            .onFocusChanged { self = it.isFocused }
            .focusable(),
    ) {
        Box(
            Modifier.fillMaxWidth().clip(RoundedCornerShape(16.dp))
                .pointerInput(edges, count) {
                    if (!edges) return@pointerInput
                    awaitPointerEventScope {
                        while (true) {
                            val e = awaitPointerEvent()
                            val p = e.changes.firstOrNull() ?: continue
                            side = if (e.type == PointerEventType.Exit) 0 else carouselSide(p.position.x, size.width.toFloat(), at, count)
                        }
                    }
                }
                .pointerInput(edges, count) {
                    if (!edges) return@pointerInput
                    detectTapGestures { p ->
                        val s = carouselSide(p.x, size.width.toFloat(), at, count)
                        if (s != 0) go(at + s)
                        side = carouselSide(p.x, size.width.toFloat(), carouselClamp(at + s, count), count)
                    }
                },
        ) {
            Layout(
                content = {
                    for (i in 0 until count) {
                        // shortcut: off-screen slides are hidden from screen readers but their controls can still take keyboard focus, block it with focusProperties when a slide holds controls.
                        Box(if (i == index) Modifier.semantics { contentDescription = "${i + 1} / $count" } else Modifier.clearAndSetSemantics {}) { slide(i) }
                    }
                },
            ) { ms, cs ->
                val w = cs.maxWidth
                val ps = ms.map { it.measure(cs.copy(minWidth = w, maxWidth = w, minHeight = 0)) }
                val h = (ps.maxOfOrNull { it.height } ?: 0).coerceIn(cs.minHeight, cs.maxHeight)
                layout(w, h) { ps.forEachIndexed { i, p -> p.placeRelative(((i - pos) * w).roundToInt(), 0) } }
            }
            Chevron("‹", side == -1, -1, Modifier.align(Alignment.CenterStart))
            Chevron("›", side == 1, 1, Modifier.align(Alignment.CenterEnd))
        }
        if (count > 1) {
            // A 44dp-tall target under the 16dp tick. shortcut: each is 18dp wide (the web's size; the edges and arrows also move), widen if phone users miss it.
            Row(Modifier.height(44.dp).onKeyEvent(::key)) {
                for (i in 0 until count) {
                    val on = i == index
                    val color by animateColorAsState(if (on) c.displayInk else c.glassLine, tween(300))
                    val scale by animateFloatAsState(if (on) 1f else .3f, tween(300, easing = SpringEase))
                    Box(
                        Modifier.fillMaxHeight()
                            .clickable(interactionSource = null, indication = null, role = Role.Button) { go(i) }
                            .semantics { contentDescription = "$slideLabel ${i + 1}"; selected = on }
                            .padding(end = 4.dp),
                    ) {
                        Box(
                            Modifier.padding(top = 10.dp).width(14.dp).height(16.dp)
                                .graphicsLayer { scaleY = scale; transformOrigin = TransformOrigin(.5f, 1f) }
                                .background(color, RoundedCornerShape(2.dp)),
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun Chevron(text: String, shown: Boolean, dir: Int, modifier: Modifier) {
    val alpha by animateFloatAsState(if (shown) 1f else 0f, tween(250))
    val shift by animateFloatAsState(if (shown) 0f else 6f * -dir, tween(350, easing = SpringEase))
    BasicText(
        text,
        modifier.padding(horizontal = 12.dp).clearAndSetSemantics {}.graphicsLayer { this.alpha = alpha.coerceIn(0f, 1f); translationX = shift.dp.toPx() },
        style = Kometa.type.title.copy(color = Kometa.colors.displayInk, fontSize = 28.sp, fontWeight = FontWeight.Bold, lineHeight = 28.sp),
    )
}
