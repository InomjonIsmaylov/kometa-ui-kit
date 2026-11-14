package uz.kometa.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * An explanation that stays in the page (`k-hint`). The [term] itself is the button, with a dotted
 * underline; opened, a 1dp thread grows to 24dp and the [text] fades in beside it, pushing what is
 * below down. [open] is hoisted: a tap asks [onOpenChange] for the other state. [openLabel] /
 * [closedLabel] are read as the term's state.
 */
@Composable
fun KometaHint(
    term: String,
    text: String,
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    openLabel: String = "",
    closedLabel: String = "",
) {
    val c = Kometa.colors
    Column(modifier) {
        // The 44dp touch target is taller than the word; the dotted underline belongs to the word.
        Box(
            Modifier
                .defaultMinSize(minHeight = 44.dp)
                .alpha(if (enabled) 1f else .5f)
                .clickable(remember { MutableInteractionSource() }, indication = null, enabled = enabled, role = Role.Button) { onOpenChange(!open) }
                .semantics { (if (open) openLabel else closedLabel).takeIf { it.isNotEmpty() }?.let { stateDescription = it } },
            contentAlignment = Alignment.CenterStart,
        ) {
            BasicText(
                term,
                Modifier.drawBehind {
                    val y = size.height + 3.dp.toPx()
                    drawLine(c.muted, Offset(0f, y), Offset(size.width, y), 1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(1.dp.toPx(), 2.dp.toPx())))
                },
                style = Kometa.type.md.copy(color = c.displayInk),
            )
        }
        AnimatedVisibility(open, enter = expandVertically(tween(420, easing = SpringEase)), exit = shrinkVertically(tween(420, easing = SpringEase)) + fadeOut(tween(200))) {
            var grown by remember { mutableStateOf(false) }
            LaunchedEffect(Unit) { grown = true }
            val line by animateDpAsState(if (grown) 24.dp else 0.dp, tween(420, easing = SpringEase))
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                Box(Modifier.padding(top = 10.dp).width(line.coerceAtLeast(0.dp)).height(1.dp).background(c.displayInk))
                androidx.compose.animation.AnimatedVisibility(grown, enter = fadeIn(tween(280, 140))) {
                    BasicText(text, Modifier.padding(bottom = 2.dp), style = Kometa.type.md.copy(color = c.muted, fontSize = 14.sp))
                }
            }
        }
    }
}
