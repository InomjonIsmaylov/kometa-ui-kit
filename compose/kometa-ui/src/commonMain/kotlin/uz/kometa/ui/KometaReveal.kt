package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.aspectRatio
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.graphics.drawscope.clipRect
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.setProgress
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import kotlin.math.roundToInt

/** A reveal position: [p] percent kept within 0..100 and snapped to steps of 5. */
internal fun revealSnap(p: Float): Int = (p.coerceIn(0f, 100f) / 5f).roundToInt() * 5

/**
 * A before and an after picture in one frame (`k-reveal`). A plain line crosses the frame at
 * [position] (0..100, steps of 5, the share that shows [before]); under it a row of 21 ticks, those up
 * to the line cream and the one under it tall. Drag along the ticks or across the frame, or tap one.
 * Screen readers get a slider ([description], "Before 40%, After 60%"). [aspectRatio] is width / height.
 */
@Composable
fun KometaReveal(
    position: Int,
    onPositionChange: (Int) -> Unit,
    before: @Composable () -> Unit,
    after: @Composable () -> Unit,
    modifier: Modifier = Modifier,
    beforeLabel: String = "Before",
    afterLabel: String = "After",
    description: String = "",
    aspectRatio: Float = 1f,
    showLabels: Boolean = true,
) {
    val c = Kometa.colors
    val change by rememberUpdatedState(onPositionChange)
    val p = position.coerceIn(0, 100)
    val at by animateFloatAsState(p / 100f, tween(160))
    val drag = Modifier.pointerInput(Unit) {
        detectTapGestures { change(revealSnap(it.x / size.width * 100)) }
    }.pointerInput(Unit) {
        detectHorizontalDragGestures(onDragStart = { change(revealSnap(it.x / size.width * 100)) }) { e, _ ->
            e.consume(); change(revealSnap(e.position.x / size.width * 100))
        }
    }

    Column(modifier, verticalArrangement = Arrangement.spacedBy(8.dp)) {
        BoxWithConstraints(Modifier.fillMaxWidth().aspectRatio(aspectRatio).clipToBounds().then(drag)) {
            Box(Modifier.fillMaxSize()) { before() }
            Box(Modifier.fillMaxSize().drawWithContent { clipRect(left = size.width * at) { this@drawWithContent.drawContent() } }) { after() }
            Box(Modifier.offset(x = maxWidth * at).width(1.dp).fillMaxHeight().background(c.displayInk.copy(alpha = .8f)))
        }
        Row(
            Modifier
                .fillMaxWidth()
                .height(44.dp)
                .then(drag)
                .semantics(mergeDescendants = true) {
                    if (description.isNotEmpty()) contentDescription = description
                    stateDescription = "$beforeLabel $p%, $afterLabel ${100 - p}%"
                    progressBarRangeInfo = ProgressBarRangeInfo(p.toFloat(), 0f..100f, 19)
                    setProgress { change(revealSnap(it)); true }
                },
            horizontalArrangement = Arrangement.spacedBy(2.dp),
            verticalAlignment = Alignment.Bottom,
        ) {
            val index = p / 5
            repeat(21) { i ->
                val h by animateFloatAsState(if (i == index) 1f else if (i <= index) .7f else .4f, tween(240, easing = SpringEase))
                val ink by animateColorAsState(if (i <= index) c.displayInk else c.glassLine, tween(160))
                Box(Modifier.weight(1f).fillMaxHeight(h.coerceIn(.1f, 1f)).background(ink, RoundedCornerShape(1.dp)))
            }
        }
        if (showLabels) {
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                BasicText(beforeLabel, style = Kometa.type.small.copy(color = c.muted))
                BasicText(afterLabel, style = Kometa.type.small.copy(color = c.muted))
            }
        }
    }
}
