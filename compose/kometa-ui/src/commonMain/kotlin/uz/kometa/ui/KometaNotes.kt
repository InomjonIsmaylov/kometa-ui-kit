package uz.kometa.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** The stretch of the countdown [left] characters fall in (30, 20, 10, 5 or 0 left), or null above 30. Only a change of stretch is announced. */
internal fun notesStretch(left: Int): Int? = if (left > 30) null else listOf(0, 5, 10, 20, 30).first { left <= it }

/**
 * Free text, several lines (`k-notes`). No box: a hairline under the text draws itself on focus, and
 * the field grows with what is written, never shorter than [rows] lines. With a [maxLength] typing
 * stops at it, and the count shows only in the last 30 characters, amber and then red at the limit;
 * a screen reader hears it only as it crosses 30, 20, 10 and 5 left and at the limit. A screen that
 * draws its own counter passes [showCount] = false. [label] is the accessible name.
 */
@Composable
fun KometaNotes(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    rows: Int = 2,
    maxLength: Int? = null,
    placeholder: String = "",
    showCount: Boolean = true,
    enabled: Boolean = true,
    readOnly: Boolean = false,
) {
    val c = Kometa.colors
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    val draw by animateFloatAsState(if (focused) 1f else .3f, tween(420, easing = SpringEase))
    val style = Kometa.type.body.copy(color = c.text, fontSize = 16.sp, lineHeight = 1.5.em)
    val left = maxLength?.let { it - value.length }

    Column(modifier) {
        BasicTextField(
            value = value,
            onValueChange = { onValueChange(if (maxLength != null) it.take(maxLength) else it) },
            modifier = Modifier
                .fillMaxWidth()
                .alpha(if (enabled) 1f else .4f)
                .semantics { contentDescription = label }
                .drawBehind {
                    val y = size.height - .5.dp.toPx()
                    drawLine(c.displayInk.copy(alpha = .5f + .5f * (draw - .3f) / .7f), Offset(0f, y), Offset(size.width * draw, y), 1.dp.toPx())
                },
            enabled = enabled,
            readOnly = readOnly,
            textStyle = style,
            minLines = rows,
            cursorBrush = SolidColor(c.displayInk),
            interactionSource = source,
            decorationBox = { inner ->
                Box(Modifier.padding(bottom = 8.dp)) {
                    if (value.isEmpty()) BasicText(placeholder, style = style.copy(color = c.muted))
                    inner()
                }
            },
        )
        if (showCount && maxLength != null && left != null && left <= 30) {
            BasicText(
                "${value.length} / $maxLength",
                Modifier.fillMaxWidth().padding(top = 2.dp).clearAndSetSemantics {},
                style = Kometa.type.mono.copy(
                    color = if (left <= 0) c.red else c.amberInk,
                    fontSize = 12.sp,
                    textAlign = TextAlign.End,
                ),
            )
        }
        if (showCount && maxLength != null) {
            // Polite and silent between stretches: the text only changes when the stretch does.
            val stretch = notesStretch(left ?: Int.MAX_VALUE)
            val said = remember(stretch) { if (stretch == null) "" else "${value.length} / $maxLength" }
            Box(Modifier.align(Alignment.End).semantics { liveRegion = LiveRegionMode.Polite; contentDescription = said })
        }
    }
}
