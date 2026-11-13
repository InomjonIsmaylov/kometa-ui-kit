package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.TransformOrigin
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** One lit/dim flag per drawn tick: one per unit, or 25 scaled ticks above 40 units. */
internal fun meterTicks(lit: Float, units: Int): List<Boolean> {
    val count = if (units > 40) 25 else units.coerceAtLeast(1)
    val on = kotlin.math.floor(lit / units.coerceAtLeast(1) * count + .5f).toInt() // half up, like JS Math.round
    return List(count) { it < on }
}

@Composable
internal fun RowScope.Tick(on: Boolean, short: Float, ms: Int) {
    val c = Kometa.colors
    val color by animateColorAsState(if (on) c.displayInk else c.glassLine, tween(ms))
    val scale by animateFloatAsState(if (on) 1f else short, tween(ms, easing = SpringEase))
    Box(
        Modifier.weight(1f).fillMaxHeight()
            .graphicsLayer { scaleY = scale; transformOrigin = TransformOrigin(.5f, 1f) }
            .background(color, RoundedCornerShape(2.dp)),
    )
}

@Composable
internal fun Figure(main: String, rest: String, size: Float, small: Float) {
    val c = Kometa.colors
    BasicText(
        buildAnnotatedString {
            append(main)
            withStyle(SpanStyle(color = c.muted, fontSize = (size * small).sp)) { append(rest) }
        },
        Modifier.padding(bottom = 8.dp),
        style = Kometa.type.title.copy(color = c.displayInk, fontSize = size.sp, letterSpacing = (-.03).em),
    )
}

@Composable
internal fun TickRow(ticks: List<Boolean>, height: Dp, short: Float, ms: Int, modifier: Modifier = Modifier) {
    Row(modifier.fillMaxWidth().height(height), horizontalArrangement = Arrangement.spacedBy(3.dp), verticalAlignment = Alignment.Bottom) {
        ticks.forEach { Tick(it, short, ms) }
    }
}

/**
 * A figure "17 / 25" over one tick per unit (`k-meter`): a remaining unit is bright and tall, a spent
 * one dim and short. Above 40 units it draws 25 ticks and scales; the figure stays exact. Read-only.
 */
@Composable
fun KometaMeter(
    value: Int,
    max: Int,
    modifier: Modifier = Modifier,
    unit: String = "",
    label: String = "",
    showFigure: Boolean = true,
) {
    val v = value.coerceIn(0, max)
    Column(
        modifier.clearAndSetSemantics {
            if (label.isNotEmpty()) contentDescription = label
            progressBarRangeInfo = ProgressBarRangeInfo(v.toFloat(), 0f..max.toFloat().coerceAtLeast(1f))
        },
    ) {
        if (showFigure) Figure("$v", " / $max${if (unit.isNotEmpty()) " $unit" else ""}", 32f, .5625f)
        TickRow(meterTicks(v.toFloat(), max), 28.dp, .45f, 420)
    }
}
