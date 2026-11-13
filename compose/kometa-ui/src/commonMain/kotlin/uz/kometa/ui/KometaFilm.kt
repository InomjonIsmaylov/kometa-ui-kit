package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** One day for [KometaFilm]: the big [label] figure ("14") and a small [sub] weekday under it. A [muted]
 * day has nothing in it but can still be pressed; [dot] is a decorative amber point for "has something". */
data class KometaFilmDay(val value: String, val label: String, val sub: String = "", val muted: Boolean = false, val dot: Boolean = false)

/**
 * A week strip of days (`k-film`) with one glass thumb sliding behind the chosen one. The days share
 * the width equally. [value] is the chosen day's `value`. Put the meaning of a [KometaFilmDay.dot]
 * in its label or [description]: the dot itself is not read out.
 */
@Composable
fun KometaFilm(
    days: List<KometaFilmDay>,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    description: String = "",
) {
    if (days.isEmpty()) return
    val c = Kometa.colors
    val shape = RoundedCornerShape(14.dp)
    val chosen = days.indexOfFirst { it.value == value }
    BoxWithConstraints(modifier.fillMaxWidth().semantics { if (description.isNotEmpty()) contentDescription = description }) {
        val cell = maxWidth / days.size
        val x by animateDpAsState(cell * chosen.coerceAtLeast(0), tween(420, easing = SpringEase))
        if (chosen >= 0) {
            // An offset, not padding: the spring overshoots, and a negative padding throws.
            Box(Modifier.matchParentSize()) {
                Box(
                    Modifier.offset(x = x).width(cell).fillMaxHeight()
                        .clip(shape)
                        .background(c.glass)
                        .drawWithContent { drawContent(); drawLine(Color.White.copy(alpha = .1f), Offset(0f, .5f), Offset(size.width, .5f), 1.dp.toPx()) }
                        .border(1.dp, c.glassLine, shape),
                )
            }
        }
        Row(Modifier.fillMaxWidth().selectableGroup()) {
            days.forEachIndexed { i, day ->
                val on = i == chosen
                val ink by animateColorAsState(if (on) c.displayInk else c.muted, tween(200))
                Box(
                    Modifier
                        .weight(1f)
                        .alpha(if (!enabled) .5f else if (day.muted && !on) .6f else 1f)
                        .clip(shape)
                        .selectable(on, remember { MutableInteractionSource() }, indication = null, enabled = enabled, role = Role.RadioButton) { onValueChange(day.value) }
                        .padding(top = 8.dp, bottom = 10.dp),
                ) {
                    Column(Modifier.fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                        BasicText(day.label, style = Kometa.type.title.copy(color = ink, fontSize = 16.sp, lineHeight = 1.2.em, textAlign = TextAlign.Center), maxLines = 1)
                        if (day.sub.isNotEmpty()) BasicText(day.sub, style = Kometa.type.small.copy(color = ink, lineHeight = 1.2.em), maxLines = 1)
                    }
                    if (day.dot) Box(Modifier.align(Alignment.TopEnd).padding(end = 8.dp).offset(y = (-2).dp).size(5.dp).clip(CircleShape).background(c.amber))
                }
            }
        }
    }
}

