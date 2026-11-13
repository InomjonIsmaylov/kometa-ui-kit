package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.FastOutLinearInEasing
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.CustomAccessibilityAction
import androidx.compose.ui.semantics.customActions
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.IntOffset
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import kotlin.math.roundToInt

/** How many of [ticks] are lit at a pull of [x] px on a row [width] px wide: all of them at half the width. */
internal fun swipeLit(x: Float, width: Float, ticks: Int): Int =
    if (x <= 0f || width <= 0f) 0 else (x / (width / 2) * ticks).toInt().coerceAtMost(ticks)

/**
 * A row that does something when swiped (`k-swipe`). Pulling right fills a row of [ticks] ticks and,
 * released with all of them lit, fires [onSwipeRight] ([rightLabel] is the word beside them). Pulling
 * left grows a ring that turns red past 45% of the width; released there the row slides away and
 * [onSwipeLeft] fires ([leftLabel], [leftIcon]). A side without a label does not pull. Both actions
 * are also offered to screen readers as custom actions. [content] is the row's face.
 */
@Composable
fun KometaSwipe(
    modifier: Modifier = Modifier,
    rightLabel: String = "",
    leftLabel: String = "",
    leftIcon: String = "✕",
    ticks: Int = 12,
    onSwipeRight: () -> Unit = {},
    onSwipeLeft: () -> Unit = {},
    content: @Composable () -> Unit,
) {
    val c = Kometa.colors
    val scope = rememberCoroutineScope()
    val x = remember { Animatable(0f) }
    val right by rememberUpdatedState(onSwipeRight)
    val left by rememberUpdatedState(onSwipeLeft)
    val density = LocalDensity.current

    BoxWithConstraints(
        modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(12.dp))
            .semantics {
                customActions = buildList {
                    if (rightLabel.isNotEmpty()) add(CustomAccessibilityAction(rightLabel) { right(); true })
                    if (leftLabel.isNotEmpty()) add(CustomAccessibilityAction(leftLabel) { left(); true })
                }
            },
    ) {
        val w = with(density) { maxWidth.toPx() }
        val pull = x.value
        val lit = swipeLit(pull, w, ticks)
        val go = lit == ticks
        val red = pull < -w * .45f

        // The layer under the face: ticks on the left, the ring on the right.
        Box(Modifier.matchParentSize().background(if (red) c.red else c.bg).padding(horizontal = 14.dp)) {
            if (pull > 0f && rightLabel.isNotEmpty()) {
                Row(Modifier.align(Alignment.CenterStart), horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                    Row(horizontalArrangement = Arrangement.spacedBy(3.dp), verticalAlignment = Alignment.Bottom) {
                        repeat(ticks) { i ->
                            val h = 8.dp + 12.dp * (i.toFloat() / (ticks - 1).coerceAtLeast(1))
                            Box(Modifier.width(2.dp).height(h).background(if (i < lit) c.displayInk else c.muted.copy(alpha = .45f)))
                        }
                    }
                    BasicText(rightLabel, style = Kometa.type.title.copy(color = if (go) c.displayInk else c.muted, fontSize = 14.sp, fontWeight = FontWeight.Bold))
                }
            }
            if (pull < 0f && leftLabel.isNotEmpty()) {
                val grow = (-pull / (w * .45f)).coerceIn(0f, 1f)
                Box(
                    Modifier
                        .align(Alignment.CenterEnd)
                        .size(36.dp)
                        .graphicsLayer { scaleX = .4f + .7f * grow; scaleY = scaleX }
                        .clip(CircleShape)
                        .border(1.dp, if (red) c.bg else c.displayInk, CircleShape),
                    contentAlignment = Alignment.Center,
                ) {
                    BasicText(leftIcon, style = Kometa.type.md.copy(color = if (red) c.bg else c.displayInk))
                }
            }
        }

        Box(
            Modifier
                .fillMaxWidth()
                .offset { IntOffset(x.value.roundToInt(), 0) }
                .background(c.bg)
                .pointerInput(rightLabel, leftLabel, w) {
                    detectHorizontalDragGestures(
                        onDragEnd = {
                            val at = x.value
                            scope.launch {
                                when {
                                    at > 0f && swipeLit(at, w, ticks) == ticks -> { right(); x.animateTo(0f, tween(500, easing = SpringEase)) }
                                    at < -w * .45f -> {
                                        x.animateTo(-w, tween(300, easing = FastOutLinearInEasing))
                                        left()
                                        delay(400)
                                        x.snapTo(0f)
                                    }
                                    else -> x.animateTo(0f, tween(500, easing = SpringEase))
                                }
                            }
                        },
                        onDragCancel = { scope.launch { x.animateTo(0f, tween(500, easing = SpringEase)) } },
                    ) { change, dx ->
                        change.consume()
                        val max = if (rightLabel.isNotEmpty()) w * .7f else 0f
                        val min = if (leftLabel.isNotEmpty()) -w * .85f else 0f
                        scope.launch { x.snapTo((x.value + dx).coerceIn(min, max)) }
                    }
                },
        ) { content() }
    }
}
