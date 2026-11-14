package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
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

enum class KometaNotePlacement { Auto, Above, Below }

/**
 * Where a note's tab goes: centred over the [anchor] [gap] px above it (below when [placement] says so,
 * or for Auto when there is no room above), always kept [pad] px inside the [window].
 */
internal fun placeNote(anchor: IntRect, window: IntSize, tip: IntSize, gap: Int, pad: Int, placement: KometaNotePlacement): IntOffset {
    val above = when (placement) {
        KometaNotePlacement.Auto -> anchor.top - gap - tip.height >= pad
        KometaNotePlacement.Above -> true
        KometaNotePlacement.Below -> false
    }
    val y = if (above) anchor.top - gap - tip.height else anchor.bottom + gap
    val x = (anchor.left + anchor.width / 2 - tip.width / 2).coerceAtMost(window.width - pad - tip.width).coerceAtLeast(pad)
    return IntOffset(x, y)
}

private class NotePosition(val gap: Int, val pad: Int, val placement: KometaNotePlacement) : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize) =
        placeNote(anchorBounds, windowSize, popupContentSize, gap, pad, placement)
}

/**
 * An explanation that floats and moves nothing (`k-note`): a small ⓘ marker and, open, a cream tab
 * with the [text] in a popup above the page, so no clipping parent can cut it. A tap opens and
 * closes it, a tap elsewhere or Back closes it, and a mouse hover opens it. The tab sits above the
 * marker, flips below near the top edge ([placement]) and stays inside the window. [label] is the
 * marker's accessible name; without one the marker is described by the text itself.
 */
@Composable
fun KometaNote(text: String, modifier: Modifier = Modifier, label: String = "", placement: KometaNotePlacement = KometaNotePlacement.Auto) {
    val c = Kometa.colors
    var tapped by remember { mutableStateOf(false) }
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    val open = tapped || hovered
    val density = LocalDensity.current
    val provider = remember(placement, density) { with(density) { NotePosition(8.dp.roundToPx(), 8.dp.roundToPx(), placement) } }
    val ink = if (open) c.displayInk else c.muted

    Box(
        modifier
            .size(44.dp)
            .hoverable(source)
            .clickable(remember { MutableInteractionSource() }, indication = null, role = Role.Button) { tapped = !tapped }
            .semantics { contentDescription = label.ifEmpty { text }; if (label.isNotEmpty() && open) stateDescription = text },
        contentAlignment = Alignment.Center,
    ) {
        Canvas(Modifier.size(13.dp)) {
            val u = size.width / 24
            val stroke = Stroke(2 * u, cap = StrokeCap.Round)
            drawCircle(ink, 9 * u, style = stroke)
            drawLine(ink, Offset(12 * u, 11 * u), Offset(12 * u, 16 * u), 2 * u, StrokeCap.Round)
            drawLine(ink, Offset(12 * u, 7.5f * u), Offset(12 * u, 7.51f * u), 2 * u, StrokeCap.Round)
        }
        if (open) {
            Popup(popupPositionProvider = provider, onDismissRequest = { tapped = false }, properties = PopupProperties(focusable = tapped)) {
                val rise = remember { Animatable(0f) }
                LaunchedEffect(Unit) { rise.animateTo(1f, tween(320, easing = SpringEase)) }
                BasicText(
                    text,
                    Modifier
                        .graphicsLayer { alpha = rise.value.coerceIn(0f, 1f); translationY = (1f - rise.value) * 6.dp.toPx() }
                        .widthIn(max = 260.dp)
                        .clip(RoundedCornerShape(8.dp))
                        .background(c.displayInk)
                        .padding(horizontal = 12.dp, vertical = 8.dp),
                    style = Kometa.type.body.copy(color = c.bg, fontSize = 13.5.sp, fontWeight = FontWeight.Medium, lineHeight = 1.45.em),
                )
            }
        }
    }
}
