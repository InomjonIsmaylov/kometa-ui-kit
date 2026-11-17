package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.roundToInt

/** One slice of a [KometaShare]: [value] in the caller's unit (a negative one is listed, not drawn), [text] as the caller writes it. */
public data class KometaShareSegment(val label: String, val value: Double, val text: String, val color: Color)

/**
 * The segment index each tick is drawn in, or -1 for a blank tick when nothing is above zero. A slice
 * above zero always gets at least one tick, so the run can be a little longer than [count].
 */
internal fun shareTicks(values: List<Double>, count: Int = 48): List<Int> {
    val total = values.sumOf { maxOf(0.0, it) }
    val n = count.coerceAtLeast(1)
    if (total == 0.0) return List(n) { -1 }
    return values.flatMapIndexed { i, v -> if (v <= 0) emptyList() else List(maxOf(1, (v / total * n).roundToInt())) { i } }
}

/** "42%" of the positive total, or "" for a slice at or below zero (or nothing to share). */
internal fun sharePercent(value: Double, values: List<Double>): String {
    val total = values.sumOf { maxOf(0.0, it) }
    return if (total > 0 && value > 0) "${(value / total * 100).roundToInt()}%" else ""
}

/**
 * How a whole divides (`k-share`): one bar of ticks where every slice is a run in its own colour, as
 * [KometaMeter] draws units, and a legend under it with each slice's share and amount, so a slice too
 * thin to see and a negative one the bar cannot draw are both still read. The legend is the truth, the
 * colour decoration. Read-only; [label] names the bar for a screen reader.
 */
@Composable
public fun KometaShare(
    segments: List<KometaShareSegment>,
    label: String,
    modifier: Modifier = Modifier,
    legend: Boolean = true,
    percents: Boolean = true,
    tickCount: Int = 48,
) {
    val c = Kometa.colors
    val values = segments.map { it.value }
    val ticks = shareTicks(values, tickCount)
    Column(modifier) {
        Row(
            Modifier.fillMaxWidth().height(22.dp).clearAndSetSemantics { contentDescription = label },
            horizontalArrangement = Arrangement.spacedBy(2.dp),
        ) {
            ticks.forEach { s ->
                val color = if (s < 0) c.glassLine else segments[s].color.copy(alpha = segments[s].color.alpha * .85f)
                Box(Modifier.weight(1f).fillMaxHeight().background(color, RoundedCornerShape(1.dp)))
            }
        }
        if (!legend) return@Column
        // shortcut: hovering a row does not step the others back as on the web, add hover state when a desktop app asks.
        Column(Modifier.padding(top = 8.dp), verticalArrangement = Arrangement.spacedBy(2.dp)) {
            segments.forEach { s ->
                Row(
                    Modifier.fillMaxWidth().padding(vertical = 4.dp).alpha(if (s.value == 0.0) .6f else 1f).semantics(mergeDescendants = true) {},
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    Row(Modifier.weight(1f), horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                        Box(Modifier.size(8.dp).background(s.color, RoundedCornerShape(2.dp)))
                        BasicText(s.label, Modifier.weight(1f, fill = false), style = Kometa.type.md.copy(color = c.muted))
                        if (percents) {
                            BasicText(sharePercent(s.value, values), Modifier.widthIn(min = 26.dp), style = Kometa.type.small.copy(color = c.muted, textAlign = TextAlign.End))
                        }
                    }
                    BasicText(
                        s.text,
                        style = Kometa.type.md.copy(color = if (s.value < 0) c.red else c.displayInk, fontWeight = FontWeight.SemiBold, fontSize = 14.sp),
                        softWrap = false,
                    )
                }
            }
        }
    }
}
