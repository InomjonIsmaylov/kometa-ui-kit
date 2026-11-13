package uz.kometa.ui

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** The next value one [step] away, clamped to [min]..[max]. */
internal fun stepValue(value: Int, step: Int, min: Int, max: Int?): Int {
    val next = (value + step).coerceAtLeast(min)
    return if (max != null) next.coerceAtMost(max) else next
}

/**
 * A number between two hairline circles (`k-stepper`). The figure rolls when it changes and a
 * circle dims at its limit. Words (unit, button labels) come from the caller.
 */
@Composable
fun KometaStepper(
    value: Int,
    onValueChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    min: Int = 0,
    max: Int? = null,
    step: Int = 1,
    unit: String = "",
    label: String = "",
    decrementLabel: String = "",
    incrementLabel: String = "",
    enabled: Boolean = true,
    readOnly: Boolean = false,
) {
    val c = Kometa.colors
    val live = enabled && !readOnly

    @Composable
    fun Circle(glyph: String, name: String, canGo: Boolean, delta: Int) = Box(
        Modifier
            .size(44.dp)
            .alpha(if (canGo && enabled) 1f else .35f)
            .clip(CircleShape)
            .border(1.dp, c.glassLine, CircleShape)
            .clickable(enabled = live && canGo, role = Role.Button) { onValueChange(stepValue(value, delta, min, max)) }
            .semantics { if (name.isNotEmpty()) contentDescription = name },
        contentAlignment = Alignment.Center,
    ) {
        BasicText(glyph, style = Kometa.type.body.copy(color = c.displayInk, fontSize = 18.sp))
    }

    Row(
        modifier.semantics(mergeDescendants = false) {
            if (label.isNotEmpty()) contentDescription = label
            stateDescription = "$value $unit".trim()
        },
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        Circle("−", decrementLabel, value > min, -step)
        Row(Modifier.defaultMinSize(minWidth = 84.dp), horizontalArrangement = Arrangement.Center, verticalAlignment = Alignment.Bottom) {
            AnimatedContent(value, transitionSpec = {
                val up = targetState > initialState
                slideInVertically { if (up) it else -it } togetherWith slideOutVertically { if (up) -it else it }
            }) { n ->
                BasicText("$n", style = Kometa.type.title.copy(color = c.displayInk, fontSize = 28.sp, textAlign = TextAlign.Center))
            }
            if (unit.isNotEmpty()) BasicText(" $unit", style = Kometa.type.md.copy(color = c.muted))
        }
        Circle("+", incrementLabel, max == null || value < max, step)
    }
}
