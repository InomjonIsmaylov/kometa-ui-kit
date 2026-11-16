package uz.kometa.ui

import androidx.compose.animation.core.LinearEasing
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.CornerRadius
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.PathEffect
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.ProgressBarRangeInfo
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.progressBarRangeInfo
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.roundToInt

enum class KometaUploadState { Idle, Running, Done, Failed }

/** How full the zone draws, 0 to 1: [progress] clamped (NaN is 0), and always full once [KometaUploadState.Done]. */
internal fun uploadShown(progress: Float, state: KometaUploadState): Float =
    if (state == KometaUploadState.Done) 1f else if (progress.isNaN()) 0f else progress.coerceIn(0f, 1f)

/**
 * The upload zone (`k-upload`): a dashed box that fills from the bottom behind the file's [name] and
 * [sizeLabel], a big tabular percentage, then the [statusLabel] line and one quiet text button.
 * It is a display: the caller runs the upload and feeds [progress] (0 to 1) and [state]. The button
 * ([actionLabel], none when empty) only calls [onAction]; cancel or retry is the caller's decision.
 * Done draws a solid edge, Failed the error colour. [label] names the progress bar (the file name by default).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KometaUpload(
    name: String,
    modifier: Modifier = Modifier,
    sizeLabel: String = "",
    progress: Float = 0f,
    state: KometaUploadState = KometaUploadState.Idle,
    statusLabel: String = "",
    actionLabel: String = "",
    onAction: () -> Unit = {},
    label: String = "",
    showPercent: Boolean = true,
) {
    val c = Kometa.colors
    val failed = state == KometaUploadState.Failed
    val shown = uploadShown(progress, state)
    val percent = (shown * 100).roundToInt()
    val fill by animateFloatAsState(shown, tween(200, easing = LinearEasing))
    val edge = if (failed) c.error else c.glassLine
    val line = if (failed) c.error else c.displayInk
    val shape = RoundedCornerShape(18.dp)
    Box(
        modifier
            .defaultMinSize(minHeight = 112.dp)
            .clip(shape)
            .drawBehind {
                val top = size.height * (1f - fill)
                drawRect(c.glassLine, Offset(0f, top), Size(size.width, size.height - top))
                if (fill > 0f) drawRect(line, Offset(0f, top), Size(size.width, 1.dp.toPx()))
                val w = 1.dp.toPx()
                val r = 18.dp.toPx()
                drawRoundRect(
                    edge, Offset(w / 2, w / 2), Size(size.width - w, size.height - w), CornerRadius(r),
                    style = Stroke(w, pathEffect = if (state == KometaUploadState.Done) null else PathEffect.dashPathEffect(floatArrayOf(4.dp.toPx(), 3.dp.toPx()))),
                )
            }
            .padding(12.dp),
        contentAlignment = Alignment.Center,
    ) {
        // The bar is the whole zone; its semantics sit on a covering node so the button stays its own stop.
        Box(
            Modifier.matchParentSize().clearAndSetSemantics {
                contentDescription = label.ifEmpty { name }
                progressBarRangeInfo = ProgressBarRangeInfo(percent.toFloat(), 0f..100f)
                stateDescription = statusLabel.ifEmpty { "$percent %" }
            },
        )
        Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(6.dp)) {
            FlowRow(
                horizontalArrangement = Arrangement.spacedBy(10.dp, Alignment.CenterHorizontally),
                verticalArrangement = Arrangement.spacedBy(4.dp),
                modifier = Modifier.clearAndSetSemantics {},
            ) {
                BasicText(name, style = Kometa.type.md.copy(color = c.text, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center))
                if (sizeLabel.isNotEmpty()) BasicText(sizeLabel, style = Kometa.type.md.copy(color = c.muted))
            }
            if (showPercent) Box(Modifier.clearAndSetSemantics {}) { Figure("$percent", " %", 44f, 20f / 44f) }
            if (statusLabel.isNotEmpty() || actionLabel.isNotEmpty()) {
                FlowRow(
                    horizontalArrangement = Arrangement.spacedBy(16.dp, Alignment.CenterHorizontally),
                    verticalArrangement = Arrangement.Center,
                ) {
                    BasicText(
                        statusLabel,
                        Modifier.align(Alignment.CenterVertically).semantics { liveRegion = LiveRegionMode.Polite },
                        style = Kometa.type.small.copy(color = if (failed) c.error else c.muted, textAlign = TextAlign.Center),
                    )
                    if (actionLabel.isNotEmpty()) {
                        Box(
                            Modifier.defaultMinSize(44.dp, 44.dp).clickable(interactionSource = null, indication = null, role = Role.Button, onClick = onAction),
                            contentAlignment = Alignment.Center,
                        ) {
                            BasicText(
                                actionLabel,
                                Modifier.drawBehind { drawRect(c.glassLine, Offset(0f, size.height - 1.dp.toPx()), Size(size.width, 1.dp.toPx())) },
                                style = Kometa.type.md.copy(color = c.displayInk, fontSize = 13.sp),
                            )
                        }
                    }
                }
            }
        }
    }
}
