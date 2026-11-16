package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.gestures.detectHorizontalDragGestures
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.WindowInsets
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.requiredSize
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBars
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.layout.windowInsetsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberUpdatedState
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.input.pointer.pointerInput
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.paneTitle
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlin.math.abs

/** The viewer's words, for screen readers and the Close button. In [photo], `{n}` is the photo's number. */
data class KometaPhotosLabels(
    val close: String = "Close",
    val prev: String = "Previous",
    val next: String = "Next",
    val rotateLeft: String = "Rotate left",
    val rotateRight: String = "Rotate right",
    val zoomOut: String = "Zoom out",
    val zoomIn: String = "Zoom in",
    val download: String = "Download",
    val photo: String = "Photo {n}",
)

internal const val PHOTOS_MIN_ZOOM = .5f
internal const val PHOTOS_MAX_ZOOM = 3f

/** [index] moved by [step] around the ends of [count] photos (unchanged when there are none). */
internal fun photosWrap(index: Int, step: Int, count: Int): Int = if (count <= 0) index else ((index + step) % count + count) % count

/** The zoom after a step, kept within 0.5x to 3x. */
internal fun photosZoom(zoom: Float, step: Float): Float = (zoom + step).coerceIn(PHOTOS_MIN_ZOOM, PHOTOS_MAX_ZOOM)

/** A turn of an odd number of quarters lays the photo on its side. */
internal fun photosSideways(degrees: Int): Boolean = abs(degrees / 90) % 2 == 1

/** The step a horizontal drag of [dx] dp asks for: a swipe left (over 50dp) is the next photo, right the previous. */
internal fun photosSwipe(dx: Float): Int = if (abs(dx) > 50f) (if (dx < 0) 1 else -1) else 0

