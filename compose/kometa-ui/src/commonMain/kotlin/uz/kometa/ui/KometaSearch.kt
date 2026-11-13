package uz.kometa.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** A 1dp hairline along the bottom, with a 2dp [ink] line drawn in from the left to [draw] (0..1). */
internal fun Modifier.underline(base: Color, ink: Color, draw: Float) = drawBehind {
    val y = size.height - .5.dp.toPx()
    drawLine(base, Offset(0f, y), Offset(size.width, y), 1.dp.toPx())
    if (draw > 0f) drawLine(ink, Offset(0f, size.height - 1.dp.toPx()), Offset(size.width * draw, size.height - 1.dp.toPx()), 2.dp.toPx())
}

/**
 * The search as the "whisper" draws it (`k-search`): no box, no magnifier; the [placeholder] is the
 * question in the display font at 32% ink, over a hairline that grows into a 2dp line on focus. A
 * quiet "×" appears once there is text. [label] is the accessible name; [clearLabel] names the "×"
 * (without one it is skipped by a screen reader). [large] is the 42sp hero. [onSearch] runs on the
 * keyboard's search key.
 */
@Composable
fun KometaSearch(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    clearLabel: String = "",
    large: Boolean = false,
    enabled: Boolean = true,
    onSearch: (() -> Unit)? = null,
) {
    val c = Kometa.colors
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    val draw by animateFloatAsState(if (focused) 1f else 0f, tween(420, easing = SpringEase))
    val style = Kometa.type.title.copy(
        color = c.displayInk,
        fontSize = if (large) 42.sp else 22.sp,
        letterSpacing = if (large) (-.04).em else (-.03).em,
        lineHeight = if (large) 1.em else 1.15.em,
    )
    Row(
        modifier.defaultMinSize(minHeight = if (large) 64.dp else 44.dp).underline(c.glassLine, c.displayInk, draw),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicTextField(
            value = value,
            onValueChange = onValueChange,
            modifier = Modifier.weight(1f).alpha(if (enabled) 1f else .5f).semantics { contentDescription = label },
            enabled = enabled,
            singleLine = true,
            textStyle = style,
            cursorBrush = SolidColor(c.displayInk),
            keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            keyboardActions = KeyboardActions(onSearch = { onSearch?.invoke() }),
            interactionSource = source,
            decorationBox = { inner ->
                Box(Modifier.padding(top = if (large) 12.dp else 8.dp, bottom = if (large) 14.dp else 10.dp)) {
                    if (value.isEmpty()) BasicText(placeholder, style = style.copy(color = c.text.copy(alpha = .32f)), maxLines = 1)
                    inner()
                }
            },
        )
        if (value.isNotEmpty() && enabled) {
            Box(
                Modifier.size(44.dp)
                    .clickable(role = Role.Button) { onValueChange("") }
                    .then(if (clearLabel.isNotEmpty()) Modifier.semantics { contentDescription = clearLabel } else Modifier.clearAndSetSemantics {}),
                contentAlignment = Alignment.Center,
            ) {
                BasicText("×", style = Kometa.type.body.copy(color = c.muted, fontSize = 22.sp))
            }
        }
    }
}
