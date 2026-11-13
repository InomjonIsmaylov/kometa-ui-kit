package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/**
 * How a score is given (`k-rating`): numerals 1..[max] as a radio group, the chosen one cream with a
 * bead under it, and [words] (`words[n - 1]` is the word for score n) below. 0 is "nothing chosen
 * yet"; pressing the chosen numeral again keeps it. Use [KometaStars] to only display a score.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KometaRating(
    value: Int,
    onValueChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    max: Int = 5,
    words: List<String> = emptyList(),
    label: String = "",
    showWord: Boolean = true,
    enabled: Boolean = true,
    readOnly: Boolean = false,
) {
    val c = Kometa.colors
    Column(modifier.alpha(if (enabled) 1f else .5f), verticalArrangement = Arrangement.spacedBy(12.dp)) {
        FlowRow(
            Modifier.selectableGroup().semantics { if (label.isNotEmpty()) contentDescription = label },
            horizontalArrangement = Arrangement.spacedBy(4.dp),
        ) {
            for (n in 1..max.coerceAtLeast(1)) {
                val on = n == value
                val ink by animateColorAsState(if (on) c.displayInk else c.muted, tween(420))
                val bead by animateFloatAsState(if (on) 1f else 0f, tween(420, easing = CubicBezierEasing(.22f, 1.35f, .32f, 1f)))
                BasicText(
                    "$n",
                    Modifier
                        .defaultMinSize(minWidth = 44.dp, minHeight = 44.dp)
                        .selectable(on, enabled = enabled && !readOnly, role = Role.RadioButton) { if (!on) onValueChange(n) }
                        .semantics { words.getOrNull(n - 1)?.let { contentDescription = "$n, $it" } }
                        .drawBehind { drawCircle(c.displayInk, 2.5.dp.toPx() * bead, Offset(size.width / 2, size.height - 2.5.dp.toPx())) }
                        .padding(bottom = 10.dp),
                    style = Kometa.type.title.copy(color = ink, fontSize = 26.sp, letterSpacing = (-.03).em, textAlign = TextAlign.Center),
                )
            }
        }
        if (showWord) {
            BasicText(
                words.getOrNull(value - 1).orEmpty(),
                Modifier.defaultMinSize(minHeight = 22.dp).clearAndSetSemantics {},
                style = Kometa.type.title.copy(color = c.displayInk, fontSize = 18.sp, letterSpacing = (-.02).em),
            )
        }
    }
}
