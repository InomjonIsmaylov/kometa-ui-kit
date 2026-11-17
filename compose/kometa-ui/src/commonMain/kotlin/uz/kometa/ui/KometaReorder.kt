package uz.kometa.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.layout.onPlaced
import androidx.compose.ui.layout.positionInParent
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.zIndex
import kotlin.math.sign

/** [list] with the item at [from] taken out and put back at [to]. */
internal fun <T> reorderMove(list: List<T>, from: Int, to: Int): List<T> =
    list.toMutableList().apply { add(to, removeAt(from)) }

/** Where a row dragged [dy] px from [from] lands: how many of the other rows have their middle above its middle. */
internal fun reorderTarget(centres: List<Float>, from: Int, dy: Float): Int {
    val at = centres[from] + dy
    return centres.indices.count { it != from && centres[it] < at }
}

/** How far row [i] slides while row [from] is dragged to [to]: up a [step] if it is passed going down, down one going up. */
internal fun reorderShift(i: Int, from: Int, to: Int, step: Float): Float = when {
    from < i && i <= to -> -step
    to <= i && i < from -> step
    else -> 0f
}

private class ReorderDrag(val from: Int, val to: Int, val dy: Float, val step: Float, val centres: List<Float>)

/**
 * A list put in order by dragging each row's grip (`k-reorder`). The row lifts, tilts a little and
 * casts a shadow while the others slide aside to make room; on release [onItemsChange] gets the new
 * order and [onMove] says what went where. [row] draws an item beside its grip. Rows are keyed by the
 * items themselves, so items must be distinct. A screen reader hears each grip as [grabLabel] plus
 * [labelOf], with its position, and moves the row with the [moveUpLabel] / [moveDownLabel] actions.
 */
@Composable
public fun <T> KometaReorder(
    items: List<T>,
    onItemsChange: (List<T>) -> Unit,
    modifier: Modifier = Modifier,
    labelOf: (T) -> String = { it.toString() },
    onMove: (from: Int, to: Int) -> Unit = { _, _ -> },
    grabLabel: String = Kometa.strings.move,
    moveUpLabel: String = Kometa.strings.moveUp,
    moveDownLabel: String = Kometa.strings.moveDown,
    positionLabel: (n: Int, total: Int) -> String = Kometa.strings.position.let { t -> { n, total -> t.replace("{n}", "$n").replace("{total}", "$total") } },
    description: String = "",
    row: @Composable (item: T, index: Int) -> Unit,
) {
    val c = Kometa.colors
    var drag by remember { mutableStateOf<ReorderDrag?>(null) }
    // Where each row sits, written while placing, read when a drag starts.
    val tops = remember { mutableMapOf<Int, Float>() }
    val heights = remember { mutableMapOf<Int, Float>() }
    val current by rememberUpdatedState(items)
    val change by rememberUpdatedState(onItemsChange)
    val moved by rememberUpdatedState(onMove)
    val place = { from: Int, to: Int ->
        if (from != to && to in current.indices) { change(reorderMove(current, from, to)); moved(from, to) }
    }
    val shape = RoundedCornerShape(12.dp)

    Column(
        modifier.semantics { if (description.isNotEmpty()) contentDescription = description },
        verticalArrangement = Arrangement.spacedBy(6.dp),
    ) {
        items.forEachIndexed { i, item ->
            key(item) {
                val index by rememberUpdatedState(i)
                val d = drag
                val lifted = d?.from == i
                val slide by animateFloatAsState(if (d == null || lifted) 0f else reorderShift(i, d.from, d.to, d.step), tween(350, easing = SpringEase))
                Row(
                    Modifier
                        .fillMaxWidth()
                        .onPlaced { tops[i] = it.positionInParent().y; heights[i] = it.size.height.toFloat() }
                        .zIndex(if (lifted) 1f else 0f)
                        .graphicsLayer {
                            // The slide is applied as a translation, so the spring's overshoot never resizes anything.
                            translationY = if (lifted) d!!.dy else if (d == null) 0f else slide
                            if (lifted) { rotationZ = -1f; scaleX = 1.03f; scaleY = 1.03f }
                        }
                        .then(if (lifted) Modifier.shadow(14.dp, shape, ambientColor = Color.Black, spotColor = Color.Black) else Modifier)
                        .background(if (lifted) c.glass else c.bg, shape)
                        .border(1.dp, if (lifted) c.displayInk.copy(alpha = .3f) else c.glassLine, shape)
                        .defaultMinSize(minHeight = 44.dp)
                        .padding(start = 4.dp, end = 12.dp),
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Box(
                        Modifier
                            .size(44.dp)
                            .semantics {
                                contentDescription = "$grabLabel ${labelOf(item)}"
                                stateDescription = positionLabel(i + 1, items.size)
                                customActions = buildList {
                                    if (i > 0) add(CustomAccessibilityAction(moveUpLabel) { place(index, index - 1); true })
                                    if (i < items.size - 1) add(CustomAccessibilityAction(moveDownLabel) { place(index, index + 1); true })
                                }
                            }
                            // shortcut: the grip drags at once on touch as on the web (no long-press on the row), add detectDragGesturesAfterLongPress on the row if rows need it.
                            .pointerInput(Unit) {
                                detectDragGestures(
                                    onDragStart = {
                                        val n = current.size
                                        val top = List(n) { tops[it] ?: 0f }
                                        val h = List(n) { heights[it] ?: 0f }
                                        val gap = if (n > 1) (top[1] - top[0] - h[0]).coerceAtLeast(0f) else 0f
                                        drag = ReorderDrag(index, index, 0f, h[index] + gap, List(n) { top[it] + h[it] / 2 })
                                    },
                                    onDragEnd = { drag?.let { place(it.from, it.to) }; drag = null },
                                    onDragCancel = { drag = null },
                                ) { e, amount ->
                                    e.consume()
                                    // The first move only reports what is past the touch slop; add the slop back so the row stays under the finger.
                                    val by = if (drag?.dy == 0f && amount.y != 0f) amount.y + sign(amount.y) * viewConfiguration.touchSlop else amount.y
                                    drag = drag?.let { ReorderDrag(it.from, reorderTarget(it.centres, it.from, it.dy + by), it.dy + by, it.step, it.centres) }
                                }
                            },
                        contentAlignment = Alignment.Center,
                    ) {
                        val ink = if (lifted) c.displayInk else c.muted
                        Canvas(Modifier.size(10.dp, 16.dp)) {
                            val u = size.width / 10
                            for (x in listOf(2f, 8f)) for (y in listOf(2f, 8f, 14f)) drawCircle(ink, 1.5f * u, Offset(x * u, y * u))
                        }
                    }
                    Box(Modifier.weight(1f)) { row(item, i) }
                }
            }
        }
    }
}
