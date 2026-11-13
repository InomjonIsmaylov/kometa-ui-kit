package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * A vertical rail of named steps (`k-steps`) with one cream bead that travels to the [current] one
 * (1-based). Read-only progress, not navigation. [currentLabel] is announced on the current row.
 */
@Composable
fun KometaSteps(steps: List<String>, current: Int, modifier: Modifier = Modifier, currentLabel: String = "current") {
    val c = Kometa.colors
    val row = 30.dp
    val bead by animateDpAsState(row * (current - 1).coerceIn(0, (steps.size - 1).coerceAtLeast(0)), tween(420, easing = SpringEase))
    Box(modifier.horizontalScroll(rememberScrollState())) {
        if (steps.size > 1) Box(Modifier.offset(4.dp, row / 2).width(1.dp).height(row * (steps.size - 1)).alpha(.4f).background(c.muted))
        Box(Modifier.offset(0.dp, (row - 9.dp) / 2 + bead).size(9.dp).background(c.displayInk, CircleShape))
        Column {
            steps.forEachIndexed { i, step ->
                val n = i + 1
                val ink by animateColorAsState(if (n == current) c.displayInk else c.muted, tween(420))
                Box(Modifier.height(row).padding(start = 28.dp).semantics { if (n == current) stateDescription = currentLabel }, contentAlignment = Alignment.CenterStart) {
                    BasicText(
                        step,
                        Modifier.alpha(if (n < current) .6f else 1f),
                        style = if (n == current) Kometa.type.title.copy(color = ink, fontSize = 17.sp, fontWeight = FontWeight.Bold)
                        else Kometa.type.body.copy(color = ink, fontSize = 15.sp),
                        softWrap = false,
                    )
                }
            }
        }
    }
}
