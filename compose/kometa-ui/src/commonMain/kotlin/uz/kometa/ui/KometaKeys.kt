package uz.kometa.ui

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloat
import androidx.compose.animation.core.infiniteRepeatable
import androidx.compose.animation.core.rememberInfiniteTransition
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** The keys of a shortcut written as `"Ctrl+Shift+P"`, trimmed, empty parts dropped. */
internal fun keysOf(text: String): List<String> = text.split('+').map { it.trim() }.filter { it.isNotEmpty() }

/**
 * How lit key [i] of [n] is at [t] ms into one loop (the web `press` keyframes): key i starts
 * [step] × i ms in, lights over the first 6% of a cycle n × step + 800 ms long, holds to 50% and
 * fades out by 70%.
 */
internal fun keyGlow(t: Float, i: Int, n: Int, step: Int = 400): Float {
    val cycle = n * step + 800f
    val p = (((t - i * step) % cycle + cycle) % cycle) / cycle
    return when {
        p < .06f -> p / .06f
        p < .5f -> 1f
        p < .7f -> 1f - (p - .5f) / .2f
        else -> 0f
    }
}

/**
 * A keyboard shortcut as words in the display font (`k-keys`): `Ctrl + Shift + P`. [keys] is written
 * `"Ctrl+Shift+P"`; [separator] goes between them. [play] lights the keys one after another, as if
 * pressed, on a loop (the web kit's hover start has no touch twin, so here it is a flag).
 */
@Composable
fun KometaKeys(keys: String, modifier: Modifier = Modifier, play: Boolean = false, separator: String = "+") {
    val c = Kometa.colors
    val list = keysOf(keys)
    val cycle = list.size * 400 + 800
    val t = if (play) rememberInfiniteTransition().animateFloat(0f, cycle.toFloat(), infiniteRepeatable(tween(cycle, easing = LinearEasing))) else null
    Row(modifier.semantics(mergeDescendants = true) { contentDescription = list.joinToString(" ") }, verticalAlignment = Alignment.CenterVertically) {
        list.forEachIndexed { i, k ->
            val ink = if (t == null) c.displayInk else lerp(c.muted, c.displayInk, keyGlow(t.value, i, list.size))
            BasicText(k, style = Kometa.type.title.copy(color = ink, fontSize = 15.sp, fontWeight = FontWeight.Bold))
            if (i < list.lastIndex) BasicText(separator, Modifier.padding(horizontal = 4.dp), style = Kometa.type.body.copy(color = c.muted, fontSize = 15.sp))
        }
    }
}
