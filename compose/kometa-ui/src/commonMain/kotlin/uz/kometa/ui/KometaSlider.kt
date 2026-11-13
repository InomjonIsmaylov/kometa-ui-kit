package uz.kometa.ui

import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.disabled
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.unit.dp
import kotlin.math.roundToInt

/** Clamps [v] into [min]..[max] and snaps it to a whole [step] from [min]. */
internal fun snapSlider(v: Float, min: Int, max: Int, step: Int): Int {
    val s = step.coerceAtLeast(1)
    return (min + ((v - min) / s).roundToInt() * s).coerceIn(min, max)
}

/**
 * A value chosen by dragging along a row of ticks (`k-slider`): the ticks up to the value stand tall
 * and cream, the rest lie short and dim. A figure "12 / 20 km" sits above. Above 40 steps it draws
 * 25 ticks and scales. TalkBack adjusts it with the usual slider gestures.
 */
@Composable
fun KometaSlider(
    value: Int,
    onValueChange: (Int) -> Unit,
    modifier: Modifier = Modifier,
    min: Int = 0,
    max: Int = 20,
    step: Int = 1,
    unit: String = "",
    label: String = "",
    showFigure: Boolean = true,
    enabled: Boolean = true,
) {
    val current by rememberUpdatedState(value)
    val change by rememberUpdatedState(onValueChange)
    val span = (max - min).coerceAtLeast(1)
    fun at(x: Float, width: Int) = snapSlider(min + x / width.coerceAtLeast(1) * span, min, max, step)
    fun emit(v: Int) { if (v != current) change(v) }

    Column(
        modifier.alpha(if (enabled) 1f else .5f).clearAndSetSemantics {
            if (label.isNotEmpty()) contentDescription = label
            progressBarRangeInfo = ProgressBarRangeInfo(value.toFloat(), min.toFloat()..max.toFloat(), (span / step.coerceAtLeast(1)) - 1)
            if (enabled) setProgress { emit(snapSlider(it, min, max, step)); true } else disabled()
        },
    ) {
        if (showFigure) Figure("$value", " / $max${if (unit.isNotEmpty()) " $unit" else ""}", 22f, .64f)
        val steps = (span / step.coerceAtLeast(1)).coerceAtLeast(1)
        TickRow(
            meterTicks((value - min).toFloat() / span * steps, steps), 26.dp, .4f, 250,
            if (!enabled) Modifier else Modifier
                .pointerInput(min, max, step) { detectTapGestures { emit(at(it.x, size.width)) } }
                .pointerInput(min, max, step) { detectHorizontalDragGestures { ch, _ -> emit(at(ch.position.x, size.width)) } },
        )
    }
}
