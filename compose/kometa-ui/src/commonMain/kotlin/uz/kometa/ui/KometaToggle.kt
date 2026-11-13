package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.toggleable
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

internal val SpringEase = CubicBezierEasing(.22f, 1.15f, .36f, 1f)

/**
 * An on/off switch whose state is a word (`k-toggle`): the on word goes cream and a 1dp line
 * draws under it. The caller supplies both words; with neither it draws a track and knob.
 * [label] names the switch for a screen reader, since the visible word is only its state.
 */
@Composable
fun KometaToggle(
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    onLabel: String = "",
    offLabel: String = "",
    label: String = "",
    enabled: Boolean = true,
) {
    val c = Kometa.colors
    val base = modifier
        .defaultMinSize(44.dp, 44.dp)
        .alpha(if (enabled) 1f else .5f)
        .semantics { if (label.isNotEmpty()) contentDescription = label }
        .toggleable(checked, enabled = enabled, role = Role.Switch, onValueChange = onCheckedChange)

    if (onLabel.isEmpty() && offLabel.isEmpty()) {
        val knob by animateDpAsState(if (checked) 16.dp else 0.dp, tween(220))
        val track by animateColorAsState(if (checked) c.displayInk else c.border2, tween(220))
        Box(base, contentAlignment = Alignment.Center) {
            Box(Modifier.size(36.dp, 20.dp).background(track, RoundedCornerShape(10.dp)).padding(2.dp)) {
                Box(Modifier.offset(x = knob).size(16.dp).background(c.bg, CircleShape))
            }
        }
        return
    }

    val ink by animateColorAsState(if (checked) c.displayInk else c.muted, tween(420))
    val line by animateFloatAsState(if (checked) 1f else 0f, tween(420, easing = SpringEase))
    Box(base, contentAlignment = Alignment.Center) {
        BasicText(
            if (checked) onLabel else offLabel,
            Modifier
                .drawBehind { drawLine(c.displayInk, Offset(0f, size.height), Offset(size.width * line, size.height), 1.dp.toPx()) }
                .padding(bottom = 4.dp),
            style = Kometa.type.title.copy(color = ink, fontSize = 15.sp, fontWeight = FontWeight.Bold),
        )
    }
}
