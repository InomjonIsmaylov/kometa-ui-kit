package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * An action that is only a word and an arrow (`k-word`), for the end of a row. No box, so a column
 * of them stays calm; the arrow leans while pressed. Amber ink; [quiet] for a muted secondary word
 * beside it. [lead] is the screen's one call to action: ink, a hairline under it and the arrow pushed
 * to the end, filling its row. [busy] swaps the hairline for a marching amber one and ignores presses
 * (its [busyLabel] is read out). [arrow] = false drops the arrow. Never destructive: that is [KometaErase].
 */
@Composable
fun KometaWord(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    quiet: Boolean = false,
    lead: Boolean = false,
    busy: Boolean = false,
    arrow: Boolean = true,
    enabled: Boolean = true,
    busyLabel: String = "",
) {
    val c = Kometa.colors
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val ink by animateColorAsState(
        when {
            lead -> c.displayInk
            quiet && pressed -> c.text
            quiet -> c.muted
            else -> c.amberInk
        },
        tween(200),
    )
    val line by animateColorAsState(if (pressed) ink else c.border2, tween(200))
    val lean by animateDpAsState(if (pressed) 4.dp else 0.dp, tween(300, easing = SpringEase))
    val march = if (busy) rememberInfiniteTransition().animateFloat(0f, 1f, infiniteRepeatable(tween(700, easing = LinearEasing))) else null
    val style = Kometa.type.md.copy(color = ink, fontWeight = if (quiet) FontWeight.Medium else FontWeight.SemiBold)

    Row(
        modifier
            .then(if (lead) Modifier.fillMaxWidth() else Modifier)
            .defaultMinSize(minHeight = if (lead) 48.dp else 44.dp)
            .alpha(if (enabled) 1f else .4f)
            .clickable(source, indication = null, enabled = enabled && !busy, role = Role.Button, onClick = onClick)
            .semantics { if (busy && busyLabel.isNotEmpty()) stateDescription = busyLabel }
            .then(
                if (!lead) Modifier
                else if (busy) Modifier.clipToBounds().drawBehind {
                    // 8dp of amber, 6dp gap, sliding one period (14dp) every 700ms.
                    val period = 14.dp.toPx(); val dash = 8.dp.toPx(); val h = 2.dp.toPx()
                    var x = -period + period * (march?.value ?: 0f)
                    while (x < size.width) {
                        drawLine(c.amber, Offset(x, size.height - h / 2), Offset(x + dash, size.height - h / 2), h)
                        x += period
                    }
                }
                else Modifier.textRule(line),
            )
            .padding(horizontal = 2.dp),
        horizontalArrangement = if (lead) Arrangement.SpaceBetween else Arrangement.spacedBy(6.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicText(text, if (lead) Modifier.weight(1f) else Modifier.textRule(line, gap = 1.dp), style = style, maxLines = 1)
        if (arrow) BasicText("→", Modifier.offset(x = lean).alpha(if (busy) .35f else 1f), style = style)
    }
}
