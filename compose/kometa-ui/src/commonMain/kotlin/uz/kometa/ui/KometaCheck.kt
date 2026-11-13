package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * A checkbox with no box (`k-check`): when checked a line runs through the label and the label
 * turns muted. [readOnly] shows the state but ignores presses.
 */
@Composable
fun KometaCheck(
    label: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    readOnly: Boolean = false,
) {
    val c = Kometa.colors
    val ink by animateColorAsState(if (checked) c.muted else c.displayInk, tween(420))
    Box(
        modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = 44.dp)
            .alpha(if (enabled) 1f else .5f)
            .toggleable(checked, enabled = enabled && !readOnly, role = Role.Checkbox, onValueChange = onCheckedChange),
        contentAlignment = Alignment.CenterStart,
    ) {
        // shortcut: the web line grows in from the left; here it appears at once (a platform strike, so it wraps right).
        BasicText(
            label,
            style = Kometa.type.body.copy(
                color = ink,
                fontSize = 15.sp,
                textDecoration = if (checked) TextDecoration.LineThrough else null,
            ),
        )
    }
}
