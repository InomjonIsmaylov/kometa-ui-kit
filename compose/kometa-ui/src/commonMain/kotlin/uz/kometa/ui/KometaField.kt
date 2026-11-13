package uz.kometa.ui

import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/**
 * The text field as the "whisper" draws it (`k-field`): no box, the placeholder is the label
 * (display font, 24sp; 18sp when [small]), one hairline under it, and on focus a cream line draws in
 * from the left. Under it an optional "4 / 40" counter and an error line. [label] is also the
 * accessible name. [maxLength] cuts input at that length.
 */
@Composable
fun KometaField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String = label,
    small: Boolean = false,
    password: Boolean = false,
    keyboardOptions: KeyboardOptions = KeyboardOptions.Default,
    maxLength: Int? = null,
    showCount: Boolean = false,
    error: String = "",
    enabled: Boolean = true,
    readOnly: Boolean = false,
) {
    val c = Kometa.colors
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    val bad = error.isNotEmpty()
    val draw by animateFloatAsState(
        if (focused || bad) 1f else 0f,
        tween(680, easing = CubicBezierEasing(.22f, 1.35f, .32f, 1f)),
    )
    val ink = if (bad) c.error else c.displayInk
    val style = Kometa.type.title.copy(
        color = c.displayInk,
        fontSize = if (small) 18.sp else 24.sp,
        fontWeight = FontWeight.Bold,
        letterSpacing = (-.03).em,
        lineHeight = 1.15.em,
    )

    Column(modifier, verticalArrangement = Arrangement.spacedBy(6.dp)) {
        BasicTextField(
            value = value,
            onValueChange = { onValueChange(if (maxLength != null) it.take(maxLength) else it) },
            modifier = Modifier
                .fillMaxWidth()
                .defaultMinSize(minHeight = 44.dp)
                .alpha(if (enabled) 1f else .5f)
                .semantics {
                    contentDescription = label
                    if (bad) error(error)
                },
            enabled = enabled,
            readOnly = readOnly,
            singleLine = true,
            textStyle = style,
            cursorBrush = SolidColor(c.displayInk),
            keyboardOptions = keyboardOptions,
            visualTransformation = if (password) PasswordVisualTransformation() else VisualTransformation.None,
            interactionSource = source,
            decorationBox = { inner ->
                Box(Modifier.padding(top = if (small) 4.dp else 6.dp, bottom = if (small) 6.dp else 8.dp), contentAlignment = Alignment.CenterStart) {
                    if (value.isEmpty()) BasicText(placeholder, style = style.copy(color = c.muted.copy(alpha = .7f)))
                    inner()
                }
            },
        )
        Box(
            Modifier
                .fillMaxWidth()
                .height(1.dp)
                .background(c.glassLine)
                .drawBehind { drawLine(ink, Offset(0f, size.height / 2), Offset(size.width * draw, size.height / 2), 2.dp.toPx()) },
        )
        if (showCount) {
            BasicText(
                if (maxLength != null) "${value.length} / $maxLength" else "${value.length}",
                Modifier.align(Alignment.End),
                style = Kometa.type.small.copy(color = c.muted, fontFamily = Kometa.fonts.mono),
            )
        }
        if (bad) BasicText(error, style = Kometa.type.small.copy(color = c.error))
    }
}
