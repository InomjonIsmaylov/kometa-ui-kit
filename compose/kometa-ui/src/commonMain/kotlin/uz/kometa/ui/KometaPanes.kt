package uz.kometa.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.unit.dp
import kotlin.math.abs
import kotlin.math.roundToInt

/** The snaps the split may rest on: those within [min]..[max], in order. */
internal fun panesStops(snaps: List<Int>, min: Int, max: Int): List<Int> = snaps.filter { it in min..max }.sorted()

/** The allowed size nearest to [v] percent: the closest of [stops], or [v] rounded into [min]..[max] when there are none. */
internal fun panesFit(v: Float, stops: List<Int>, min: Int, max: Int): Int =
    stops.minByOrNull { abs(it - v) } ?: v.roundToInt().coerceIn(min, max)

/** One step from [now]: to the next stop that way (or stay at the last), or by 5% when there are no stops. */
internal fun panesStep(now: Int, forward: Boolean, stops: List<Int>, min: Int, max: Int): Int = when {
    stops.isEmpty() -> panesFit(now + if (forward) 5f else -5f, stops, min, max)
    forward -> stops.firstOrNull { it > now } ?: now
    else -> stops.lastOrNull { it < now } ?: now
}

/**
 * Two panes side by side with a line between them that you drag to resize (`k-panes`). The line is a
 * dot until hovered or dragged, then it grows to full height. [size] is the first pane's share of the
 * width in percent. With [snaps] the split only rests on those, and a row of ticks above marks them,
 * the current one standing tall; an empty [snaps] lets it go anywhere in [min]..[max]. A screen reader
 * hears an adjustable [description] that steps to the next snap (or by 5%). The frame is 240dp tall
 * unless [modifier] sets a height.
 */
@Composable
public fun KometaPanes(
    size: Int,
    onSizeChange: (Int) -> Unit,
    start: @Composable () -> Unit,
    end: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    snaps: List<Int> = listOf(25, 33, 50, 66, 75),
    min: Int = 15,
    max: Int = 85,
    description: String = Kometa.strings.resizePanes,
) {
    val c = Kometa.colors
    val stops = remember(snaps, min, max) { panesStops(snaps, min, max) }
    val change by rememberUpdatedState(onSizeChange)
    val now by rememberUpdatedState(size)
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    var dragging by remember { mutableStateOf(false) }
    val line by animateFloatAsState(if (hovered || dragging) 1f else 0f, tween(350, easing = SpringEase))
    val density = LocalDensity.current

    Column(modifier.height(240.dp)) {
        if (stops.isNotEmpty()) {
            BoxWithConstraints(Modifier.fillMaxWidth().height(10.dp)) {
                stops.forEach { s ->
                    val on = s == size
                    val h by animateFloatAsState(if (on) 1f else .6f, tween(300, easing = SpringEase))
                    Box(
                        Modifier
                            .offset(x = maxWidth * (s / 100f))
                            .align(Alignment.BottomStart)
                            .width(1.dp)
                            .fillMaxHeight(h.coerceIn(.1f, 1f))
                            .background(if (on) c.displayInk else c.muted.copy(alpha = .6f)),
                    )
                }
            }
            Box(Modifier.height(4.dp))
        }
        val shape = RoundedCornerShape(12.dp)
        BoxWithConstraints(Modifier.fillMaxWidth().weight(1f).clip(shape).border(1.dp, c.glassLine, shape)) {
            val w = with(density) { maxWidth.toPx() }
            val grip = 24.dp
            val first = maxWidth * (size.coerceIn(0, 100) / 100f)
            Row(Modifier.fillMaxSize()) {
                // shortcut: panes clip rather than scroll (the web overflow auto), put a verticalScroll in the slot.
                Box(Modifier.width(first).fillMaxHeight().clipToBounds()) { start() }
                Box(Modifier.width(grip).fillMaxHeight(), contentAlignment = Alignment.Center) {
                    Box(Modifier.width(1.dp).fillMaxHeight(line.coerceIn(0f, 1f)).background(c.displayInk))
                    Box(Modifier.size(3.dp).background(c.displayInk, CircleShape))
                }
                Box(Modifier.weight(1f).fillMaxHeight().clipToBounds()) { end() }
            }
            // The hit area is 44dp wide around the line, over the edges of both panes.
            Box(
                Modifier
                    .offset(x = first + grip / 2 - 22.dp)
                    .width(44.dp)
                    .fillMaxHeight()
                    .hoverable(source)
                    .semantics {
                        contentDescription = description
                        progressBarRangeInfo = ProgressBarRangeInfo(size.toFloat(), (stops.firstOrNull() ?: min).toFloat()..(stops.lastOrNull() ?: max).toFloat())
                        setProgress { v -> if (v.roundToInt() != now) change(panesStep(now, v > now, stops, min, max)); true }
                    }
                    .pointerInput(stops, min, max, w) {
                        var x = 0f
                        detectHorizontalDragGestures(
                            onDragStart = { dragging = true; x = w * now / 100f },
                            onDragEnd = { dragging = false },
                            onDragCancel = { dragging = false },
                        ) { e, dx ->
                            e.consume()
                            x += dx
                            if (w > 0f) panesFit(x / w * 100f, stops, min, max).let { if (it != now) change(it) }
                        }
                    },
            )
        }
    }
}
