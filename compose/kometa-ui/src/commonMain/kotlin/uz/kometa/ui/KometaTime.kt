package uz.kometa.ui

import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.grid.rememberLazyGridState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** Minutes after midnight as "09:05". */
internal fun timeLabel(minutes: Int): String {
    fun pad(n: Int) = n.toString().padStart(2, '0')
    return "${pad(minutes / 60)}:${pad(minutes % 60)}"
}

/** The day in [step] minutes (at least 1); a [held] time off that grid is slotted in so it stays listed. */
internal fun timeSlots(step: Int, held: Int?): List<Int> {
    val grid = (0 until 24 * 60 step step.coerceAtLeast(1)).toList()
    return if (held == null || held in grid) grid else (grid + held).sorted()
}

/**
 * A time of day (`k-time`). The time is a figure with a hairline under it, like [KometaDate]; a tap opens a
 * glass list of times in four columns, in a popup that flips above when there is no room below, scrolled to
 * the held time (or 09:00). [value] is minutes after midnight (0–1439, `null` for none); [step] is the
 * minutes between the times listed, and a held time off that grid (09:07) is listed too, so nothing is lost
 * by opening it. Picking calls [onValueChange] and closes; a tap outside or Back closes too. With
 * [clearable] a Clear link ([clearLabel]) under the list sets it back to `null`.
 * [description] is the accessible name.
 */
@Composable
fun KometaTime(
    value: Int?,
    onValueChange: (Int?) -> Unit,
    modifier: Modifier = Modifier,
    step: Int = 15,
    placeholder: String = "—",
    clearable: Boolean = false,
    clearLabel: String = "Clear",
    enabled: Boolean = true,
    description: String = "",
) {
    val c = Kometa.colors
    var open by remember { mutableStateOf(false) }
    Box(modifier) {
        KometaFigureField(value?.let(::timeLabel) ?: placeholder, value == null, open, enabled, description) { open = !open }
        KometaPop(open, { open = it }, label = description, width = 272.dp) {
            val slots = remember(step, value) { timeSlots(step, value) }
            val at = slots.indexOf(value ?: 9 * 60).coerceAtLeast(0)
            // Three rows above the held time, so it opens near the middle of the list.
            val grid = rememberLazyGridState(initialFirstVisibleItemIndex = (at / 4 - 3).coerceAtLeast(0) * 4)
            // shortcut: no arrow-key moves over the list and focus is not put on the held time, Tab walks it; upgrade with FocusRequesters when keyboard use matters
            LazyVerticalGrid(
                GridCells.Fixed(4),
                Modifier.fillMaxWidth().heightIn(max = 320.dp).padding(4.dp),
                state = grid,
                horizontalArrangement = Arrangement.spacedBy(2.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                items(slots) { m ->
                    val on = m == value
                    Box(
                        Modifier
                            .height(44.dp)
                            .then(if (on) Modifier.border(2.dp, c.displayInk, RoundedCornerShape(10.dp)) else Modifier)
                            .selectable(on, role = Role.Button) { onValueChange(m); open = false },
                        contentAlignment = Alignment.Center,
                    ) {
                        BasicText(
                            timeLabel(m),
                            style = Kometa.type.md.copy(
                                color = if (on) c.displayInk else c.text,
                                fontWeight = if (on) FontWeight.SemiBold else FontWeight.Medium,
                                fontFeatureSettings = "tnum",
                            ),
                        )
                    }
                }
            }
            if (clearable && value != null) {
                BasicText(
                    clearLabel,
                    Modifier
                        .align(Alignment.CenterHorizontally)
                        .padding(top = 4.dp)
                        .heightIn(min = 44.dp)
                        .clickable(role = Role.Button) { onValueChange(null); open = false }
                        .padding(horizontal = 8.dp, vertical = 12.dp),
                    style = Kometa.type.md.copy(fontSize = 13.sp, color = c.muted, textDecoration = TextDecoration.Underline),
                )
            }
        }
    }
}
