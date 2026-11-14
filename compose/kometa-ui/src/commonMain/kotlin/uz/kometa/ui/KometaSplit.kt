package uz.kometa.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Constraints
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** One side of a pair (cash / card). [amount] is already formatted. */
data class KometaSplitSide(val amount: String, val label: String)

/**
 * The widths of two sides that want [a] and [b] px in a row [width] px wide with [gap] between
 * (`flex: 1 1 max-content`): each gets its own width plus half of what is left; null when they do
 * not fit side by side and the second goes under the first.
 */
internal fun splitWidths(a: Int, b: Int, width: Int, gap: Int): Pair<Int, Int>? {
    val left = width - gap - a - b
    return if (left < 0) null else (a + left / 2) to (width - gap - a - left / 2)
}

/**
 * Two display-font figures side by side (`k-split`), each over a muted label. Each side takes its
 * figure's width and they share what is left; when both do not fit, the second wraps under the first.
 * [center] centres each side's text.
 */
@Composable
fun KometaSplit(left: KometaSplitSide, right: KometaSplitSide, modifier: Modifier = Modifier, center: Boolean = false) {
    val c = Kometa.colors
    Layout(
        content = {
            listOf(left, right).forEach { s ->
                Column(horizontalAlignment = if (center) Alignment.CenterHorizontally else Alignment.Start) {
                    BasicText(s.amount, softWrap = false, style = Kometa.type.title.copy(color = c.text, fontSize = 28.sp, fontWeight = FontWeight.Bold, lineHeight = 1.1.em, letterSpacing = (-.03).em, fontFeatureSettings = "tnum"))
                    BasicText(s.label, style = Kometa.type.body.copy(color = c.muted, fontSize = 13.sp))
                }
            }
        },
        modifier = modifier,
    ) { (l, r), constraints ->
        val width = constraints.maxWidth
        val gap = 16.dp.roundToPx()
        val widths = splitWidths(l.maxIntrinsicWidth(Int.MAX_VALUE), r.maxIntrinsicWidth(Int.MAX_VALUE), width, gap)
        if (widths != null) {
            val pl = l.measure(Constraints.fixedWidth(widths.first))
            val pr = r.measure(Constraints.fixedWidth(widths.second))
            layout(width, maxOf(pl.height, pr.height)) { pl.place(0, 0); pr.place(widths.first + gap, 0) }
        } else {
            val pl = l.measure(Constraints.fixedWidth(width))
            val pr = r.measure(Constraints.fixedWidth(width))
            val row = 8.dp.roundToPx()
            layout(width, pl.height + row + pr.height) { pl.place(0, 0); pr.place(0, pl.height + row) }
        }
    }
}
