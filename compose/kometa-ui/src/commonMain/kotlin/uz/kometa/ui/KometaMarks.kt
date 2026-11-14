package uz.kometa.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** One day of a read-only week. A null [mark] is a closed day. */
data class KometaMarkDay(val label: String, val mark: String?)

/**
 * A week of marks (`k-marks`): each day's label over its mark ("10:00\n19:00" wraps where written).
 * A closed day (null mark) is muted and shows [empty].
 */
@Composable
fun KometaMarks(days: List<KometaMarkDay>, modifier: Modifier = Modifier, empty: String = "—") {
    val c = Kometa.colors
    Row(modifier, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        days.forEach { d ->
            val ink = if (d.mark == null) c.muted else c.text
            Column(verticalArrangement = Arrangement.spacedBy(2.dp)) {
                BasicText(d.label, style = Kometa.type.body.copy(color = ink, fontSize = 13.sp))
                BasicText(d.mark ?: empty, style = Kometa.type.md.copy(color = ink, fontFeatureSettings = "tnum"))
            }
        }
    }
}
