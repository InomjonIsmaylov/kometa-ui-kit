package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.shadow
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.RectangleShape
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.collapse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.expand
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties

/**
 * One row of [KometaActions]. [danger] (Cancel, No-show) draws it in the error colour; [badge] is a
 * small word after the label (the "PRO" a feature needs); a row that is not [enabled] is dimmed and skipped by the arrow keys.
 */
data class KometaAction(
    val label: String,
    val danger: Boolean = false,
    val badge: String = "",
    val enabled: Boolean = true,
    val run: () -> Unit,
)

/** The next enabled row [step] rows from [from], wrapping round the ends; -1 when no row is enabled. */
internal fun nextEnabled(enabled: List<Boolean>, from: Int, step: Int): Int {
    val n = enabled.size
    var i = from
    repeat(n) {
        i = ((i + step) % n + n) % n
        if (enabled[i]) return i
    }
    return -1
}

private class ActionsPosition(val gap: Int, val pad: Int, val start: Boolean) : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize) =
        // placeBelowOrAbove lines up with the anchor's left edge, so an end-aligned list gets an anchor moved to end at the button's right.
        placeBelowOrAbove(
            if (start) anchorBounds else IntRect(anchorBounds.right - popupContentSize.width, anchorBounds.top, anchorBounds.right, anchorBounds.bottom),
            windowSize, popupContentSize, gap, pad,
        )
}

/**
 * The "more" menu (`k-actions`): a ⋯ button that opens a short list of actions. Not a value chooser
 * (that is [KometaSelect]): each row does something and the list closes. The list is words beside a
 * hairline, with a bar that grows at the row under the pointer or focus; it opens in a popup, so a card
 * cannot clip it, drops below the button or above it when there is no room, and stays inside the window.
 * [alignStart] lines it up with the button's start edge instead of its end. Arrow keys, Home and End
 * move between rows, Enter runs one, Escape closes it and returns focus to the button, Tab or a tap
 * outside just closes it. [icon] replaces the ⋯ (drawn in [LocalKometaContentColor]). [label] is the
 * button's accessible name ("More options"). [open] is hoisted: the button asks [onOpenChange] to flip it.
 */
