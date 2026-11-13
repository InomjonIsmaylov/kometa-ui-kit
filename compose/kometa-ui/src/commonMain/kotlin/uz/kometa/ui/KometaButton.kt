package uz.kometa.ui

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.RepeatMode
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class KometaSeverity { Primary, Secondary, Danger }
enum class KometaButtonVariant { Filled, Outlined, Text }

/** The colour the content of a Kometa control is drawn in; read it for an icon slot. */
val LocalKometaContentColor = androidx.compose.runtime.compositionLocalOf { Color.Unspecified }

/**
 * The one button (`k-button`). The default is the amber main action — one per screen.
 * [KometaSeverity.Secondary] is the quiet grey pill, [KometaSeverity.Danger] the red one;
 * [variant] draws it as a hairline or a bare word. `small` is the 36dp one; pass
 * `Modifier.fillMaxWidth()` for a fluid button. [loading] shows a spinner and blocks the tap.
 */
@Composable
fun KometaButton(
    label: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    severity: KometaSeverity = KometaSeverity.Primary,
    variant: KometaButtonVariant = KometaButtonVariant.Filled,
    small: Boolean = false,
    enabled: Boolean = true,
    loading: Boolean = false,
    iconRight: Boolean = false,
    icon: (@Composable () -> Unit)? = null,
) {
    val c = Kometa.colors
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val tone = when (severity) {
        KometaSeverity.Primary -> c.amber
        KometaSeverity.Secondary -> c.border
        KometaSeverity.Danger -> c.red
    }
    val fill = when {
        variant != KometaButtonVariant.Filled -> Color.Transparent
        severity == KometaSeverity.Primary && pressed -> c.amber.shade(.78f)
        else -> tone
    }
    val ink = when (variant) {
        KometaButtonVariant.Filled -> when (severity) {
            KometaSeverity.Primary -> c.onAmber
            KometaSeverity.Secondary -> if (pressed) c.text else c.text2
            KometaSeverity.Danger -> Color.White
        }
        else -> when (severity) {
            KometaSeverity.Primary -> c.amberInk
            KometaSeverity.Secondary -> c.text2
            KometaSeverity.Danger -> c.red
        }
    }
    val line = if (variant == KometaButtonVariant.Text) Color.Transparent else tone
    val shape = RoundedCornerShape(50)
    val live = enabled && !loading

    Row(
        modifier
            .defaultMinSize(minHeight = if (small) 36.dp else 48.dp)
            .alpha(if (enabled) 1f else .5f)
            .clip(shape)
            .background(fill, shape)
            .border(BorderStroke(1.dp, line), shape)
            .clickable(source, indication = null, enabled = live, role = Role.Button, onClick = onClick)
            .padding(if (small) PaddingValues(14.dp, 4.dp) else PaddingValues(20.dp, 6.dp)),
        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        CompositionLocalProvider(LocalKometaContentColor provides ink) {
            if (loading) KometaSpinner(ink)
            else if (icon != null && !iconRight) icon()
            BasicText(label, style = Kometa.type.md.copy(color = ink, fontSize = if (small) 13.sp else 14.sp), maxLines = 1)
            if (!loading && icon != null && iconRight) icon()
        }
    }
}

@Composable
internal fun KometaSpinner(color: Color, modifier: Modifier = Modifier) {
    val turn by rememberInfiniteTransition().animateFloat(
        0f, 360f, infiniteRepeatable(tween(700, easing = LinearEasing), RepeatMode.Restart),
    )
    Canvas(modifier.size(14.dp).rotate(turn)) {
        drawArc(color, 0f, 270f, useCenter = false, style = Stroke(2.dp.toPx()))
    }
}
