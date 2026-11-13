package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.CubicBezierEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** What the disc reads: the count, or `max+` above [max]. */
internal fun badgeText(count: Int, max: Int) = if (count > max) "$max+" else "$count"

/**
 * A count on the corner of whatever it wraps (`k-badge`): a cream disc with the figure in mono,
 * that pops each time the count changes. Over [max] it shows `99+`; at zero it is gone unless
 * [showZero]. A screen reader hears [label] (`{n}` is the count) as the wrapped control's state.
 */
@Composable
fun KometaBadge(
    count: Int,
    modifier: Modifier = Modifier,
    max: Int = 99,
    showZero: Boolean = false,
    label: String = "{n} new",
    content: @Composable () -> Unit,
) {
    val c = Kometa.colors
    val shown = count > 0 || showZero
    Box(
        modifier.semantics(mergeDescendants = false) {
            if (shown && label.isNotEmpty()) stateDescription = label.replace("{n}", "$count")
        },
    ) {
        content()
        if (shown) {
            val pop = remember { Animatable(1f) }
            LaunchedEffect(count) { pop.snapTo(.4f); pop.animateTo(1f, tween(450, easing = CubicBezierEasing(.22f, 1.6f, .36f, 1f))) }
            val shape = RoundedCornerShape(50)
            BasicText(
                badgeText(count, max),
                Modifier
                    .align(Alignment.TopEnd)
                    .offset(7.dp, (-5).dp)
                    .graphicsLayer { scaleX = pop.value; scaleY = pop.value }
                    .border(2.dp, c.bg, shape)
                    .padding(2.dp)
                    .background(c.displayInk, shape)
                    .height(17.dp)
                    .defaultMinSize(minWidth = 17.dp)
                    .padding(horizontal = 4.dp)
                    .clearAndSetSemantics {},
                style = Kometa.type.mono.copy(color = c.bg, fontSize = 10.sp, lineHeight = 17.sp, textAlign = TextAlign.Center),
            )
        }
    }
}
