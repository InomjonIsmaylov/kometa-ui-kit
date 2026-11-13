package uz.kometa.ui

import androidx.compose.animation.core.MutableTransitionState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.scaleIn
import androidx.compose.animation.fadeIn
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.layout.onSizeChanged
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.IntRect
import androidx.compose.ui.unit.IntSize
import androidx.compose.ui.unit.LayoutDirection
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Popup
import androidx.compose.ui.window.PopupPositionProvider
import androidx.compose.ui.window.PopupProperties

/** Below the anchor when the list fits there, else above it; always kept [pad] px inside the window. */
internal fun placeBelowOrAbove(anchor: IntRect, window: IntSize, list: IntSize, gap: Int, pad: Int): IntOffset {
    val below = anchor.bottom + gap + list.height <= window.height - pad
    val y = if (below) anchor.bottom + gap else maxOf(pad, anchor.top - gap - list.height)
    val x = anchor.left.coerceAtMost(window.width - pad - list.width).coerceAtLeast(pad)
    return IntOffset(x, y)
}

private class DropPosition(val gap: Int, val pad: Int) : PopupPositionProvider {
    override fun calculatePosition(anchorBounds: IntRect, windowSize: IntSize, layoutDirection: LayoutDirection, popupContentSize: IntSize) =
        placeBelowOrAbove(anchorBounds, windowSize, popupContentSize, gap, pad)
}

/**
 * One choice from a list (`k-select`). The field is a line with the chosen word and a chevron; it
 * opens a glass list that drops below it, or above when there is no room, kept inside the window.
 * The chosen row takes the 2dp edge. A tap outside or Back closes it. [label] reads [options] as
 * words; [value] is matched with `==` and with no match the [placeholder] shows. [prefix] is a muted
 * word before the choice ("Role: Owner"); [pill] draws the field as a bordered pill for a toolbar.
 * [description] is the accessible name of the field.
 */
@Composable
fun <T> KometaSelect(
    options: List<T>,
    value: T?,
    onValueChange: (T) -> Unit,
    modifier: Modifier = Modifier,
    label: (T) -> String = { it.toString() },
    placeholder: String = "",
    prefix: String = "",
    pill: Boolean = false,
    description: String = "",
    emptyLabel: String = "",
    enabled: Boolean = true,
) {
    val c = Kometa.colors
    var open by remember { mutableStateOf(false) }
    var width by remember { mutableIntStateOf(0) }
    val chosen = options.indexOf(value).takeIf { it >= 0 }
    val shown = chosen?.let { label(options[it]) } ?: placeholder
    val turn by animateFloatAsState(if (open) 225f else 45f, tween(320, easing = SpringEase))
    val reach by animateFloatAsState(if (open) 1f else .3f, tween(420, easing = SpringEase))
    val density = LocalDensity.current
    val pillShape = RoundedCornerShape(50)

    Box(modifier) {
        Row(
            Modifier
                .then(if (pill) Modifier else Modifier.fillMaxWidth())
                .defaultMinSize(minHeight = if (pill) 36.dp else 44.dp)
                .onSizeChanged { width = it.width }
                .alpha(if (enabled) 1f else .5f)
                .then(
                    if (pill) Modifier.clip(pillShape).background(c.glass, pillShape)
                        .border(1.dp, if (open) c.displayInk else c.glassLine, pillShape)
                    else Modifier.drawBehind {
                        val y = size.height - .5.dp.toPx()
                        drawLine(c.glassLine, Offset(0f, y), Offset(size.width, y), 1.dp.toPx())
                        drawLine(c.displayInk.copy(alpha = .5f + .5f * (reach - .3f) / .7f), Offset(0f, y), Offset(size.width * reach, y), 1.dp.toPx())
                    },
                )
                .clickable(enabled = enabled, role = Role.DropdownList) { open = !open }
                .semantics {
                    if (description.isNotEmpty()) contentDescription = description
                    stateDescription = shown
                }
                .padding(horizontal = if (pill) 12.dp else 0.dp),
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            BasicText(
                buildAnnotatedString {
                    if (prefix.isNotEmpty() && chosen != null) withStyle(SpanStyle(color = c.muted)) { append("$prefix ") }
                    append(shown)
                },
                if (pill) Modifier else Modifier.weight(1f),
                style = Kometa.type.md.copy(
                    color = if (chosen == null) c.muted else c.displayInk,
                    fontWeight = if (pill) FontWeight.SemiBold else FontWeight.Medium,
                ),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Canvas(Modifier.size(8.dp).rotate(turn)) {
                // A chevron: two strokes of an L turned 45° (down) or 225° (up).
                val w = 1.dp.toPx()
                drawLine(c.muted, Offset(size.width, 0f), Offset(size.width, size.height), w)
                drawLine(c.muted, Offset(0f, size.height), Offset(size.width, size.height), w)
            }
        }

        if (open) {
            val gap = with(density) { 6.dp.roundToPx() }
            val pad = with(density) { 8.dp.roundToPx() }
            Popup(
                popupPositionProvider = remember(gap, pad) { DropPosition(gap, pad) },
                onDismissRequest = { open = false },
                properties = PopupProperties(focusable = true),
            ) {
                val shape = RoundedCornerShape(16.dp)
                val state = remember { MutableTransitionState(false).apply { targetState = true } }
                AnimatedVisibility(state, enter = scaleIn(tween(320, easing = SpringEase), initialScale = .96f, transformOrigin = TransformOrigin(.5f, 0f)) + fadeIn(tween(200))) {
                    Column(
                        Modifier
                            .widthIn(min = maxOf(160.dp, with(density) { width.toDp() }))
                            .width(IntrinsicSize.Max)
                            .heightIn(max = 300.dp)
                            .clip(shape)
                            .background(c.card, shape)
                            .border(1.dp, c.glassLine, shape)
                            .verticalScroll(rememberScrollState())
                            .padding(6.dp),
                    ) {
                        if (options.isEmpty() && emptyLabel.isNotEmpty()) {
                            BasicText(emptyLabel.uppercase(), Modifier.padding(12.dp, 8.dp), style = Kometa.type.eyebrow.copy(color = c.muted))
                        }
                        options.forEachIndexed { i, o ->
                            val on = i == chosen
                            BasicText(
                                label(o),
                                Modifier
                                    .fillMaxWidth()
                                    .clip(RoundedCornerShape(10.dp))
                                    .selectable(on, role = Role.RadioButton) { onValueChange(o); open = false }
                                    .drawBehind { if (on) drawRect(c.displayInk, size = size.copy(width = 2.dp.toPx())) }
                                    .padding(12.dp, 11.dp),
                                style = Kometa.type.md.copy(color = if (on) c.displayInk else c.text, fontSize = 15.sp),
                            )
                        }
                    }
                }
            }
        }
    }
}