/**
 * The full-screen photo viewer (`k-photos`): a dark window over everything with photo [index] of
 * [count] large, the count ("3 / 12"), a toolbar (rotate left and right, zoom out and in, download
 * when [onDownload] is given, and a Close word), arrow keys and a swipe to move, and a strip of
 * thumbnails when there is more than one (and [thumbs]). [open] and [index] are the caller's; Back,
 * Escape and Close call `onOpenChange(false)`. Images are the caller's too: [photo] draws photo `i`
 * filling its box (fit inside, not cropped), [thumb] its square thumbnail (cropped). A new photo, or
 * the viewer reopening, starts upright at 1x.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KometaPhotos(
    count: Int,
    open: Boolean,
    onOpenChange: (Boolean) -> Unit,
    index: Int,
    onIndexChange: (Int) -> Unit,
    photo: @Composable (Int) -> Unit,
    modifier: Modifier = Modifier,
    thumb: @Composable (Int) -> Unit = photo,
    label: String = "",
    labels: KometaPhotosLabels = KometaPhotosLabels(),
    onDownload: ((Int) -> Unit)? = null,
    thumbs: Boolean = true,
) {
    if (!open || index !in 0 until count) return
    val at by rememberUpdatedState(index)
    val move by rememberUpdatedState(onIndexChange)
    fun go(step: Int) = move(photosWrap(at, step, count))
    var zoom by remember(index) { mutableFloatStateOf(1f) }
    var turn by remember(index) { mutableIntStateOf(0) }
    val closeFocus = remember { FocusRequester() }

    DrawerWindow(onDismiss = { onOpenChange(false) }) {
        LaunchedEffect(Unit) { runCatching { closeFocus.requestFocus() } }
        Column(
            modifier.fillMaxSize()
                .background(Color(0xFF08080A).copy(alpha = .94f))
                .windowInsetsPadding(WindowInsets.systemBars)
                .semantics { if (label.isNotEmpty()) paneTitle = label }
                .onKeyEvent {
                    if (it.type != KeyEventType.KeyDown) return@onKeyEvent false
                    when (it.key) {
                        Key.DirectionLeft -> go(-1)
                        Key.DirectionRight -> go(1)
                        else -> return@onKeyEvent false
                    }
                    true
                },
        ) {
            FlowRow(
                Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 12.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                BasicText(
                    "${index + 1} / $count",
                    Modifier.align(Alignment.CenterVertically).alpha(.8f).semantics { liveRegion = LiveRegionMode.Polite },
                    style = Kometa.type.md.copy(color = Color.White),
                )
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
                    PhotosTool("↺", labels.rotateLeft) { turn -= 90 }
                    PhotosTool("↻", labels.rotateRight) { turn += 90 }
                    PhotosTool("−", labels.zoomOut, zoom > PHOTOS_MIN_ZOOM) { zoom = photosZoom(zoom, -.25f) }
                    PhotosTool("+", labels.zoomIn, zoom < PHOTOS_MAX_ZOOM) { zoom = photosZoom(zoom, .25f) }
                    if (onDownload != null) PhotosTool("↓", labels.download) { onDownload(index) }
                    PhotosTool(labels.close, "", modifier = Modifier.focusRequester(closeFocus)) { onOpenChange(false) }
                }
            }
            BoxWithConstraints(
                Modifier.weight(1f).fillMaxWidth().clipToBounds().pointerInput(count) {
                    var dx = 0f
                    detectHorizontalDragGestures(
                        onDragStart = { dx = 0f },
                        onDragEnd = { photosSwipe(dx.toDp().value).let { if (it != 0) go(it) } },
                    ) { _, d -> dx += d }
                },
                contentAlignment = Alignment.Center,
            ) {
                // On its side the photo is laid out in the swapped box, so once turned it still fills the stage.
                val box = if (photosSideways(turn)) Modifier.requiredSize(maxHeight, maxWidth) else Modifier.fillMaxSize()
                Box(box.graphicsLayer { rotationZ = turn.toFloat(); scaleX = zoom; scaleY = zoom }, contentAlignment = Alignment.Center) { photo(index) }
                if (count > 1 && maxWidth >= 768.dp) {
                    PhotosTool("‹", labels.prev, modifier = Modifier.align(Alignment.CenterStart).padding(start = 12.dp)) { go(-1) }
                    PhotosTool("›", labels.next, modifier = Modifier.align(Alignment.CenterEnd).padding(end = 12.dp)) { go(1) }
                }
            }
            if (count > 1 && thumbs) {
                BoxWithConstraints(Modifier.fillMaxWidth()) {
                    Row(
                        // At least the strip's width, so a short strip centres and a long one scrolls from the start.
                        Modifier.horizontalScroll(rememberScrollState()).widthIn(min = maxWidth).padding(horizontal = 16.dp, vertical = 12.dp),
                        horizontalArrangement = Arrangement.spacedBy(8.dp, Alignment.CenterHorizontally),
                    ) {
                        for (i in 0 until count) {
                            val on = i == index
                            val shape = RoundedCornerShape(10.dp)
                            Box(
                                Modifier.size(56.dp).alpha(if (on) 1f else .6f).clip(shape)
                                    .border(2.dp, if (on) Color.White else Color.Transparent, shape)
                                    .clickable(interactionSource = null, indication = null) { move(i) }
                                    .clearAndSetSemantics {
                                        contentDescription = labels.photo.replace("{n}", "${i + 1}")
                                        selected = on
                                    },
                            ) { thumb(i) }
                        }
                    }
                }
            }
        }
    }
}

/** A round 44dp toolbar button in white on glass; a [description] names a symbol, an empty one lets the word speak. */
@Composable
private fun PhotosTool(
    text: String,
    description: String,
    enabled: Boolean = true,
    modifier: Modifier = Modifier,
    onClick: () -> Unit,
) {
    Box(
        modifier.defaultMinSize(44.dp, 44.dp)
            .alpha(if (enabled) 1f else .4f)
            .clip(RoundedCornerShape(22.dp))
            .background(Color.White.copy(alpha = .12f))
            .clickable(interactionSource = null, indication = null, enabled = enabled, role = Role.Button, onClick = onClick)
            .semantics { if (description.isNotEmpty()) contentDescription = description }
            .padding(horizontal = if (description.isEmpty()) 14.dp else 0.dp),
        contentAlignment = Alignment.Center,
    ) {
        BasicText(
            text,
            if (description.isEmpty()) Modifier else Modifier.clearAndSetSemantics {},
            style = Kometa.type.md.copy(color = Color.White, fontSize = if (description.isEmpty()) 14.sp else 20.sp, fontWeight = FontWeight.Bold),
        )
    }
}
