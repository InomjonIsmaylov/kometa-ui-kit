package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.FirstBaseline
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** A list of things in the order they happened (`k-trail`); put a [KometaTrailStep] per thing in [content]. */
@Composable
fun KometaTrail(modifier: Modifier = Modifier, content: @Composable ColumnScope.() -> Unit) = Column(modifier, content = content)

/**
 * One step of a [KometaTrail] (`k-step`): the [time] as a large display figure, [content] beside it,
 * and under it the wait to the next step ([gap], "32 min") written on the dashed line that joins them;
 * the wait is the story. The step rises in when it first appears; [delayMs] staggers a list of them.
 */
@Composable
fun KometaTrailStep(time: String, modifier: Modifier = Modifier, gap: String? = null, delayMs: Int = 0, content: @Composable () -> Unit) {
    val c = Kometa.colors
    val rise = remember { Animatable(0f) }
    LaunchedEffect(Unit) { rise.animateTo(1f, tween(520, delayMs, SpringEase)) }
    Column(modifier.graphicsLayer { alpha = rise.value.coerceIn(0f, 1f); translationY = (1f - rise.value) * 8.dp.toPx() }) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            BasicText(
                time,
                Modifier.width(64.dp).alignBy(FirstBaseline),
                style = Kometa.type.title.copy(color = c.displayInk, fontSize = 20.sp, letterSpacing = (-.02).em, fontFeatureSettings = "tnum"),
            )
            Box(Modifier.weight(1f).alignBy(FirstBaseline)) { content() }
        }
        if (gap != null) {
            Row(Modifier.height(30.dp).padding(start = 12.dp), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                Box(
                    Modifier.width(1.dp).fillMaxHeight().drawBehind {
                        drawLine(c.glassLine, Offset(.5f, 0f), Offset(.5f, size.height), 1.dp.toPx(), pathEffect = PathEffect.dashPathEffect(floatArrayOf(3.dp.toPx(), 4.dp.toPx())))
                    },
                )
                BasicText(gap, style = Kometa.type.small.copy(color = c.muted, fontFeatureSettings = "tnum"))
            }
        }
    }
}
