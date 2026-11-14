package uz.kometa.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandVertically
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.StrokeCap
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
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

private val MenuRows = CubicBezierEasing(.22f, 1f, .36f, 1f)

/** The word the trigger shows: the chosen option's label, else [placeholder]. */
internal fun menuShown(options: List<KometaWordOption>, value: String, placeholder: String): String =
    options.firstOrNull { it.value == value }?.label ?: placeholder

/**
 * A chooser with no floating sheet (`k-menu`): a trigger line (a muted [label] word, the chosen
 * value in the display font, a caret) opens the options in the page as big display words and pushes
 * the content below it down over 420ms. The chosen word is ink with a trailing bead; picking one
 * calls [onValueChange] and closes the list. Escape closes it too. [description] names the control
 * for a screen reader when the prefix word alone is not enough; [placeholder] shows while nothing is chosen.
 */
@Composable
fun KometaMenu(
    options: List<KometaWordOption>,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    label: String = "",
    description: String = "",
    placeholder: String = "",
    enabled: Boolean = true,
) {
    val c = Kometa.colors
    var open by remember { mutableStateOf(false) }
    val turn by animateFloatAsState(if (open) 180f else 0f, tween(420, easing = SpringEase))
    val shown = menuShown(options, value, placeholder)
    val display = Kometa.type.title.copy(fontWeight = FontWeight.Bold)

    // shortcut: no Back handling (not an overlay, foundation 1.7 has no common BackHandler) and no arrow/Home/End focus moves, add when CMP 1.8 brings BackHandler.
    Column(modifier.onPreviewKeyEvent { e ->
        (open && e.type == KeyEventType.KeyDown && e.key == Key.Escape).also { if (it) open = false }
    }) {
        Row(
            Modifier
                .defaultMinSize(minHeight = 44.dp)
                .alpha(if (enabled) 1f else .5f)
                .clickable(enabled = enabled, role = Role.DropdownList) { open = !open }
                .semantics {
                    if (description.isNotEmpty()) contentDescription = description
                    stateDescription = shown
                    if (open) collapse { open = false; true } else expand { open = true; true }
                },
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            if (label.isNotEmpty()) BasicText(label, style = Kometa.type.md.copy(color = c.muted))
            BasicText(
                shown,
                Modifier.weight(1f, fill = false),
                style = display.copy(color = c.displayInk, fontSize = 18.sp, letterSpacing = (-.02).em),
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Canvas(Modifier.size(12.dp).rotate(turn)) {
                val w = 1.5.dp.toPx()
                val u = size.width / 16f
                // The web caret's path: M3 6 l5 5 5-5 in a 16 box.
                drawLine(c.muted, Offset(3 * u, 6 * u), Offset(8 * u, 11 * u), w, StrokeCap.Round)
                drawLine(c.muted, Offset(8 * u, 11 * u), Offset(13 * u, 6 * u), w, StrokeCap.Round)
            }
        }
        AnimatedVisibility(
            open,
            enter = expandVertically(tween(420, easing = MenuRows), expandFrom = Alignment.Top),
            exit = shrinkVertically(tween(420, easing = MenuRows), shrinkTowards = Alignment.Top),
        ) {
            Column(Modifier.selectableGroup().semantics { if (description.isNotEmpty() || label.isNotEmpty()) contentDescription = description.ifEmpty { label } }) {
                options.forEach { o ->
                    val on = o.value == value
                    val ink by animateColorAsState(if (on) c.displayInk else c.muted, tween(420))
                    Row(
                        Modifier
                            .defaultMinSize(minHeight = 44.dp)
                            .selectable(on, role = Role.RadioButton) { onValueChange(o.value); open = false }
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        BasicText(o.label, style = display.copy(color = ink, fontSize = 22.sp, letterSpacing = (-.03).em))
                        if (on) Box(Modifier.size(6.dp).background(ink, CircleShape))
                    }
                }
            }
        }
    }
}
