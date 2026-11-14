package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.awaitEachGesture
import androidx.compose.foundation.gestures.awaitFirstDown
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.DisposableEffect
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.PointerEventPass
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.input.pointer.PointerType
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties
import kotlin.time.Duration.Companion.seconds
import kotlin.time.TimeSource
import kotlinx.coroutines.delay

/**
 * Where a tip goes: [side] px right of the [anchor], centred on it; left of it when the right has no room;
 * centred [gap] px below it (above near the bottom) when neither side has room. Always [pad] px inside the [window].
 */
internal fun placeTip(anchor: IntRect, window: IntSize, tip: IntSize, side: Int, gap: Int, pad: Int): IntOffset {
    var x = anchor.right + side
    var y = anchor.top + anchor.height / 2 - tip.height / 2
    if (x + tip.width > window.width - pad) x = anchor.left - side - tip.width
    if (x < pad) {
        x = (anchor.left + anchor.width / 2 - tip.width / 2).coerceAtMost(window.width - pad - tip.width).coerceAtLeast(pad)
        y = anchor.bottom + gap
        if (y + tip.height > window.height - pad) y = anchor.top - gap - tip.height
    }
    return IntOffset(x, y.coerceAtMost(window.height - pad - tip.height).coerceAtLeast(pad))
}

/** Whether a tip was up a moment ago, shared by every tip: moving between neighbours skips the pause. */
private object TipClock {
    var up = 0
    var hidAt = TimeSource.Monotonic.markNow() - 1.seconds
    val warm get() = up > 0 || hidAt.elapsedNow().inWholeMilliseconds < 400
}

private class TipPosition(val side: Int, val gap: Int, val pad: Int) : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize) =
        placeTip(anchorBounds, windowSize, popupContentSize, side, gap, pad)
}

/**
 * A tooltip on whatever it wraps (`[kometaTip]`): a small glass card beside it, an ink rule on its left
 * edge, the [text] and an optional [sub] line, in a popup so no clipping parent cuts it. A mouse hover shows
 * it after [delayMs] (none when moving between neighbouring tips), keyboard focus shows it at once, and
 * Escape, leaving and pressing hide it. The pointer can cross onto the tip and it stays while hovered
 * (WCAG 1.4.13). On touch a long press shows it for two seconds and does not also click what is under the
 * finger. A null or empty [text] shows nothing. The tip sits right of the content, else left, else below
 * or above, inside the window. It does not name the content: an icon-only control still needs its own label.
 */
@Composable
fun KometaTip(text: String?, modifier: Modifier = Modifier, sub: String? = null, delayMs: Long = 380, content: @Composable () -> Unit) {
    val c = Kometa.colors
    var hover by remember { mutableStateOf(false) }
    var focused by remember { mutableStateOf(false) }
    var touched by remember { mutableStateOf(false) }
    var show by remember { mutableStateOf(false) }
    val tipSource = remember { MutableInteractionSource() }
    val tipHover by tipSource.collectIsHoveredAsState()

    LaunchedEffect(hover, focused, touched, tipHover, text) {
        val want = !text.isNullOrEmpty() && (hover || focused || touched || tipHover)
        if (want == show) return@LaunchedEffect
        if (want) {
            if (!focused && !touched && !tipHover && !TipClock.warm) delay(delayMs)
            show = true
        } else {
            delay(150) // time to cross the gap onto the tip
            show = false
        }
    }
    LaunchedEffect(touched) { if (touched) { delay(2000); touched = false } }
    DisposableEffect(show) {
        if (show) TipClock.up++
        onDispose { if (show) { TipClock.up--; TipClock.hidAt = TimeSource.Monotonic.markNow() } }
    }

    val density = LocalDensity.current
    val provider = remember(density) { with(density) { TipPosition(10.dp.roundToPx(), 8.dp.roundToPx(), 8.dp.roundToPx()) } }
    // shortcut: scrolling does not hide the tip, upgrade if tips sit in scrolling lists where it drifts off its anchor
    Box(
        modifier
            .pointerInput(Unit) {
                awaitPointerEventScope {
                    while (true) {
                        val e = awaitPointerEvent(PointerEventPass.Initial)
                        val mouse = e.changes.firstOrNull()?.type != PointerType.Touch
                        when (e.type) {
                            PointerEventType.Enter -> if (mouse) hover = true
                            PointerEventType.Exit -> hover = false
                            PointerEventType.Press -> if (mouse) show = false
                        }
                    }
                }
            }
            .pointerInput(text) {
                awaitEachGesture {
                    val down = awaitFirstDown(requireUnconsumed = false, pass = PointerEventPass.Initial)
                    if (down.type == PointerType.Touch && !text.isNullOrEmpty() && heldStill(down)) {
                        touched = true
                        swallowUntilUp()
                    }
                }
            }
            // Focus here follows the keyboard: a mouse click or a tap does not focus a control in Compose.
            .onFocusChanged { focused = it.hasFocus }
            .onPreviewKeyEvent {
                if (it.key == Key.Escape && it.type == KeyEventType.KeyDown) { show = false; touched = false }
                false
            },
    ) {
        content()
        if (show && !text.isNullOrEmpty()) {
            Popup(popupPositionProvider = provider, onDismissRequest = { show = false; touched = false }, properties = PopupProperties(focusable = false)) {
                val grow = remember { Animatable(0f) }
                LaunchedEffect(Unit) { grow.animateTo(1f, tween(240, easing = SpringEase)) }
                val shape = RoundedCornerShape(4.dp, 12.dp, 12.dp, 4.dp)
                Column(
                    Modifier
                        .graphicsLayer {
                            val t = grow.value
                            alpha = t.coerceIn(0f, 1f)
                            scaleX = .94f + .06f * t
                            scaleY = scaleX
                        }
                        .hoverable(tipSource)
                        .widthIn(max = 260.dp)
                        .clip(shape)
                        // shortcut: no backdrop blur, the glass is laid on the page colour, upgrade when Compose has a common blur-behind
                        .background(c.bg, shape)
                        .background(c.glass, shape)
                        .border(1.dp, c.glassLine, shape)
                        .drawBehind { drawRect(c.displayInk, size = Size(2.dp.toPx(), size.height)) }
                        .padding(start = 15.dp, top = 9.dp, end = 14.dp, bottom = 9.dp),
                ) {
                    BasicText(text, style = Kometa.type.body.copy(color = c.displayInk, fontWeight = FontWeight.SemiBold, lineHeight = 1.35.em))
                    if (!sub.isNullOrEmpty()) {
                        BasicText(sub, Modifier.padding(top = 1.dp), style = Kometa.type.body.copy(color = c.muted, fontSize = 12.5.sp, lineHeight = 1.35.em))
                    }
                }
            }
        }
    }
}
