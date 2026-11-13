package uz.kometa.ui

import androidx.compose.foundation.layout.Column
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import kotlin.math.ceil
import kotlin.time.Duration.Companion.seconds
import kotlin.time.TimeSource

/** "0:42", or "1:02:05" from an hour up. */
internal fun countdownFigure(s: Int): String {
    fun pad(n: Int) = n.toString().padStart(2, '0')
    return if (s >= 3600) "${s / 3600}:${pad(s / 60 % 60)}:${pad(s % 60)}" else "${s / 60}:${pad(s % 60)}"
}

/** One flag per tick, true while it still stands: one tick a second, or 30 ticks above 40 seconds. */
internal fun countdownTicks(left: Int, duration: Int): List<Boolean> {
    val span = duration.coerceAtLeast(1)
    val count = if (span > 40) 30 else span
    val standing = ceil(left.coerceIn(0, span).toDouble() / span * count).toInt()
    return List(count) { it < standing }
}

/**
 * Time running out (`k-countdown`): a figure "0:42" and a row of ticks that drain one by one, right to
 * left. [duration] (seconds) is the span the ticks stand for; it counts down from [from] (the whole
 * span by default) from when it is first drawn, and calls [onDone] once at zero. Change [key] to
 * restart it. [description] is read before the time, e.g. "Code expires in".
 */
@Composable
fun KometaCountdown(
    modifier: Modifier = Modifier,
    duration: Int = 60,
    from: Int = duration,
    label: String = "",
    description: String = "",
    key: Any? = Unit,
    onDone: () -> Unit = {},
) {
    var left by remember(key, from) { mutableIntStateOf(from.coerceAtLeast(0)) }
    val done by rememberUpdatedState(onDone)
    LaunchedEffect(key, from) {
        val start = TimeSource.Monotonic.markNow()
        while (left > 0) {
            delay(250)
            left = ceil(from - start.elapsedNow() / 1.seconds).toInt().coerceAtLeast(0)
        }
        done()
    }
    Column(modifier.clearAndSetSemantics { contentDescription = "$description ${countdownFigure(left)}".trim() }) {
        Figure(countdownFigure(left), if (label.isNotEmpty()) "  $label" else "", 22f, 13f / 22f)
        TickRow(countdownTicks(left, duration), 22.dp, .35f, 400)
    }
}
