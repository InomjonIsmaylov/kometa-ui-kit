package uz.kometa.ui

import androidx.compose.animation.core.FastOutSlowInEasing
import androidx.compose.animation.core.animateIntAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** 12480 → "12 480": thousands grouped with a no-break space, the way ru-RU writes them. */
fun groupThousands(n: Long): String {
    val digits = kotlin.math.abs(n).toString().reversed().chunked(3).joinToString(" ").reversed()
    return if (n < 0) "-$digits" else digits
}

/** How many of [ticks] are lit for [shown] out of [max], rounded half up. */
internal fun tallyLit(shown: Int, max: Int, ticks: Int): Int =
    if (max <= 0) 0 else kotlin.math.floor(shown.toDouble() / max * ticks + .5).toInt().coerceIn(0, ticks)

/**
 * A figure that counts to its new value instead of jumping (`k-tally`), with a row of ticks under it
 * that fills to match when it has a [max]. A screen reader hears only the final value. [format] writes
 * the figure; the default groups thousands.
 */
@Composable
fun KometaTally(
    value: Int,
    modifier: Modifier = Modifier,
    max: Int? = null,
    ticks: Int = 30,
    unit: String = "",
    durationMillis: Int = 900,
    format: (Int) -> String = { groupThousands(it.toLong()) },
) {
    val c = Kometa.colors
    val shown by animateIntAsState(value, tween(durationMillis, easing = FastOutSlowInEasing))
    Column(modifier.clearAndSetSemantics { contentDescription = "${format(value)} $unit".trim() }) {
        BasicText(
            buildAnnotatedString {
                append(format(shown))
                if (unit.isNotEmpty()) {
                    withStyle(SpanStyle(color = c.muted, fontSize = 13.sp, fontFamily = Kometa.fonts.sans, letterSpacing = 0.em)) { append("  $unit") }
                }
            },
            style = Kometa.type.title.copy(color = c.displayInk, fontSize = 40.sp, letterSpacing = (-.03).em),
            maxLines = 1,
        )
        if (max != null) {
            val lit = tallyLit(shown, max, ticks)
            TickRow(List(ticks) { it < lit }, 10.dp, .4f, 150, Modifier.padding(top = 10.dp))
        }
    }
}
