package uz.kometa.ui

import androidx.compose.foundation.Canvas
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.size
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.graphics.drawscope.scale
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.vector.PathParser
import androidx.compose.ui.platform.LocalLayoutDirection
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp

private const val STAR = "M12 2.6l2.7 6.1 6.6.6-5 4.4 1.5 6.5L12 16.9 6.2 20.2 7.7 13.7 2.7 9.3l6.6-.6L12 2.6z"

/** Per star: 2 full, 1 half, 0 empty, with [value] rounded to the nearest half and clamped to 0..[max]. */
internal fun starFills(value: Float, max: Int): List<Int> {
    val halves = kotlin.math.round(value.coerceIn(0f, max.toFloat()) * 2).toInt()
    return List(max) { i -> (halves - i * 2).coerceIn(0, 2) }
}

/**
 * Five inline stars (`k-stars`) showing a score: whole stars filled, a half star filled on its
 * start side, the rest outlines. [label] is the accessible name ("4.5 of 5"), owned by the caller.
 */
@Composable
fun KometaStars(value: Float, label: String, modifier: Modifier = Modifier, max: Int = 5, size: Dp = 16.dp) {
    val amber = Kometa.colors.amber
    val path = remember { PathParser().parsePathString(STAR).toPath() }
    val rtl = LocalLayoutDirection.current == LayoutDirection.Rtl
    Row(modifier.clearAndSetSemantics { contentDescription = label }, horizontalArrangement = Arrangement.spacedBy(2.dp)) {
        starFills(value, max).forEach { fill ->
            Canvas(Modifier.size(size)) {
                scale(this.size.width / 24f, pivot = androidx.compose.ui.geometry.Offset.Zero) {
                    drawPath(path, amber, style = Stroke(1.6f, join = StrokeJoin.Round))
                    if (fill == 2) drawPath(path, amber)
                    if (fill == 1) clipRect(left = if (rtl) 12f else 0f, right = if (rtl) 24f else 12f) { drawPath(path, amber) }
                }
            }
        }
    }
}
