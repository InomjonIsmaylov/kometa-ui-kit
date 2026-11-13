package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
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
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.StrokeCap
import androidx.compose.ui.graphics.StrokeJoin
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.layout.Layout
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

enum class KometaRowTone { Neutral, Amber, Blue, Green, Violet, Red, Telegram, Danger }

/**
 * The glass panel that holds rows (`k-rows`): a small muted caps [label] above it, and a 1dp hairline
 * between the rows, inset 16dp from the left. Put [KometaRow]s (or anything) in [content]; each child
 * is one row. [description] names a panel that has no visible label.
 */
@Composable
fun KometaRows(
    modifier: Modifier = Modifier,
    label: String = "",
    description: String = "",
    content: @Composable () -> Unit,
) {
    val c = Kometa.colors
    val shape = RoundedCornerShape(20.dp)
    Column(modifier) {
        if (label.isNotEmpty()) {
            BasicText(
                label.uppercase(),
                Modifier.padding(start = 4.dp, bottom = 8.dp).semantics { heading() },
                style = Kometa.type.eyebrow.copy(color = c.muted, fontSize = 11.sp),
            )
        }
        // Where each row starts, written while placing and read while drawing the hairlines.
        val tops = remember { IntArrayHolder() }
        Layout(
            content = content,
            modifier = Modifier
                .fillMaxWidth()
                .clip(shape)
                .background(c.glass)
                .border(1.dp, c.glassLine, shape)
                .semantics { if (label.isEmpty() && description.isNotEmpty()) contentDescription = description }
                .drawWithContent {
                    drawContent()
                    drawLine(Color.White.copy(alpha = .1f), Offset(0f, .5f), Offset(size.width, .5f), 1.dp.toPx())
                    tops.values.drop(1).forEach { y ->
                        drawLine(c.glassLine, Offset(16.dp.toPx(), y + .5f), Offset(size.width, y + .5f), 1.dp.toPx())
                    }
                },
        ) { measurables, constraints ->
            val loose = constraints.copy(minHeight = 0)
            val placeables = measurables.map { it.measure(loose) }
            val height = placeables.sumOf { it.height }.coerceIn(constraints.minHeight, constraints.maxHeight)
            layout(constraints.maxWidth, height) {
                var y = 0
                tops.values = placeables.map { p -> y.also { p.place(0, it); y += p.height } }
            }
        }
    }
}

private class IntArrayHolder { var values: List<Int> = emptyList() }

/**
 * One row of a [KometaRows] panel (`k-row`), in one of two modes.
 *
 * Fact: [label] plus the [end] value, right-aligned and wrapping from the right edge.
 * Setting: [title], an optional [meta] line, an optional leading [icon] tile ([tone] tints it) and
 * the [end] content. An [onClick] makes the whole row one control, 56dp tall, with a pressed wash
 * and a chevron ([chevron] = false leaves it off); without one the row is static and may hold its own
 * controls (a toggle, words). [KometaRowTone.Danger] also reddens the title.
 */
@Composable
fun KometaRow(
    modifier: Modifier = Modifier,
    title: String = "",
    label: String = "",
    meta: String = "",
    tone: KometaRowTone = KometaRowTone.Neutral,
    onClick: (() -> Unit)? = null,
    enabled: Boolean = true,
    chevron: Boolean = true,
    icon: (@Composable () -> Unit)? = null,
    end: @Composable RowScope.() -> Unit = {},
) {
    val c = Kometa.colors
    val fact = label.isNotEmpty()
    val source = remember { MutableInteractionSource() }
    val pressed by source.collectIsPressedAsState()
    val wash by animateColorAsState(Color(128, 128, 128).copy(alpha = if (pressed && onClick != null) .18f else 0f), tween(120))
    val danger = tone == KometaRowTone.Danger

    Row(
        modifier
            .fillMaxWidth()
            .defaultMinSize(minHeight = if (fact) 48.dp else 56.dp)
            .alpha(if (enabled || onClick == null) 1f else .6f)
            .background(wash)
            .then(if (onClick != null) Modifier.clickable(source, indication = null, enabled = enabled, role = Role.Button, onClick = onClick) else Modifier)
            .padding(horizontal = 16.dp, vertical = 10.dp),
        horizontalArrangement = Arrangement.spacedBy(if (fact) 16.dp else 12.dp),
        verticalAlignment = if (fact) Alignment.Top else Alignment.CenterVertically,
    ) {
        if (icon != null && !fact) {
            val (tile, ink) = when (tone) {
                KometaRowTone.Amber -> Color(255, 191, 0).copy(alpha = .14f) to c.amberInk
                KometaRowTone.Blue -> c.blueBg to c.blue
                KometaRowTone.Green -> c.greenBg to c.green
                KometaRowTone.Violet -> c.violetBg to c.violet
                KometaRowTone.Red, KometaRowTone.Danger -> c.redBg to c.red
                KometaRowTone.Telegram -> Color(42, 171, 238).copy(alpha = .15f) to c.text2
                KometaRowTone.Neutral -> c.input to c.text2
            }
            Box(Modifier.size(36.dp).clip(RoundedCornerShape(12.dp)).background(tile), contentAlignment = Alignment.Center) {
                CompositionLocalProvider(LocalKometaContentColor provides ink) { icon() }
            }
        }
        if (fact) {
            BasicText(label, style = Kometa.type.body.copy(color = c.muted, fontSize = 13.sp, fontWeight = FontWeight.SemiBold))
            CompositionLocalProvider(LocalKometaContentColor provides c.text) {
                Row(Modifier.weight(1f), horizontalArrangement = Arrangement.End, content = end)
            }
        } else {
            Column(Modifier.weight(1f), verticalArrangement = Arrangement.spacedBy(2.dp)) {
                BasicText(title, style = Kometa.type.body.copy(color = if (danger) c.red else c.text, fontSize = 15.sp, fontWeight = FontWeight.Bold))
                if (meta.isNotEmpty()) BasicText(meta, style = Kometa.type.body.copy(color = c.muted, fontSize = 13.sp))
            }
            CompositionLocalProvider(LocalKometaContentColor provides c.muted) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically, content = end)
            }
            if (onClick != null && chevron) {
                Canvas(Modifier.size(16.dp)) {
                    val u = size.width / 16
                    val path = Path().apply { moveTo(6 * u, 3 * u); lineTo(11 * u, 8 * u); lineTo(6 * u, 13 * u) }
                    drawPath(path, c.muted, style = Stroke(2.dp.toPx(), cap = StrokeCap.Round, join = StrokeJoin.Round))
                }
            }
        }
    }
}

/** A fact row's value: 15sp semibold, right-aligned, wrapping from the right edge. */
@Composable
fun KometaRowValue(text: String, modifier: Modifier = Modifier) =
    BasicText(text, modifier, style = Kometa.type.body.copy(color = Kometa.colors.text, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, textAlign = TextAlign.End))
