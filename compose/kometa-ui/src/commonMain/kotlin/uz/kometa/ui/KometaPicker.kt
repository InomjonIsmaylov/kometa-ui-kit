package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

public enum class KometaPickerVariant { Button, Zone }

/**
 * The "choose a file" half of an upload (`k-picker`). It draws the control and calls [onPick]; the OS
 * chooser, the accepted types and what to do with the files are the caller's (progress is [KometaUpload]'s).
 * Two shapes, one frame language: [KometaPickerVariant.Button] is a small framed chip with [label]
 * (a "+" before it with [plus]), [KometaPickerVariant.Zone] a corner-marked frame with [label] as its
 * title and a muted [hint]. While [over] (the caller's own drop target has a file over it) or under the
 * pointer, the corners close in and a veil fills the zone from the bottom. [content] is drawn after the
 * label. [contentDescription] overrides the spoken name.
 */
@Composable
public fun KometaPicker(
    label: String,
    onPick: () -> Unit,
    modifier: Modifier = Modifier,
    variant: KometaPickerVariant = KometaPickerVariant.Button,
    hint: String = "",
    enabled: Boolean = true,
    plus: Boolean = false,
    over: Boolean = false,
    contentDescription: String = "",
    content: @Composable () -> Unit = {},
) {
    val c = Kometa.colors
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    // shortcut: keyboard focus closes the frame in like hover instead of the web's amber outline, add a ring if the kit gets one.
    val focused by source.collectIsFocusedAsState()
    val active = over || (enabled && (hovered || focused))
    val shape = RoundedCornerShape(6.dp)
    val base = modifier
        .alpha(if (enabled) 1f else .4f)
        .clip(shape)
        .clickable(source, indication = null, enabled = enabled, role = Role.Button, onClick = onPick)
        .semantics { if (contentDescription.isNotEmpty()) this.contentDescription = contentDescription }

    if (variant == KometaPickerVariant.Button) {
        val line by animateColorAsState(if (active) c.displayInk else c.glassLine, tween(280))
        Row(
            base.border(1.dp, line, shape).defaultMinSize(minHeight = 44.dp).padding(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (plus) BasicText("+", Modifier.clearAndSetSemantics {}, style = Kometa.type.title.copy(color = c.displayInk, fontSize = 16.sp, lineHeight = 1.em))
            BasicText(label, style = Kometa.type.md.copy(color = c.displayInk))
            content()
        }
        return
    }

    val inset by animateFloatAsState(if (active) 6f else 0f, tween(420, easing = SpringEase))
    val veil by animateFloatAsState(if (over) 1f else 0f, tween(520, easing = SpringEase))
    Box(
        base.fillMaxWidth().defaultMinSize(minHeight = 148.dp)
            .drawBehind {
                val v = veil.coerceIn(0f, 1f)
                if (v > 0f) drawRect(c.displayInk.copy(alpha = .07f), Offset(0f, size.height * (1 - v)), Size(size.width, size.height * v))
                val ink = c.displayInk.copy(alpha = .7f)
                val d = inset.dp.toPx()
                val arm = 18.dp.toPx()
                val w = 1.dp.toPx()
                // Four L-shaped corner marks, each moved [d] toward the middle.
                for ((x, y) in listOf(0f to 0f, 1f to 0f, 0f to 1f, 1f to 1f)) {
                    val left = if (x == 0f) d else size.width - d - arm
                    val top = if (y == 0f) d else size.height - d - arm
                    val hx = if (y == 0f) top else top + arm - w
                    val vx = if (x == 0f) left else left + arm - w
                    drawRect(ink, Offset(left, hx), Size(arm, w))
                    drawRect(ink, Offset(vx, top), Size(w, arm))
                }
            }
            .padding(22.dp),
        contentAlignment = Alignment.Center,
    ) {
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
            BasicText(label, style = Kometa.type.title.copy(color = c.displayInk, fontSize = 18.sp, letterSpacing = (-.02).em, textAlign = TextAlign.Center))
            if (hint.isNotEmpty()) BasicText(hint, style = Kometa.type.md.copy(color = c.muted, fontSize = 13.sp, textAlign = TextAlign.Center))
            content()
        }
    }
}
