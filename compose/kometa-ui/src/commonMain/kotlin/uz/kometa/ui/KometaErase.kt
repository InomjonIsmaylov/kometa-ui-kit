package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** A text underline drawn by hand, so it can be [color] (the web's `text-decoration-color`) and sit [gap] below the text. */
internal fun Modifier.textRule(color: Color, gap: Dp = 0.dp, width: Dp = 1.dp) = drawBehind {
    val y = size.height + gap.toPx() - width.toPx() / 2
    drawLine(color, Offset(0f, y), Offset(size.width, y), width.toPx())
}

/**
 * A destructive action that lives inline (`k-erase`): a red underlined word. Deliberately quiet; the
 * loud red button belongs to the confirm step ([KometaPair]), so the list itself never shouts. The
 * underline is 40% red and goes solid while pressed.
 */
@Composable
fun KometaErase(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
) {
    val red = Kometa.colors.red
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val line by animateColorAsState(red.copy(alpha = if (pressed) 1f else .4f), tween(200))
    Box(
        modifier
            .defaultMinSize(minHeight = 44.dp)
            .alpha(if (enabled) 1f else .4f)
            .clickable(source, indication = null, enabled = enabled, role = Role.Button, onClick = onClick)
            .padding(horizontal = 4.dp),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(text, Modifier.textRule(line, gap = 1.dp), style = Kometa.type.md.copy(color = red))
    }
}