@Composable
fun KometaActions(
    items: List<KometaAction>,
    label: String,
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    alignStart: Boolean = false,
    icon: (@Composable () -> Unit)? = null,
) {
    val c = Kometa.colors
    val source = remember { MutableInteractionSource() }
    val hovered by source.collectIsHoveredAsState()
    val button = remember { FocusRequester() }

    Box(
        modifier
            .size(44.dp)
            .alpha(if (enabled) 1f else .4f)
            .focusRequester(button)
            .clickable(source, indication = null, enabled = enabled, role = Role.Button) { onOpenChange(!open) }
            .semantics {
                contentDescription = label
                if (open) collapse { onOpenChange(false); true } else expand { onOpenChange(true); true }
            },
        contentAlignment = Alignment.Center,
    ) {
        Box(
            Modifier.size(36.dp).border(1.dp, if ((hovered && enabled) || open) c.glassLine else Color.Transparent, CircleShape),
            contentAlignment = Alignment.Center,
        ) {
            CompositionLocalProvider(LocalKometaContentColor provides c.displayInk) {
                if (icon != null) icon() else BasicText("⋯", style = Kometa.type.md.copy(color = c.displayInk, fontSize = 20.sp, lineHeight = 20.sp))
            }
        }

        if (open) {
            val density = androidx.compose.ui.platform.LocalDensity.current
            val place = remember(alignStart) { with(density) { ActionsPosition(6.dp.roundToPx(), 8.dp.roundToPx(), alignStart) } }
            val rows = remember(items.size) { List(items.size) { FocusRequester() } }
            val can = items.map { it.enabled }
            var at by remember { mutableIntStateOf(-1) }
            val drop = remember { Animatable(0f) }
            // shortcut: the `animation` presets (KometaMotion) are not offered, the list always drops in; add a parameter if a screen needs another entrance.
            LaunchedEffect(Unit) {
                nextEnabled(can, -1, 1).takeIf { it >= 0 }?.let { rows[it].requestFocus() }
                drop.animateTo(1f, tween(320, easing = SpringEase))
            }
            fun close(refocus: Boolean) {
                onOpenChange(false)
                if (refocus) button.requestFocus()
            }
            // shortcut: a window resize or a scroll behind the popup does not close it (the web does); listen for them if a host scrolls under an open menu.
            Popup(
                popupPositionProvider = place,
                onDismissRequest = { close(false) },
                properties = PopupProperties(focusable = true),
            ) {
                Column(
                    Modifier
                        .graphicsLayer {
                            alpha = (drop.value * 1.6f).coerceIn(0f, 1f)
                            translationY = (1f - drop.value) * -8.dp.toPx()
                        }
                        .shadow(14.dp, RectangleShape)
                        .background(c.bg)
                        .drawBehind { drawRect(c.displayInk, size = Size(1.dp.toPx(), size.height)) }
                        .widthIn(min = 200.dp)
                        .width(IntrinsicSize.Max)
                        .padding(vertical = 4.dp)
                        .semantics { contentDescription = label }
                        .onPreviewKeyEvent { e ->
                            if (e.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                            val go = when (e.key) {
                                Key.DirectionDown -> nextEnabled(can, at, 1)
                                Key.DirectionUp -> nextEnabled(can, if (at < 0) 0 else at, -1)
                                Key.MoveHome -> nextEnabled(can, -1, 1)
                                Key.MoveEnd -> nextEnabled(can, items.size, -1)
                                Key.Escape -> { close(true); return@onPreviewKeyEvent true }
                                Key.Tab -> { close(false); return@onPreviewKeyEvent true }
                                else -> return@onPreviewKeyEvent false
                            }
                            if (go >= 0) rows[go].requestFocus()
                            true
                        },
                ) {
                    items.forEachIndexed { i, it ->
                        val rowSource = remember { MutableInteractionSource() }
                        val rowHover by rowSource.collectIsHoveredAsState()
                        val rowFocus by rowSource.collectIsFocusedAsState()
                        val bar by animateFloatAsState(if ((rowHover || rowFocus) && it.enabled) 1f else 0f, tween(280, easing = SpringEase))
                        val ink = if (it.danger) c.red else c.text
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .defaultMinSize(minHeight = 44.dp)
                                .alpha(if (it.enabled) 1f else .4f)
                                .focusRequester(rows[i])
                                .onFocusChanged { f -> if (f.isFocused) at = i }
                                .clickable(rowSource, indication = null, enabled = it.enabled, role = Role.Button) { close(true); it.run() }
                                .drawBehind {
                                    // The bar sits on the hairline (x 0..3dp) between 8dp insets and grows from its middle.
                                    if (bar > 0f) {
                                        val inset = 8.dp.toPx()
                                        val h = (size.height - 2 * inset) * bar
                                        drawRect(c.displayInk, Offset(0f, (size.height - h) / 2), Size(3.dp.toPx(), h))
                                    }
                                }
                                .padding(horizontal = 16.dp),
                            horizontalArrangement = Arrangement.spacedBy(10.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            BasicText(it.label, style = Kometa.type.md.copy(color = ink, fontSize = 15.sp), maxLines = 1)
                            if (it.badge.isNotEmpty()) {
                                Spacer(Modifier.weight(1f))
                                BasicText(
                                    it.badge,
                                    Modifier.border(1.dp, c.amberInk, RoundedCornerShape(4.dp)).padding(horizontal = 6.dp, vertical = 1.dp),
                                    style = Kometa.type.small.copy(color = c.amberInk, letterSpacing = .06.em),
                                )
                            }
                        }
                    }
                }
            }
        }
    }
}
