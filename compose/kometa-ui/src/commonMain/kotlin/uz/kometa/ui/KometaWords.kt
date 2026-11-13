package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateMapOf
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.layout.onPlaced
import androidx.compose.ui.layout.positionInParent
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** One word for [KometaWords]. [count] follows it, muted; [hot] (something to do) makes it an amber superscript. */
data class KometaWordOption(val value: String, val label: String, val count: String = "", val hot: Boolean = false)

/**
 * A handful of words with a cream line under the chosen one (`k-words`); the line slides to a newly
 * chosen word. [value] is the chosen word's `value`. A long row scrolls sideways inside its own box
 * and never wraps. [tabs] reads the words as tabs (they switch panels) instead of a choice.
 */
@Composable
fun KometaWords(
    options: List<KometaWordOption>,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    tabs: Boolean = false,
    enabled: Boolean = true,
    description: String = "",
) {
    val c = Kometa.colors
    val density = LocalDensity.current
    // Where each word sits in the row, so the line can travel to the chosen one.
    val spans = remember { mutableStateMapOf<String, Pair<Dp, Dp>>() }
    val target = spans[value]
    val x by animateDpAsState(target?.first ?: 0.dp, tween(280, easing = SpringEase))
    val w by animateDpAsState(target?.second ?: 0.dp, tween(280, easing = SpringEase))

    Box(modifier.horizontalScroll(rememberScrollState()).semantics { if (description.isNotEmpty()) contentDescription = description }) {
        Row(Modifier.selectableGroup(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            options.forEach { opt ->
                val on = opt.value == value
                val source = remember { MutableInteractionSource() }
                val pressed by source.collectIsPressedAsState()
                val ink by animateColorAsState(if (on || pressed) c.text else c.muted, tween(200))
                Row(
                    Modifier
                        .onPlaced { with(density) { spans[opt.value] = it.positionInParent().x.toDp() to it.size.width.toDp() } }
                        .defaultMinSize(minHeight = 44.dp)
                        .alpha(if (enabled) 1f else .5f)
                        .selectable(on, source, indication = null, enabled = enabled, role = if (tabs) Role.Tab else Role.RadioButton) { onValueChange(opt.value) }
                        .padding(top = 8.dp, bottom = 10.dp),
                    horizontalArrangement = Arrangement.spacedBy(6.dp),
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    BasicText(opt.label, style = Kometa.type.md.copy(color = ink, fontSize = 15.sp), maxLines = 1)
                    if (opt.count.isNotEmpty()) {
                        if (opt.hot) BasicText(
                            opt.count,
                            Modifier.align(Alignment.Top).padding(top = 4.dp).offset(x = (-3).dp),
                            style = Kometa.type.mono.copy(color = c.amberInk, fontSize = 10.5.sp, fontWeight = FontWeight.Bold),
                        )
                        else BasicText(opt.count, style = Kometa.type.mono.copy(color = c.muted, fontSize = 11.5.sp))
                    }
                }
            }
        }
        if (target != null) Box(Modifier.align(Alignment.BottomStart).offset(x = x).width(w.coerceAtLeast(0.dp)).height(2.dp).background(c.displayInk))
    }
}
