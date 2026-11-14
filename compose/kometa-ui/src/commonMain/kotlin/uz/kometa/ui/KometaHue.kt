package uz.kometa.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.floor
import kotlin.math.max
import kotlin.math.min

/** `#RRGGBB` for a hue (0..360) at a saturation and lightness in percent; the web kit's `hslToHex`. */
internal fun hslToHex(h: Float, s: Float, l: Float): String {
    val a = s / 100f * min(l / 100f, 1 - l / 100f)
    fun f(n: Int): String {
        val k = (n + h / 30f) % 12f
        val c = l / 100f - a * max(-1f, min(min(k - 3, 9 - k), 1f))
        return floor(c * 255 + .5f).toInt().coerceIn(0, 255).toString(16).padStart(2, '0') // half up, like JS Math.round
    }
    return "#${f(0)}${f(8)}${f(4)}".uppercase()
}

/** The hue (0..360) of a `#RRGGBB` colour; a grey, or anything that is not `#RRGGBB`, is 0. */
internal fun hexToHue(hex: String): Float {
    val m = Regex("^#?([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$").find(hex.trim()) ?: return 0f
    val (r, g, b) = m.groupValues.drop(1).map { it.toInt(16) / 255f }
    val hi = max(r, max(g, b))
    val d = hi - min(r, min(g, b))
    if (d == 0f) return 0f
    val h = when (hi) { r -> ((g - b) / d) % 6; g -> (b - r) / d + 2; else -> (r - g) / d + 4 }
    return (h * 60 + 360) % 360
}

/** The tick (0 until [count]) nearest the hue of [hex]. */
internal fun hueTick(hex: String, count: Int): Int {
    val n = count.coerceAtLeast(1)
    return floor(hexToHue(hex) / 360f * n + .5f).toInt() % n
}

/** `#RRGGBB` as a [Color]; anything else is transparent. */
internal fun hexColor(hex: String): Color =
    hex.trim().removePrefix("#").takeIf { it.length == 6 }?.toLongOrNull(16)?.let { Color(0xFF000000 or it) } ?: Color.Transparent

/**
 * A colour picked from a row of hue ticks (`k-hue`): every tick is drawn in its own hue and the chosen
 * one stands tall, the rest lie at 45%. A disc of the colour and its hex in mono sit underneath
 * ([showValue] = false hides them). [saturation] and [lightness] are fixed by the caller, so every pick
 * sits in one family. Tap or drag along the row; TalkBack adjusts it with the usual slider gestures.
 * [value] is `#RRGGBB`, and [onValueChange] always gets one of the row's own colours.
 */
@Composable
fun KometaHue(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    count: Int = 24,
    saturation: Float = 75f,
    lightness: Float = 62f,
    height: Dp = 26.dp,
    showValue: Boolean = true,
    enabled: Boolean = true,
    label: String = "",
) {
    val c = Kometa.colors
    val n = count.coerceAtLeast(1)
    val colours = remember(n, saturation, lightness) { List(n) { hslToHex(it * 360f / n, saturation, lightness) } }
    val at = hueTick(value, n)
    val current by rememberUpdatedState(value)
    val change by rememberUpdatedState(onValueChange)
    fun pick(i: Int) { colours[i.coerceIn(0, n - 1)].let { if (it != current) change(it) } }
    fun pickAt(x: Float, width: Int) { if (width > 0) pick(floor(x / width * n).toInt()) }

    // shortcut: no arrow/Home/End keys (TalkBack and taps cover phones), add onKeyEvent when a desktop app needs it.
    Column(modifier) {
        Box(
            Modifier.fillMaxWidth().heightIn(min = 44.dp).alpha(if (enabled) 1f else .5f)
                .clearAndSetSemantics {
                    if (label.isNotEmpty()) contentDescription = label
                    stateDescription = value
                    progressBarRangeInfo = ProgressBarRangeInfo(at.toFloat(), 0f..(n - 1).coerceAtLeast(1).toFloat(), (n - 2).coerceAtLeast(0))
                    if (enabled) setProgress { pick(floor(it + .5f).toInt()); true } else disabled()
                }
                .then(
                    if (!enabled) Modifier
                    else Modifier
                        .pointerInput(n) { detectTapGestures(onPress = { pickAt(it.x, size.width) }) }
                        .pointerInput(n) { detectHorizontalDragGestures { ch, _ -> pickAt(ch.position.x, size.width) } },
                ),
            contentAlignment = Alignment.BottomCenter,
        ) {
            Row(Modifier.fillMaxWidth().height(height), horizontalArrangement = Arrangement.spacedBy(2.dp), verticalAlignment = Alignment.Bottom) {
                colours.forEachIndexed { i, hex ->
                    val scale by animateFloatAsState(if (i == at) 1f else .45f, tween(300, easing = SpringEase))
                    Box(
                        Modifier.weight(1f).fillMaxHeight()
                            .graphicsLayer { scaleY = scale; transformOrigin = TransformOrigin(.5f, 1f) }
                            .background(hexColor(hex), RoundedCornerShape(1.dp)),
                    )
                }
            }
        }
        if (showValue) Row(Modifier.padding(top = 10.dp), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Box(Modifier.size(18.dp).border(1.dp, c.glassLine, CircleShape).background(hexColor(value), CircleShape))
            BasicText(value, style = Kometa.type.mono.copy(color = c.text2, fontSize = 12.sp))
        }
    }
}
